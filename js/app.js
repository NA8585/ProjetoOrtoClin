import {
    saveCaseData,
    saveImages,
    saveAnalyses,
    loadCaseData,
    loadImages,
    loadAnalyses
} from './storage.js';

        document.addEventListener('DOMContentLoaded', () => {
            // --- DOM Elements ---
            const mainContent = document.querySelector('.main-content');
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            const canvasContainer = document.getElementById('canvasContainer');
            const uploadArea = document.getElementById('uploadArea');
            const fileInput = document.getElementById('fileInput');
            const uploadProgressContainer = document.getElementById('uploadProgressContainer');
            const uploadProgress = document.getElementById('uploadProgress');
            const uploadError = document.getElementById('uploadError');
            const noImageMessage = document.getElementById('noImageMessage');
            const clinicNameInput = document.getElementById('clinicName');
            const clinicLogoInput = document.getElementById('clinicLogoInput');
            const clinicLogoPreview = document.getElementById('clinicLogoPreview');

            // --- State Variables ---
            let images = []; 
            let analyses = {};
            let currentImageIndex = -1;
            
            // Drawing state
            let currentTool = 'pen';
            let currentColor = '#ff4444';
            let currentStroke = 3;
            let isDrawing = false;
            let startX, startY;
            
            // Canvas transform state
            let zoom = 1;
            let panX = 0;
            let panY = 0;
            let isPanning = false;
            let lastPanX, lastPanY;

            const MAX_FILE_SIZE_MB = 5;
            const MAX_EXPORT_DIMENSION = 1200;
            // History
            let history = [];
            let historyStep = -1;
            
            const init = () => {
                loadFromLocalStorage();
                setupEventListeners();
                setupDragAndDrop();
                setupMobileNav();
                renderGallery();
                updateUI();
                if (images.length > 0) {
                    selectImage(0);
                } else {
                    mainContent.classList.add('view-canvas');
                }
            };
            
            // --- Data Persistence ---
            const saveToLocalStorage = () => {
                const caseData = {
                    patientName: document.getElementById('patientName').value,
                    dentistName: document.getElementById('dentistName').value,
                    entryDate: document.getElementById('entryDate').value,
                    caseStatus: document.getElementById('caseStatus').value,
                    clinicName: clinicNameInput.value,
                    clinicLogo: clinicLogoPreview.src || ''
                };

                saveCaseData(caseData);
                saveImages(images);
                saveAnalyses(analyses);
            };
            
            const loadFromLocalStorage = () => {
                const caseData = loadCaseData();
                if (caseData) {
                    document.getElementById('patientName').value = caseData.patientName || '';
                    document.getElementById('dentistName').value = caseData.dentistName || '';
                    document.getElementById('entryDate').value = caseData.entryDate || new Date().toISOString().split('T')[0];
                    document.getElementById('caseStatus').value = caseData.caseStatus || 'pending';
                    clinicNameInput.value = caseData.clinicName || '';
                    if (caseData.clinicLogo) {
                        clinicLogoPreview.src = caseData.clinicLogo;
                        clinicLogoPreview.style.display = 'block';
                    }
                } else {
                    document.getElementById('entryDate').value = new Date().toISOString().split('T')[0];
                }

                const storedImages = loadImages();
                const storedAnalyses = loadAnalyses();
                
                if (storedAnalyses) analyses = storedAnalyses;

                if (storedImages && storedImages.length > 0) {
                    let loadedCount = 0;
                    images = storedImages.map(sImg => {
                        const img = new Image();
                        img.src = sImg.img;
                        img.onload = () => {
                            loadedCount++;
                             if (loadedCount === storedImages.length) {
                                renderGallery();
                                if(currentImageIndex === -1) selectImage(0);
                            }
                        };
                        return { ...sImg, img: img };
                    });
                }
            };

            // --- Event Listeners ---
            const setupEventListeners = () => {
                ['patientName', 'dentistName', 'entryDate', 'caseStatus', 'clinicName'].forEach(id => {
                    document.getElementById(id).addEventListener('change', saveToLocalStorage);
                });

                clinicLogoInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                        clinicLogoPreview.src = reader.result;
                        clinicLogoPreview.style.display = 'block';
                        saveToLocalStorage();
                    };
                    reader.readAsDataURL(file);
                });
                
                uploadArea.addEventListener('click', () => fileInput.click());
                fileInput.addEventListener('change', handleFilesUpload);
                document.querySelectorAll('.tool-btn').forEach(btn => btn.addEventListener('click', () => selectTool(btn.dataset.tool)));
                document.querySelectorAll('.color-option').forEach(opt => opt.addEventListener('click', () => selectColor(opt.dataset.color)));
                document.getElementById('strokeWidth').addEventListener('input', (e) => {
                    currentStroke = e.target.value;
                    document.getElementById('strokeValue').textContent = currentStroke;
                });

                ['brightness', 'contrast'].forEach(id => {
                    document.getElementById(id).addEventListener('input', () => {
                        updateImageFilters();
                        document.getElementById(`${id}Value`).textContent = document.getElementById(id).value;
                    });
                });

                document.getElementById('undoBtn').addEventListener('click', undo);
                document.getElementById('redoBtn').addEventListener('click', redo);
                document.getElementById('clearBtn').addEventListener('click', clearAnnotations);
                document.getElementById('duplicateBtn').addEventListener('click', duplicateImage);
                
                canvas.addEventListener('mousedown', handleMouseDown);
                canvas.addEventListener('mousemove', handleMouseMove);
                canvas.addEventListener('mouseup', handleMouseUp);
                canvas.addEventListener('mouseout', handleMouseUp);
                canvas.addEventListener('wheel', handleWheel, { passive: false });
                
                // Touch events for panning and drawing
                canvas.addEventListener('touchstart', (e) => handleMouseDown(e.touches[0]), { passive: false });
                canvas.addEventListener('touchmove', (e) => handleMouseMove(e.touches[0]), { passive: false });
                canvas.addEventListener('touchend', handleMouseUp, { passive: false });


                document.getElementById('zoomIn').addEventListener('click', () => applyZoom(1.2));
                document.getElementById('zoomOut').addEventListener('click', () => applyZoom(0.8));
                document.getElementById('fitToScreen').addEventListener('click', fitToScreen);
                document.getElementById('resetZoom').addEventListener('click', resetTransform);
                
                ['imageTitle', 'analysisType', 'clinicalObservations', 'treatmentPlan'].forEach(id => {
                    document.getElementById(id).addEventListener('input', saveCurrentAnalysis);
                });
                document.getElementById('saveAnalysis').addEventListener('click', () => {
                    saveCurrentAnalysis();
                    const btn = document.getElementById('saveAnalysis');
                    btn.innerHTML = '✅ Salvo!';
                    setTimeout(() => btn.innerHTML = '💾 Salvar Análise', 2000);
                });
                document.getElementById('exportCase').addEventListener('click', exportCase);
                document.getElementById('exportJSON').addEventListener('click', exportJSON);

                document.addEventListener('keydown', (e) => {
                    const key = e.key.toLowerCase();
                    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === 'z') {
                        e.preventDefault();
                        undo();
                    } else if ((e.ctrlKey || e.metaKey) && (key === 'y' || (e.shiftKey && key === 'z'))) {
                        e.preventDefault();
                        redo();
                    }
                });
            };

             // --- Mobile Navigation ---
            const setupMobileNav = () => {
                const mobileNavButtons = document.querySelectorAll('.mobile-nav-btn');
                mobileNavButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const view = btn.dataset.view;
                        
                        mainContent.classList.remove('view-tools', 'view-canvas', 'view-docs');
                        mainContent.classList.add(`view-${view}`);

                        mobileNavButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');

                        // Recalculate canvas size when switching to it on mobile
                        if (view === 'canvas') {
                           setTimeout(fitToScreen, 50);
                        }
                    });
                });
            };

            const renderGallery = () => {
                const galleryGrid = document.getElementById('imageGallery');
                galleryGrid.innerHTML = '';
                images.forEach((imgData, index) => {
                    const thumb = document.createElement('div');
                    thumb.className = 'image-thumb';
                    thumb.dataset.index = index;
                    thumb.onclick = () => {
                        selectImage(index);
                        // On mobile, switch to canvas view automatically when a thumb is clicked
                        if(window.innerWidth <= 900) {
                            document.querySelector('.mobile-nav-btn[data-view="canvas"]').click();
                        }
                    };

                    const img = document.createElement('img');
                    img.src = imgData.img.src;
                    
                    const status = document.createElement('div');
                    status.className = `status-indicator ${analyses[imgData.id] && analyses[imgData.id].title ? 'analyzed' : 'pending'}`;

                    thumb.appendChild(img);
                    thumb.appendChild(status);
                    galleryGrid.appendChild(thumb);
                });
                 updateUI();
            };

            const handleFilesUpload = (e) => {
                handleFiles(e.target.files);
            };

            const handleFiles = (files) => {
                const errors = [];
                const list = [...files].filter(f => {
                    const validType = f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.dcm');
                    const validSize = f.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
                    if (!validType) errors.push(`${f.name} possui tipo inválido`);
                    if (!validSize) errors.push(`${f.name} excede ${MAX_FILE_SIZE_MB}MB`);
                    return validType && validSize;
                });

                if (errors.length > 0) {
                    uploadError.innerHTML = errors.join('<br>');
                    uploadError.style.display = 'block';
                    setTimeout(() => { uploadError.style.display = 'none'; }, 5000);
                }

                if (list.length === 0) return;

                uploadProgressContainer.style.display = 'block';
                let processed = 0;

                list.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const newImage = {
                                id: Date.now() + Math.random(),
                                name: file.name,
                                img: img,
                                annotations: []
                            };
                            images.push(newImage);
                            analyses[newImage.id] = {};
                            renderGallery();
                            selectImage(images.length - 1);
                            saveToLocalStorage();

                            processed++;
                            uploadProgress.style.width = `${Math.round(processed / list.length * 100)}%`;
                            if (processed === list.length) {
                                setTimeout(() => {
                                    uploadProgressContainer.style.display = 'none';
                                    uploadProgress.style.width = '0%';
                                }, 500);
                            }
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            };
            
            const selectImage = (index) => {
                if (index < 0 || index >= images.length) return;
                
                if (currentImageIndex !== -1) saveCurrentAnalysis();
                
                currentImageIndex = index;
                const imageData = images[currentImageIndex];
                
                resetTransform();
                
                history = [copyAnnotations(imageData.annotations)];
                historyStep = 0;
                
                loadAnalysis(imageData.id);
                redraw();
                updateActiveThumb();
                updateUI();
                updateUndoRedoButtons();
                fitToScreen();
            };
            
            // --- Most of the other functions (drawing, analysis, etc.) remain the same ---
            // The following are stubs for brevity, but the full logic is in the previous version
            const updateUI = () => {
                const hasImages = images.length > 0;
                const imageSelected = currentImageIndex !== -1;
                noImageMessage.style.display = hasImages ? 'none' : 'flex';
                canvas.style.display = hasImages ? 'block' : 'none';

                document.getElementById('clearBtn').disabled = !imageSelected;
                document.getElementById('duplicateBtn').disabled = !imageSelected;
                document.getElementById('imageCounter').textContent = imageSelected ? `Img ${currentImageIndex + 1}/${images.length}` : 'Nenhuma';
            };
            const updateActiveThumb = () => {
                document.querySelectorAll('.image-thumb').forEach((thumb, index) => {
                    thumb.classList.toggle('active', index === currentImageIndex);
                });
            };
            const duplicateImage = () => {
                if (currentImageIndex === -1) return;
                const original = images[currentImageIndex];
                const newImage = {
                    id: Date.now() + Math.random(),
                    name: `${original.name} (cópia)`,
                    img: original.img, 
                    annotations: copyAnnotations(original.annotations)
                };
                images.push(newImage);
                analyses[newImage.id] = { ...analyses[original.id] };
                renderGallery();
                selectImage(images.length - 1);
                saveToLocalStorage();
            };
            const getMousePos = (e) => {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: (e.clientX - rect.left) / zoom - (panX / zoom),
                    y: (e.clientY - rect.top) / zoom - (panY / zoom)
                };
            };
            const handleMouseDown = (e) => {
                if (e.preventDefault) e.preventDefault();
                if (currentImageIndex === -1) return;
                
                if (e.button === 1 || e.button === 2) {
                    isPanning = true;
                    canvas.style.cursor = 'grabbing';
                    lastPanX = e.clientX;
                    lastPanY = e.clientY;
                    return;
                }
                
                isDrawing = true;
                const pos = getMousePos(e);
                startX = pos.x;
                startY = pos.y;
                
                if (currentTool === 'pen') {
                    images[currentImageIndex].annotations.push({
                        type: 'pen', color: currentColor, stroke: currentStroke,
                        points: [{ x: startX, y: startY }]
                    });
                }
            };
            const handleMouseMove = (e) => {
                if (e.preventDefault) e.preventDefault();
                if (isPanning) {
                    panX += e.clientX - lastPanX;
                    panY += e.clientY - lastPanY;
                    lastPanX = e.clientX;
                    lastPanY = e.clientY;
                    redraw();
                    return;
                }
                if (!isDrawing) return;
                
                const pos = getMousePos(e);
                if (currentTool === 'pen') {
                    const currentAnnotations = images[currentImageIndex].annotations;
                    currentAnnotations[currentAnnotations.length - 1].points.push({ x: pos.x, y: pos.y });
                }
                redraw(true, e);
            };
            const handleMouseUp = (e) => {
                if (isPanning) { isPanning = false; selectTool(currentTool); return; }
                if (!isDrawing) return;
                
                isDrawing = false;
                const pos = getMousePos(e);
                const currentAnnotations = images[currentImageIndex].annotations;
                
                if (['line', 'arrow', 'circle', 'rectangle'].includes(currentTool)) {
                     currentAnnotations.push({
                        type: currentTool, color: currentColor, stroke: currentStroke,
                        x1: startX, y1: startY, x2: pos.x, y2: pos.y
                    });
                } else if (currentTool === 'text') {
                    const text = prompt('Digite o texto:');
                    if (text) {
                        currentAnnotations.push({
                           type: 'text', color: currentColor, stroke: currentStroke,
                           x: pos.x, y: pos.y, text: text
                        });
                    }
                } else if (currentTool === 'eraser') {
                     const eraserSize = currentStroke * 2;
                     images[currentImageIndex].annotations = currentAnnotations.filter(ann => {
                        if (ann.type === 'pen') {
                           return !ann.points.some(p => Math.abs(p.x - pos.x) < eraserSize && Math.abs(p.y - pos.y) < eraserSize);
                        }
                        return true;
                     });
                }
                
                saveHistory();
                redraw();
                updateAnalysisStatus();
            };
             const handleWheel = (e) => {
                e.preventDefault();
                const scaleAmount = 1.1;
                const delta = e.deltaY > 0 ? 1 / scaleAmount : scaleAmount;
                applyZoom(delta, e.clientX, e.clientY);
            };
            const redraw = (preview = false, event = null) => {
                if (currentImageIndex === -1) return;
                const imageData = images[currentImageIndex];
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.translate(panX, panY);
                ctx.scale(zoom, zoom);
                ctx.drawImage(imageData.img, 0, 0);
                drawAnnotations(imageData.annotations);
                if (preview && isDrawing && ['line', 'arrow', 'circle', 'rectangle'].includes(currentTool)) {
                    const pos = getMousePos(event);
                    drawAnnotations([{
                        type: currentTool, color: currentColor, stroke: currentStroke,
                        x1: startX, y1: startY, x2: pos.x, y2: pos.y
                    }]);
                }
                ctx.restore();
            };
             const drawAnnotations = (annotations) => {
                annotations.forEach(ann => {
                    ctx.strokeStyle = ann.color;
                    ctx.fillStyle = ann.color;
                    ctx.lineWidth = ann.stroke / zoom;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    switch(ann.type) {
                        case 'pen': ann.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke(); break;
                        case 'line': ctx.moveTo(ann.x1, ann.y1); ctx.lineTo(ann.x2, ann.y2); ctx.stroke(); break;
                        case 'arrow': drawArrow(ann.x1, ann.y1, ann.x2, ann.y2, ann.stroke); break;
                        case 'circle': const r = Math.hypot(ann.x2 - ann.x1, ann.y2 - ann.y1); ctx.arc(ann.x1, ann.y1, r, 0, 2 * Math.PI); ctx.stroke(); break;
                        case 'rectangle': ctx.strokeRect(ann.x1, ann.y1, ann.x2 - ann.x1, ann.y2 - ann.y1); break;
                        case 'text': ctx.font = `${(ann.stroke * 4) / zoom}px Roboto`; ctx.fillText(ann.text, ann.x, ann.y); break;
                    }
                });
            };
            const drawArrow = (x1, y1, x2, y2, stroke) => {
                const headLength = Math.max(10, stroke * 3) / zoom;
                const angle = Math.atan2(y2 - y1, x2 - x1);
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x2 - headLength * Math.cos(angle - Math.PI / 6), y2 - headLength * Math.sin(angle - Math.PI / 6));
                ctx.moveTo(x2, y2);
                ctx.lineTo(x2 - headLength * Math.cos(angle + Math.PI / 6), y2 - headLength * Math.sin(angle + Math.PI / 6));
                ctx.stroke();
            };

            const drawAnnotationsScaled = (context, annotations) => {
                context.lineCap = 'round';
                context.lineJoin = 'round';
                annotations.forEach(ann => {
                    context.strokeStyle = ann.color;
                    context.fillStyle = ann.color;
                    context.lineWidth = ann.stroke;
                    context.beginPath();
                    switch(ann.type) {
                        case 'pen':
                            ann.points.forEach((p, i) => i === 0 ? context.moveTo(p.x, p.y) : context.lineTo(p.x, p.y));
                            context.stroke();
                            break;
                        case 'line':
                            context.moveTo(ann.x1, ann.y1);
                            context.lineTo(ann.x2, ann.y2);
                            context.stroke();
                            break;
                        case 'arrow': {
                            const headLength = Math.max(10, ann.stroke * 3);
                            const angle = Math.atan2(ann.y2 - ann.y1, ann.x2 - ann.x1);
                            context.moveTo(ann.x1, ann.y1);
                            context.lineTo(ann.x2, ann.y2);
                            context.lineTo(ann.x2 - headLength * Math.cos(angle - Math.PI / 6), ann.y2 - headLength * Math.sin(angle - Math.PI / 6));
                            context.moveTo(ann.x2, ann.y2);
                            context.lineTo(ann.x2 - headLength * Math.cos(angle + Math.PI / 6), ann.y2 - headLength * Math.sin(angle + Math.PI / 6));
                            context.stroke();
                            break;
                        }
                        case 'circle':
                            const r = Math.hypot(ann.x2 - ann.x1, ann.y2 - ann.y1);
                            context.arc(ann.x1, ann.y1, r, 0, 2 * Math.PI);
                            context.stroke();
                            break;
                        case 'rectangle':
                            context.strokeRect(ann.x1, ann.y1, ann.x2 - ann.x1, ann.y2 - ann.y1);
                            break;
                        case 'text':
                            context.font = `${ann.stroke * 4}px Roboto`;
                            context.fillText(ann.text, ann.x, ann.y);
                            break;
                    }
                });
            };
             const applyZoom = (factor, clientX, clientY) => {
                const rect = canvas.getBoundingClientRect();
                const mouseX = (clientX ?? rect.left + rect.width / 2) - rect.left;
                const mouseY = (clientY ?? rect.top + rect.height / 2) - rect.top;
                
                const oldZoom = zoom;
                zoom = Math.max(0.1, Math.min(zoom * factor, 10));
                
                panX = mouseX - (mouseX - panX) * (zoom / oldZoom);
                panY = mouseY - (mouseY - panY) * (zoom / oldZoom);
                
                document.getElementById('zoomLevel').textContent = `${Math.round(zoom * 100)}%`;
                redraw();
            };

            const fitToScreen = () => {
                if (currentImageIndex === -1) return;
                const imageData = images[currentImageIndex];
                const container = canvasContainer;
                canvas.width = container.clientWidth;
                canvas.height = container.clientHeight;
                
                const scaleX = canvas.width / imageData.img.width;
                const scaleY = canvas.height / imageData.img.height;
                zoom = Math.min(scaleX, scaleY);

                panX = (canvas.width - imageData.img.width * zoom) / 2;
                panY = (canvas.height - imageData.img.height * zoom) / 2;
                
                document.getElementById('zoomLevel').textContent = `${Math.round(zoom * 100)}%`;
                redraw();
            };
            
            const resetTransform = () => {
                const imageData = images[currentImageIndex];
                if (!imageData) return;
                zoom = 1;
                panX = (canvas.width - imageData.img.width) / 2;
                panY = (canvas.height - imageData.img.height) / 2;
                document.getElementById('zoomLevel').textContent = '100%';
                redraw();
            };
            const selectTool = (tool) => {
                currentTool = tool;
                document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tool === tool));
                const toolNames = {pen: 'Desenho', line: 'Linha', arrow: 'Seta', circle: 'Círculo', rectangle: 'Retângulo', text: 'Texto', eraser: 'Borracha'};
                document.getElementById('toolStatus').textContent = toolNames[tool] || 'Ferramenta';
                canvas.style.cursor = tool === 'text' ? 'text' : (isPanning ? 'grabbing' : 'crosshair');
            };
            const selectColor = (color) => {currentColor = color; document.querySelectorAll('.color-option').forEach(opt => opt.classList.toggle('active', opt.dataset.color === color)); };
            const updateImageFilters = () => {
                const brightness = document.getElementById('brightness').value;
                const contrast = document.getElementById('contrast').value;
                canvas.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
            };
            const copyAnnotations = (annotations) => JSON.parse(JSON.stringify(annotations));
            const saveHistory = () => {
                historyStep++;
                if (historyStep < history.length) { history.length = historyStep; }
                history.push(copyAnnotations(images[currentImageIndex].annotations));
                updateUndoRedoButtons();
            };
            const undo = () => {
                if (historyStep > 0) {
                    historyStep--;
                    images[currentImageIndex].annotations = copyAnnotations(history[historyStep]);
                    redraw();
                    updateUndoRedoButtons();
                }
            };
            const redo = () => {
                if (historyStep < history.length - 1) {
                    historyStep++;
                    images[currentImageIndex].annotations = copyAnnotations(history[historyStep]);
                    redraw();
                    updateUndoRedoButtons();
                }
            };
            const updateUndoRedoButtons = () => {
                document.getElementById('undoBtn').disabled = historyStep <= 0;
                document.getElementById('redoBtn').disabled = historyStep >= history.length - 1;
            };
            const clearAnnotations = () => {
                if (confirm('Apagar todas as anotações?')) {
                    images[currentImageIndex].annotations = [];
                    saveHistory(); redraw(); updateAnalysisStatus();
                }
            };
            const saveCurrentAnalysis = () => {
                if (currentImageIndex === -1) return;
                const imageId = images[currentImageIndex].id;
                analyses[imageId] = {
                    title: document.getElementById('imageTitle').value,
                    type: document.getElementById('analysisType').value,
                    observations: document.getElementById('clinicalObservations').value,
                    treatmentPlan: document.getElementById('treatmentPlan').value,
                };
                updateAnalysisStatus();
                saveToLocalStorage();
            };
            const loadAnalysis = (imageId) => {
                 const analysis = analyses[imageId] || {};
                 document.getElementById('imageTitle').value = analysis.title || '';
                 document.getElementById('analysisType').value = analysis.type || '';
                 document.getElementById('clinicalObservations').value = analysis.observations || '';
                 document.getElementById('treatmentPlan').value = analysis.treatmentPlan || '';
                 
                 const info = document.getElementById('imageInfo');
                 info.innerHTML = `
                    <p><strong>Nome:</strong> ${images[currentImageIndex].name}</p>
                    <p><strong>Dimensões:</strong> ${images[currentImageIndex].img.width} x ${images[currentImageIndex].img.height}</p>
                    <p><strong>Status:</strong> ${analyses[imageId]?.title ? 'Analisada' : 'Pendente'}</p>
                 `;
            };
            const updateAnalysisStatus = () => {
                 if (currentImageIndex === -1) return;
                 const imageId = images[currentImageIndex].id;
                 const thumb = document.querySelector(`.image-thumb[data-index="${currentImageIndex}"]`);
                 if (thumb) {
                     const status = thumb.querySelector('.status-indicator');
                     status.className = `status-indicator ${analyses[imageId]?.title ? 'analyzed' : 'pending'}`;
                 }
            };
            const setupDragAndDrop = () => {
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eName => {
                    document.body.addEventListener(eName, e => { e.preventDefault(); e.stopPropagation(); }, false);
                });
                ['dragenter', 'dragover'].forEach(eName => {
                    uploadArea.addEventListener(eName, () => uploadArea.classList.add('dragover'), false);
                });
                ['dragleave', 'drop'].forEach(eName => {
                    uploadArea.addEventListener(eName, () => uploadArea.classList.remove('dragover'), false);
                });
                uploadArea.addEventListener('drop', e => handleFiles(e.dataTransfer.files), false);
            };
            const exportCase = () => {
                const caseData = loadCaseData() || {};
                
                let reportHtml = `
                    <!DOCTYPE html><html lang="pt-BR"><head><title>Relatório</title>
                    <style>
                        body { font-family: 'Segoe UI', sans-serif; margin: 20px; line-height: 1.6; }
                        .container { max-width: 800px; margin: auto; } h1, h2, h3 { color: #0c1e3e; }
                        .header { text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px; margin-bottom: 30px; }
                        .case-info, .image-analysis { background: #f0f2f5; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #ddd; }
                        strong { color: #1a3a6d; } pre { background: #eee; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
                        img { max-width: 100%; border-radius: 5px; margin-top: 15px; }
                    </style></head><body><div class="container">
                    <div class="header">
                        ${caseData.clinicLogo ? `<img src="${caseData.clinicLogo}" style="max-height:80px; margin-bottom:10px;" />` : ''}
                        <h1>${caseData.clinicName || 'Consultoria Ortodôntica'}</h1>
                        <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
                    </div>
                    <div class="case-info"><h2>Informações do Caso</h2>
                        <p><strong>Paciente:</strong> ${caseData.patientName || 'Não informado'}</p>
                        <p><strong>Dentista:</strong> ${caseData.dentistName || 'Não informado'}</p>
                        <p><strong>Data:</strong> ${caseData.entryDate || 'Não informada'}</p>
                    </div>
                `;

                images.forEach((imgData, index) => {
                    const analysis = analyses[imgData.id] || {};
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');

                    const scale = Math.min(1, MAX_EXPORT_DIMENSION / Math.max(imgData.img.width, imgData.img.height));
                    tempCanvas.width = imgData.img.width * scale;
                    tempCanvas.height = imgData.img.height * scale;
                    tempCtx.scale(scale, scale);
                    tempCtx.drawImage(imgData.img, 0, 0);
                    drawAnnotationsScaled(tempCtx, imgData.annotations);
                    const annotatedImageURL = tempCanvas.toDataURL('image/jpeg', 0.85);

                    reportHtml += `
                        <div class="image-analysis">
                            <h3>Imagem ${index + 1}: ${analysis.title || imgData.name}</h3>
                            <p><strong>Tipo:</strong> ${analysis.type || 'N/A'}</p>
                            <h4>Observações:</h4><pre>${analysis.observations || 'N/A'}</pre>
                            <h4>Plano de Tratamento:</h4><pre>${analysis.treatmentPlan || 'N/A'}</pre>
                            <img src="${annotatedImageURL}" alt="${imgData.name}" />
                        </div>
                    `;
                });

                reportHtml += '</div></body></html>';
                const blob = new Blob([reportHtml], {type: 'text/html'});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Relatorio_${caseData.patientName?.replace(/\s+/g, '_') || 'Caso'}.html`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            const exportJSON = () => {
                const caseData = loadCaseData() || {};

                const imagesData = images.map(imgData => {
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');

                    const scale = Math.min(1, MAX_EXPORT_DIMENSION / Math.max(imgData.img.width, imgData.img.height));
                    tempCanvas.width = imgData.img.width * scale;
                    tempCanvas.height = imgData.img.height * scale;
                    tempCtx.scale(scale, scale);
                    tempCtx.drawImage(imgData.img, 0, 0);
                    drawAnnotationsScaled(tempCtx, imgData.annotations);
                    const annotated = tempCanvas.toDataURL('image/jpeg', 0.85);
                    return {
                        id: imgData.id,
                        name: imgData.name,
                        annotatedImage: annotated,
                        annotations: imgData.annotations,
                        analysis: analyses[imgData.id] || {}
                    };
                });

                const exportData = { caseData, images: imagesData };
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Caso_${caseData.patientName?.replace(/\s+/g, '_') || 'dados'}.json`;
                document.body.appendChild(a); a.click(); document.body.removeChild(a);
                URL.revokeObjectURL(url);
            };

            init();
        });

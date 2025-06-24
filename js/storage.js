export const saveCaseData = (caseData) => {
    localStorage.setItem('orthoCaseData', JSON.stringify(caseData));
};

export const saveImages = (images) => {
    const serializableImages = images.map(img => ({ ...img, img: img.img.src }));
    localStorage.setItem('orthoImages', JSON.stringify(serializableImages));
};

export const saveAnalyses = (analyses) => {
    localStorage.setItem('orthoAnalyses', JSON.stringify(analyses));
};

export const loadCaseData = () => {
    return JSON.parse(localStorage.getItem('orthoCaseData')) || null;
};

export const loadImages = () => {
    return JSON.parse(localStorage.getItem('orthoImages')) || null;
};

export const loadAnalyses = () => {
    return JSON.parse(localStorage.getItem('orthoAnalyses')) || null;
};

# Plano de Evolução da Aplicação

## 1. Análise do Estado Atual
- O repositório original possuía apenas o arquivo `portalaval.html` com cerca de 1300 linhas.
- Todo o código CSS e JavaScript estava embutido nesse único arquivo.
- Após a reorganização, esse arquivo foi removido e a aplicação está dividida em arquivos HTML, CSS e JS separados.
- O layout segue estilo próprio com paleta de cores definida em variáveis CSS.
- A lógica JS controla ferramentas de anotação, ajustes de imagem, armazenamento em `localStorage` e geração de relatório HTML.

## 2. Objetivos Gerais
1. Melhorar organização e manutenibilidade do código.
2. Refinar o design para proporcionar melhor experiência de uso em desktop e mobile.
3. Evoluir funcionalidades para manipulação de imagens e geração de laudos.

## 3. Estruturação do Projeto
1. **Criação de Diretórios**
   - `index.html` será a página principal (copiar conteúdo de `portalaval.html`).
   - `css/styles.css` para todo o conteúdo de estilo (linhas 12–515 do HTML).
   - `js/app.js` com todo o script atualmente entre as linhas 708–1319 do HTML.
2. Atualizar `index.html` para referenciar os novos arquivos externos:
   ```html
   <link rel="stylesheet" href="css/styles.css" />
   <script src="js/app.js" defer></script>
   ```
3. Garantir que, após cada separação, a página continue abrindo sem erros (abrir no navegador e revisar o console).

## 4. Aprimoramentos Estéticos
1. Revisar paleta e tipografia utilizando as variáveis já definidas (`--dark-blue`, `--gold-main`, etc.).
2. Padronizar espaçamentos e tamanhos de fonte. Ajustar classes como `.main-action-btn` e `.controls-bar` para consistência visual.
3. Melhorar responsividade analisando os trechos `@media` existentes (linhas 466–516) e adicionando breakpoints se necessário.
4. Considerar uso de ícones uniformes (ex. biblioteca `Font Awesome`) e animações suaves para transições de ferramenta.

## 5. Aprimoramentos Funcionais
1. **Galeria e Uploads**
   - Aperfeiçoar o componente `uploadArea` para indicar progresso de carregamento.
   - Validar tipos e tamanhos de arquivos ao selecionar (linhas 568–573 tratam o input de imagens).
2. **Ferramentas de Anotação**
   - Revisar funções de desenho e histórico (linhas 1020–1290). Implementar atalhos de teclado para desfazer/refazer.
   - Ajustar cálculo de zoom e pan para maior precisão nas interações (linhas 1118–1152).
3. **Persistência de Dados**
   - Centralizar operações de `localStorage` em módulo próprio. Verificar chave `orthoCaseData` e atualizações (linhas 756–783).
   - Oferecer exportação em outros formatos (ex. JSON além do HTML gerado em `exportCase` a partir da linha 1265).
4. **Relatório**
   - Ajustar template do relatório HTML e permitir personalização de logotipo/clínica.
   - Certificar que imagens anotadas sejam comprimidas adequadamente antes do download.

## 6. Melhoria do Fluxo de Trabalho
1. Adicionar `package.json` com scripts simples:
   - `start`: abrir um servidor estático (pode ser `npx http-server`).
   - `lint`: rodar um linter de HTML/CSS/JS para padronizar código.
2. Opcionalmente, utilizar um bundler leve (ex. `Vite`) para facilitar recarregamento automático.
3. Documentar no README como rodar a aplicação e verificar a “compilação” após cada mudança.

## 7. Próximos Passos
1. Criar um branch de desenvolvimento e iniciar a separação do código em módulos.
2. Após cada etapa (CSS separado, JS separado, novos componentes), abrir `index.html` no navegador para checar funcionamento das funções de galeria, ferramentas e geração de laudo.
3. Versionar todas as alterações com mensagens claras de commit.
4. Assim que a estrutura estiver estável, evoluir para implementar novos recursos solicitados pela equipe de produto.

## 8. Status Atual do Desenvolvimento

### Concluído
1. Código original de `portalaval.html` dividido em `index.html`, `css/styles.css` e `js/app.js`.
2. Adicionado servidor estático (`server.js`) e `package.json` com scripts `start` e `lint`.
3. Documentação inicial no `README.md` com instruções de uso.
4. Criado estilo `.glass-card` para futuros componentes de interface.
5. Barra de progresso adicionada na área de upload de imagens.
6. Validação de tamanho e tipo das imagens durante o upload, com exibição de erros.
7. Atalhos de teclado para desfazer/refazer com Ctrl+Z e Ctrl+Shift+Z.
8. Operações de armazenamento modularizadas em `js/storage.js`.
9. Exportação completa dos dados do caso em arquivo JSON.
10. Cabeçalho do relatório agora suporta nome e logotipo personalizados da clínica.

### A Fazer
1. Refinar layout e responsividade conforme itens da seção 4.
2. Implementar melhorias nas ferramentas de anotação além dos atalhos básicos.
3. Otimizar imagens geradas para reduzir o tamanho do relatório.
4. Integrar um linter real (ESLint/Stylelint) e corrigir os avisos apontados.
5. Aplicar o estilo `.glass-card` nos componentes adequados da interface.
6. Revisar a exportação de relatórios garantindo compressão das imagens e dados consistentes.
7. Realizar testes em diferentes navegadores e registrar o procedimento no README.

## 9. Conclusão e Entrega
1. Após concluir as tarefas acima, congelar a branch principal para release.
2. Gerar versão otimizada dos arquivos (HTML/CSS/JS minificados).
3. Atualizar a documentação com instruções finais e exemplos de uso.


# Projeto OrtoClin

Este repositório contém a evolução do sistema de consultoria ortodôntica.
O código original em `portalaval.html` foi reorganizado em arquivos
separados para facilitar a manutenção. O arquivo antigo foi removido
do repositório após essa reestruturação.

## Estrutura
- `index.html` - página principal.
- `css/styles.css` - estilos da aplicação.
- `js/app.js` - lógica de interação e ferramentas.
- `js/storage.js` - funções de persistência em `localStorage`.
- `server.js` - servidor estático simples.
- `PLAN.md` - planejamento das próximas etapas.

O upload de imagens exibe barra de progresso e rejeita arquivos acima de 5MB ou
com tipo inválido. Os dados são persistidos no `localStorage` do navegador.

No bloco de informações do caso é possível definir o nome da clínica e fazer
upload de um logotipo. Esses dados serão utilizados no cabeçalho do relatório
gerado.

### Atalhos
- **Ctrl+Z**: desfazer última anotação
- **Ctrl+Shift+Z** ou **Ctrl+Y**: refazer

## Como executar
1. Certifique-se de ter o Node.js instalado.
2. No terminal, execute:
   ```bash
   npm start
   ```
3. Abra `http://localhost:8080` no navegador para acessar a aplicação.

O script `npm lint` é um placeholder para futuras configurações de lint.

### Exportar Dados
- Clique em **Gerar Relatório** para baixar um HTML com as imagens anotadas.
- Clique em **Exportar JSON** para salvar todas as informações do caso em um arquivo `.json`.

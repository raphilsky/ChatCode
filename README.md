# ChatCode
Repositorio para o Codex do ChatGPT

## Pixel Runner (8-bit endless runner)

Este repositório contém um mini jogo estilo Dino do Chrome com estética 8-bit construído apenas com HTML5, CSS e JavaScript puro.

### Como executar

1. Abra o arquivo [`src/index.html`](src/index.html) diretamente no navegador, ou sirva a pasta `src/` com qualquer servidor HTTP estático (por exemplo, `npx serve src`).
2. Clique em **Começar** ou pressione **espaço** para iniciar a corrida.
3. Use espaço, seta para cima ou toque na tela para pular os obstáculos.

### Características

- Loop de jogo simples (`requestAnimationFrame`) com física de gravidade e impulso único por salto.
- Obstáculos gerados proceduralmente com aumento gradual de velocidade.
- Pontuação automática e armazenamento do recorde usando `localStorage`.
- Visual retro através de resolução reduzida, paleta limitada e `image-rendering: pixelated`.

Sinta-se à vontade para ajustar sprites, sons e regras para criar variações do jogo!

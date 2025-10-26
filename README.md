# ChatCode

## Duck Dash (endless runner 8-bit)

Este repositório contém um mini jogo retro em que você guia um pato azul de bico amarelo por cenários neon, construído apenas com HTML5, CSS e JavaScript puro.

### Como executar

1. Abra o arquivo [`src/index.html`](src/index.html) diretamente no navegador, ou sirva a pasta `src/` com qualquer servidor HTTP estático (por exemplo, `npx serve src`).
2. Clique em **PRESS START** ou pressione **espaço** para iniciar a corrida.
3. Use espaço, seta para cima ou toque na tela para impulsionar o pato pelos totens neon.

### Características

- Loop de jogo simples (`requestAnimationFrame`) com física de gravidade e impulso único por salto.
- Obstáculos gerados proceduralmente com aumento gradual de velocidade.
- Pontuação automática e armazenamento do recorde usando `localStorage`.
- Visual retro com HUD 8-bit, paleta neon e cenário animado no estilo CRT.
- Sprites originais do pato azul e obstáculos com brilho dourado.

Sinta-se à vontade para ajustar sprites, sons e regras para criar variações do jogo!

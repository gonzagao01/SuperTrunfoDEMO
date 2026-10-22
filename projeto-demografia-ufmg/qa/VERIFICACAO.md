# Verificação da versão para aprovação — 22/10/2026

## Isolamento e produção

- Versão criada em pasta separada. Nenhum push, commit, publicação no GitHub Pages ou implantação no Sites foi realizado.
- Projeto estável preservado no commit `89c0992`. Conteúdo da pasta estável e os dois ZIPs anteriormente entregues comparados por SHA-256 antes e depois: sem alterações.
- A versão de aprovação não contém `.git`, `.openai`, credenciais ou automação de publicação.
- O CSS aprovado foi mantido integralmente; apenas regras específicas das novas pistas, consulta do baralho e tutorial foram acrescentadas. Paleta, fontes e componentes existentes foram preservados.

## Dados e raridades

- Fonte oficial WPP 2024, cenário médio, referência 2024. O hash do arquivo original foi conferido antes da extração.
- Exatamente 36 países e 216 valores, com os 12 acréscimos solicitados. Os 24 países originais e seus 144 valores foram preservados exatamente.
- Bandeiras SVG locais para os 36 países; paridade entre JSON e JavaScript validada.
- Com valores distintos, cada indicador produz 18 Comuns, 14 Raras e quatro Épicas. Há testes explícitos para os dois extremos, empates nas fronteiras e todos os valores iguais.
- A classificação não usa o objetivo. Inverter todos os sinais mantém a raridade de cada país. A interface exibe somente a palavra da classe, sem posição, percentil ou direção.

## Simulações automatizadas

- `node scripts/test.mjs`: aprovado.
- 200 partidas completas: sorteio de 24 dos 36, distribuição 12/12, estados da mão/reserva/descarte, reposição, seis indicadores uma vez com cada objetivo, 24 descartes sem repetição, pontuação, empates e conclusão.
- 40 pares de partidas completas com a mesma distribuição e escolhas diferentes do jogador: todas as decisões do computador permaneceram iguais.
- 20 pares adicionais com valores ocultos invertidos e as mesmas pistas: decisões do computador permaneceram iguais. O teste detectaria uma estratégia que preferisse números altos ou baixos.
- Pistas protegidas com objetos vigiados: a função de decisão acessa apenas os campos permitidos. Cartas completas com números são rejeitadas como entrada da decisão.
- Valores não revelados ausentes da visão da interface e da consulta ao baralho. Reservas e cartas descartadas não podem ser selecionadas.
- Confirmação duplicada, avanço antecipado e seleção de indicador bloqueados. Dados originais não são modificados pela partida.

## Navegador — computador

- Tutorial da primeira partida conferido: três passos e aviso curto sobre Épica. Após fechar, não reapareceu no reinício nem após recarregar. A opção Ver tutorial em Como jogar abriu-o novamente.
- Partida completa de 12 rodadas: jogador 5, computador 7.
- Antes de cada confirmação, zero linhas e zero valores de indicadores no DOM das cartas, inclusive após trocar a seleção. Somente país, bandeira e raridade foram exibidos.
- Os 12 países do baralho permaneceram os mesmos. Consulta conferida a cada rodada: três cartas na mão, reservas e descartes atualizados, sem valores numéricos nem controles que permitissem jogar a reserva.
- Depois da confirmação: 12 valores disponíveis, seis de cada carta, com duas linhas destacadas para o indicador utilizado. Os 24 países jogados foram únicos e as 12 combinações de indicador e objetivo foram distintas.
- Ao final, o baralho do jogador continha 12 estados Descartada e a tela de resultado funcionou.

## Navegador — celular

- Presets de 390 e 320 pixels examinados, sem rolagem horizontal ou transbordamento de cartas, indicadores e consulta ao baralho.
- Partida completa de 12 rodadas: jogador 3, computador 9.
- Em todas as rodadas, valores ocultos antes da confirmação e os seis indicadores de cada lado disponíveis após a revelação. Consulta dos 12 países também conferida em tela estreita.
- Mãos de três cartas até a rodada 10, duas na rodada 11 e uma na rodada 12; resultado final e reinício funcionando.
- Console sem erros ou avisos nos testes.

## Pacote

- Site na raiz do ZIP, com caminhos relativos, dados, bandeiras, código, testes, importador e documentação.
- Pacote extraído em diretório temporário e testes executados sobre os arquivos extraídos.
- Testes de navegador realizados por HTTP local. O navegador integrado restringe o protocolo `file:`, portanto a abertura direta do HTML nesse navegador não foi verificada. O README inclui também a opção de servidor local.

Capturas reais: `tutorial-desktop.png`, `cartas-ocultas-desktop.png`, `baralho-desktop.png`, `revelacao-desktop.png`, `resultado-desktop.png`, `cartas-ocultas-mobile.png`, `baralho-mobile.png`, `mobile-320.png` e `resultado-mobile.png`.

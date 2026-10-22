# Verificação da atualização funcional

Validação local realizada em 22/10/2026 antes da publicação. A atualização foi preparada em branch separada; a main e o GitHub Pages de produção aguardam aprovação.

## Preservação

- Os 177 arquivos protegidos das versões anteriores e seus ZIPs foram comparados por SHA-256: nenhuma alteração.
- Os 40 arquivos de dados e recursos locais, incluindo as 36 bandeiras, são idênticos aos do projeto aprovado. O dataset continua com 36 países, seis indicadores e 216 valores.
- A interface mantém os componentes, cores, fontes e organização existentes. Foram removidos somente os rótulos eliminados da mecânica e seus estilos. Tutorial e regras tiveram apenas a explicação funcional atualizada.

## Motor e isolamento de informação

`node scripts/test.mjs` passou. Foram verificadas:

- 200 partidas completas, com 24 países distintos por partida, 12 cartas por lado, três cartas disponíveis enquanto há reserva, descarte e conclusão em 12 rodadas.
- Seis objetivos MAIOR e seis MENOR: exatamente uma combinação de cada indicador com cada objetivo.
- Cartas na mão e reserva expostas à interface apenas como identidades; nenhuma estimativa ou valor numérico oculto aparece nessa visão. Valores completos aparecem somente nos resultados revelados.
- Seleção das três cartas ativas em todas as rodadas, com bloqueio de reservas e descartes; mãos finais de duas e uma carta.
- Pontuação pela precisão original dos dados; empates sem pontos e partida inteira com valores empatados.
- 40 pares de partidas com escolhas adversárias diferentes e 40 pares com dados numéricos adversários alterados: as decisões do computador permaneceram idênticas.
- Nenhum sorteio ou nova avaliação do computador acontece ao selecionar, trocar ou confirmar a carta do jogador.
- A aproximação lê somente IDs e o indicador atual das cartas da própria mão. A escolha recebe somente IDs, estimativas e objetivo, e rejeita campos adicionais ou cartas com valores reais.
- Estimativas com erro real de ordenação, pesos configuráveis e configurações congeladas por partida. Mudanças de estratégia não alteram o sorteio inicial das cartas ou regras.
- Em 30.000 sorteios com ordem estimada fixa: primeira estimativa escolhida 21.014 vezes (70,05%), segunda 7.460 (24,87%) e terceira 1.526 (5,09%). Mãos de duas e uma carta também foram verificadas.
- Nenhum cálculo ou rótulo do sistema removido permanece nos arquivos ativos da interface e do motor.

## Equilíbrio

`node scripts/simulate-balance.mjs` concluiu 20.000 partidas e 240.000 rodadas, com 5.000 distribuições diferentes por perfil e sem falhas nas regras. Os pesos iniciais 70/25/5 e a incerteza 0,15 foram mantidos, sem calibrar resultados para 50%.

As vitórias do computador foram 78,80% contra escolhas aleatórias, 54,98% contra conhecimento básico, 36,98% contra intermediário e 21,78% contra elevado. Os empates são separados. O relatório `EQUILIBRIO.md` explica os perfis, as limitações e as contagens.

O computador apresenta vantagem forte contra quem escolhe ao acaso, dificuldade moderada contra o perfil básico e perde desempenho conforme aumenta o conhecimento. Essa é uma dificuldade inicial plausível para testar com pessoas; os modelos simulados não comprovam a experiência de jogadores reais.

## Navegador: computador e celular

Prévia local servida por HTTP em porta separada da versão já aberta pelo usuário. Testes realizados no navegador incorporado, com dimensões de computador e emulação de larguras de celular; não foram testes em aparelhos físicos.

- Partida completa de 12 rodadas em dimensão de computador (configuração de 1280 × 900). Resultado observado: 6 × 6. As três opções foram selecionáveis, os valores permaneceram ausentes antes de confirmar e as 12 combinações foram verificadas.
- Partida completa de 12 rodadas em dimensão de celular (390 × 844). Resultado observado: jogador 4 × computador 8. Verificados valores ocultos, reposição, fim da reserva, descarte, resultado e as 12 combinações.
- Verificação adicional em tela estreita (320 × 740, chegando a 291 pixels CSS com o zoom do navegador): sem transbordamento horizontal, avanço por clique após rolagem e atualização correta do baralho (três na mão, oito na reserva e uma descartada após a primeira rodada).
- **Ver meu baralho**: 12 nomes e bandeiras, estados corretos, sem números e sem controles para jogar a reserva, tanto em computador quanto em celular.
- Tutorial da primeira partida e sua reabertura em **Como jogar**: três passos, sem a classificação removida. A partida seguinte não reabriu o tutorial automaticamente.
- Antes de confirmar: zero elementos de valores numéricos dos indicadores. Depois de confirmar: 12 valores (seis por carta), dois destaques do indicador atual e explicação didática.
- Nenhum erro ou aviso de aplicação no registro do navegador. As dimensões temporárias foram restauradas ao terminar.

As partidas completas em celular também usaram ativação por teclado dos botões; o avanço por clique foi conferido após rolar o botão para a área visível. As evidências estão em `browser-rounds.json` e nas imagens desta pasta.

## Entrega

ZIP com o site na raiz, configuração de dificuldade, testes, simulador e relatórios. Sem credenciais, identidade de hospedagem ou publicação automática. O pacote foi extraído em pasta temporária e passou pelos mesmos testes com seus caminhos de arquivos adaptados à raiz.

## Preparação da branch

A proposta mantém a publicação em `projeto-demografia-ufmg`, retira desse diretório os testes e relatórios antigos e conserva os testes e as evidências atuais na raiz do repositório. O workflow e todos os dados e bandeiras devem permanecer idênticos à main. O endereço único é https://gonzagao01.github.io/SuperTrunfoDEMO/.

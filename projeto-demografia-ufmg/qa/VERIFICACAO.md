# Verificação — 22/10/2026

## Mecânica de mãos e sequência automática

- 200 partidas completas verificadas automaticamente: 12 rodadas, seis indicadores, cada indicador uma vez com MAIOR e uma com MENOR; sequência embaralhada no início.
- Distribuição aleatória dos 24 países em dois conjuntos de 12; três cartas iniciais por mão e nove na respectiva reserva.
- Verificados reposição, conservação das cartas não utilizadas, descarte dos 24 países sem repetição, mãos de duas cartas na rodada 11 e uma na rodada 12, pontuação, empates e migração negativa.
- 40 duplas adicionais de partidas completas usaram sorteios idênticos e escolhas diferentes do jogador: a carta escolhida pelo computador e a regra de cada rodada permaneceram idênticas nos 12 passos.
- Contagem de chamadas aleatórias confirma que mudar de carta e confirmar não faz o computador reconsiderar: a decisão foi tomada antes de apresentar a rodada.
- Estratégia isolada recebe apenas as próprias cartas e a regra atual. Teste com acesso vigiado aos campos verifica que não lê outros indicadores ou informações ocultas. Há casos explícitos de escolha de uma alternativa que não possui o melhor valor.
- Estado privado em WeakMap; a visão da interface é imutável e não contém a mão, a reserva ou a escolha ainda oculta do computador, nem as regras futuras. Só resultados já revelados ficam acessíveis.
- Testes de seleção inválida, tentativa de escolher indicador, confirmação sem seleção, confirmação duplicada, mudança após revelação e avanço antecipado passaram.
- Dataset, 144 valores, 24 bandeiras e HTML inicial comparados com a versão anterior: preservados. O CSS anterior foi mantido integralmente; só foram acrescentadas regras para os três botões de escolha da mão, usando cores e estilos existentes.

## Navegador

- Duas partidas completas executadas pelos controles reais: uma em computador e uma em celular. Ambas chegaram ao resultado final, com placar 6 a 6.
- Em todas as rodadas da primeira partida, cada carta disponível foi examinada antes de confirmar. O país exibido acompanhou a escolha, o indicador ficou fixo e a carta do computador permaneceu oculta.
- Botões de indicadores removidos. Indicador sorteado e objetivo aparecem automaticamente no centro do placar; a linha correspondente já vem destacada.
- Os países não jogados permaneceram na mão. Entrou exatamente uma carta da reserva nas rodadas 2 a 10; nenhuma nas duas últimas.
- Confirmação desabilitada até escolher uma carta. Depois de confirmar, as duas cartas ficaram visíveis, com o indicador destacado, resultado e nota didática. Os controles da mão ficaram bloqueados até avançar.
- Ambas as partidas tiveram 12 combinações distintas: cada indicador apareceu com os dois objetivos.
- Presets móveis de 390 e 320 pixels: sem rolagem horizontal nem transbordamento dos botões ou indicadores. Controles funcionaram até o resultado final.
- Reinício e resultado preservados. Console sem erros ou avisos durante a verificação.
- Regras atualizadas para refletir as mãos, o sorteio automático, a reposição e a estratégia do computador.

Capturas desta mecânica: `mao-tres-cartas.png`, `mao-revelacao.png`, `mao-ultima-rodada.png`, `mao-resultado.png` e `mao-mobile.png`. As demais imagens de QA são registros históricos de versões anteriores.

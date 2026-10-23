# Simulações dos três modos

Foram executadas **60.000 partidas completas / 720.000 rodadas**, 5.000 partidas por combinação de modo e perfil. Todas passaram pelas verificações de 12 rodadas, 24 cartas distintas, mão legal, distribuição Normal de seis países por grupo para cada lado, descarte e uma ocorrência de cada indicador em cada objetivo.

## Fácil

| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Escolha aleatória | 79,60% | 7,66% | 12,74% | 7,796 / 4,200 |
| Conhecimento básico | 12,04% | 71,76% | 16,20% | 4,593 / 7,399 |
| Conhecimento intermediário | 7,34% | 80,24% | 12,42% | 4,200 / 7,793 |
| Conhecimento elevado | 3,52% | 89,48% | 7,00% | 3,643 / 8,346 |

## Normal

| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Escolha aleatória | 79,76% | 8,48% | 11,76% | 7,835 / 4,163 |
| Conhecimento básico | 56,26% | 22,96% | 20,78% | 6,743 / 5,255 |
| Conhecimento intermediário | 38,74% | 38,06% | 23,20% | 6,004 / 5,995 |
| Conhecimento elevado | 17,40% | 64,00% | 18,60% | 4,923 / 7,075 |

## Difícil

| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Escolha aleatória | 79,62% | 7,88% | 12,50% | 7,815 / 4,185 |
| Conhecimento básico | 58,28% | 21,20% | 20,52% | 6,840 / 5,160 |
| Conhecimento intermediário | 38,56% | 37,66% | 23,78% | 6,030 / 5,970 |
| Conhecimento elevado | 23,18% | 55,58% | 21,24% | 5,281 / 6,719 |

As taxas são de partidas; empates ficam separados. Não houve ajuste para aproximar 50%. O mesmo computador usa 70/25/5 e incerteza 0,15 nos três modos. A margem amostral máxima aproximada de cada taxa é de 1,4 ponto percentual a 95%; isso não mede a validade dos modelos de conhecimento.

## Perfis e limites

- Aleatório: escolha uniforme entre todas as cartas legalmente disponíveis, sem consultar números.
- Básico: pesos 55/30/15; incerteza-base 0,35 quando há valores ocultos.
- Intermediário: pesos 70/25/5; incerteza-base 0,15 quando há valores ocultos.
- Elevado: pesos 90/9/1; incerteza-base 0,06 quando há valores ocultos.

No Fácil e no Normal os valores são visíveis de fato. Básico e intermediário ordenam os valores atuais e sorteiam entre as três primeiras alternativas com seus pesos, para representar erros de leitura/decisão. O perfil elevado escolhe o melhor valor atual entre as cartas legalmente disponíveis (todas as restantes no Fácil; a mão no Normal), sem prever adversário ou rodadas futuras. Isso explica a vantagem educacional desse modo; não equivale a uma estratégia global ótima.

Somente no Difícil, um modelo de memória resolve apenas os IDs da própria mão ativa. Para representar a menor familiaridade, a incerteza-base é multiplicada por 1 + 0,8 × fração de países da mão fora da lista Fácil. Essa hipótese é explícita e usada SOMENTE nos jogadores simulados do Difícil. No Normal, a leitura dos valores substitui a memória de números ocultos. O robô não recebe essa alteração. Não é uma medição do conhecimento real do público.

Nenhum perfil consulta IDs ou valores adversários, escolha prévia do robô, reserva ou regras futuras. Os resultados comparam modelos; não estimam probabilidades de vitória de pessoas reais. A variedade mundial não garante uma taxa de derrota maior para todos os modelos: extremos demográficos e o baralho sorteado também influenciam as disputas.

## Verificação da avaliação aproximada

Em 12.000 mãos sorteadas do banco mundial, a melhor estimativa do robô não correspondia ao melhor valor real em 695 casos (5,79%). Além desse erro há a escolha ponderada da segunda ou terceira estimativa. Pesos não são chances de vencer: a comparação só ocorre após ambas as decisões.

## Reprodução

Execute `node scripts/simulate-balance.mjs`. Cada perfil usa as mesmas sementes 120001–125000, com um gerador independente para decisões do jogador. Cada combinação produziu 5000 baralhos próprios distintos e 5000 sequências distintas. Contagens, configuração e hipóteses estão em `balance-results.json`. Dataset SHA-256: `8d883b71d395a5bf58a86c8a58a1320d1250e6e7740da69ea8b25a668a30bb4e`.

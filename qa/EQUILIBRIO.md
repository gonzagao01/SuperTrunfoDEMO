# Simulações dos três modos

Foram executadas **60.000 partidas completas / 720.000 rodadas**, 5.000 partidas por combinação de modo e perfil. Todas passaram pelas verificações de 12 rodadas, 24 cartas distintas, mão legal, distribuição Normal de seis países por grupo para cada lado, descarte e uma ocorrência de cada indicador em cada objetivo.

## Fácil

| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Escolha aleatória | 79,86% | 7,78% | 12,36% | 7,795 / 4,202 |
| Conhecimento básico | 11,42% | 72,52% | 16,06% | 4,568 / 7,424 |
| Conhecimento intermediário | 6,80% | 80,66% | 12,54% | 4,173 / 7,820 |
| Conhecimento elevado | 3,20% | 89,52% | 7,28% | 3,632 / 8,357 |

## Normal

| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Escolha aleatória | 79,74% | 8,54% | 11,72% | 7,830 / 4,168 |
| Conhecimento básico | 57,64% | 21,94% | 20,42% | 6,813 / 5,185 |
| Conhecimento intermediário | 38,66% | 38,76% | 22,58% | 6,001 / 5,997 |
| Conhecimento elevado | 23,28% | 56,26% | 20,46% | 5,245 / 6,753 |

## Difícil

| Jogador simulado | Computador vence | Jogador vence | Empate | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Escolha aleatória | 79,38% | 8,22% | 12,40% | 7,833 / 4,167 |
| Conhecimento básico | 58,46% | 21,14% | 20,40% | 6,827 / 5,172 |
| Conhecimento intermediário | 38,84% | 37,16% | 24,00% | 6,017 / 5,983 |
| Conhecimento elevado | 23,40% | 55,78% | 20,82% | 5,281 / 6,719 |

As taxas são de partidas; empates ficam separados. Não houve ajuste para aproximar 50%. O mesmo computador usa 70/25/5 e incerteza 0,15 nos três modos. A margem amostral máxima aproximada de cada taxa é de 1,4 ponto percentual a 95%; isso não mede a validade dos modelos de conhecimento.

## Perfis e limites

- Aleatório: escolha uniforme entre todas as cartas legalmente disponíveis, sem consultar números.
- Básico: pesos 55/30/15; incerteza-base 0,35 quando há valores ocultos.
- Intermediário: pesos 70/25/5; incerteza-base 0,15 quando há valores ocultos.
- Elevado: pesos 90/9/1; incerteza-base 0,06 quando há valores ocultos.

No Fácil os valores são visíveis de fato. Básico e intermediário ordenam os valores atuais e sorteiam entre as três primeiras alternativas com seus pesos, para representar erros de leitura/decisão. O perfil elevado escolhe o melhor valor atual entre todas as cartas restantes, sem prever adversário ou rodadas futuras. Isso explica a vantagem educacional desse modo; não equivale a uma estratégia global ótima.

No Normal e no Difícil, um modelo de memória resolve apenas os IDs da própria mão ativa. Para representar a menor familiaridade, a incerteza-base é multiplicada por 1 + 0,8 × fração de países da mão fora da lista Fácil. Essa hipótese é explícita, igual nos dois modos e usada SOMENTE nos jogadores simulados. O robô não recebe essa alteração. Não é uma medição do conhecimento real do público.

Nenhum perfil consulta IDs ou valores adversários, escolha prévia do robô, reserva ou regras futuras. Os resultados comparam modelos; não estimam probabilidades de vitória de pessoas reais. A variedade mundial não garante uma taxa de derrota maior para todos os modelos: extremos demográficos e o baralho sorteado também influenciam as disputas.

## Verificação da avaliação aproximada

Em 12.000 mãos sorteadas do banco mundial, a melhor estimativa do robô não correspondia ao melhor valor real em 738 casos (6,15%). Além desse erro há a escolha ponderada da segunda ou terceira estimativa. Pesos não são chances de vencer: a comparação só ocorre após ambas as decisões.

## Reprodução

Execute `node scripts/simulate-balance.mjs`. Cada perfil usa as mesmas sementes 120001–125000, com um gerador independente para decisões do jogador. Cada combinação produziu 5000 baralhos próprios distintos e 5000 sequências distintas. Contagens, configuração e hipóteses estão em `balance-results.json`. Dataset SHA-256: `6f9b29dff5f3b0d8ab1310f113394695bc0a68f41b7dff9b94b66e399dfff5b5`.

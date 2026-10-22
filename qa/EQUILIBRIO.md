# Simulações de equilíbrio — dificuldade normal

Foram executadas 20.000 partidas completas (240.000 rodadas), com 5.000 partidas por perfil. Todas concluíram as 12 rodadas com 24 cartas distintas, mãos e reservas válidas e os seis indicadores uma vez em cada objetivo.

| Jogador simulado | Vitórias do computador | Vitórias do jogador | Empates | Pontos médios computador / jogador |
| --- | ---: | ---: | ---: | ---: |
| Sem conhecimento (escolha aleatória) | 78,80% | 8,54% | 12,66% | 7,772 / 4,228 |
| Conhecimento básico | 54,98% | 22,88% | 22,14% | 6,723 / 5,277 |
| Conhecimento intermediário | 36,98% | 39,58% | 23,44% | 5,950 / 6,050 |
| Conhecimento elevado | 21,78% | 57,48% | 20,74% | 5,217 / 6,783 |

As porcentagens são de partidas, com empates contabilizados separadamente. Não houve ajuste para obter 50% de vitórias. Os pesos do computador permaneceram em 70% / 25% / 5% e a incerteza em 0,15 em todos os cenários. Com 5.000 partidas por perfil, a margem amostral aproximada máxima é de 1,4 ponto percentual (95%); isso não mede a incerteza dos modelos de jogador.

## O que foi modelado

- Sem conhecimento: escolha uniforme entre as cartas disponíveis.
- Básico: estimativas mais imprecisas (incerteza 0,35); pesos 55% / 30% / 15%.
- Intermediário: mesmas estimativas e pesos do computador, com sorteios independentes.
- Elevado: estimativas mais precisas, ainda incertas (0,06); pesos 90% / 9% / 1%.

Esses perfis representam conhecimento prévio sobre os próprios países. O simulador resolve somente os IDs da mão ativa do jogador em um catálogo para modelar essa memória. A interface real continua sem números antes da revelação. Nenhum perfil consulta as cartas adversárias, a decisão do computador ou as regras futuras. Os resultados são comparações entre modelos e não previsões de vitória de jogadores reais.

Cada perfil usou as mesmas sementes 120001 a 125000, com um gerador independente para as escolhas do jogador. Foram 5000 baralhos próprios distintos e 5000 sequências distintas por perfil. A decisão do computador foi definida no início de cada rodada, antes da seleção adversária.

## Incerteza da avaliação

Em 12.000 mãos independentes, a carta estimada como melhor não era a melhor pelo valor real em 675 casos (5,63%). Além desse erro, o sorteio pode escolher a segunda ou a terceira estimativa. Os pesos se referem à ordem estimada, não à ordem real nem à chance de vencer a rodada. A avaliação usa arredondamento e ruído apenas sobre os próprios valores, sem percentis, distribuições do catálogo ou cálculo exato de probabilidade de vitória.

## Reproduzir

Execute `node scripts/simulate-balance.mjs`. Detalhes e contagens estão em `qa/balance-results.json`. O dataset SHA-256 é `3cd1d5ebb4b148e37d9d0b150b15529d4a89cb51c0e3242c9fbf32d7868aa9bb`.

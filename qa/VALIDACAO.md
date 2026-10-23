# Validação dos ajustes finais — 23/10/2026

Revisão da branch `atualizacao/tres-modos-mundial`, no mesmo PR #2, a partir de `1d380c37aa19d5a4c1be78c9d69ad95120dac86b`. Sem merge ou publicação. A main permanece em `4693621d19b8015ad8f0a458934084ca51e6f97d` e o workflow de publicação foi preservado.

## Alterações e integridade

- Normal mantém os seis indicadores abertos nas três cartas: valor e unidade do indicador sorteado em destaque; cinco restantes visíveis sem painel expansível, inclusive após seleção/troca de carta. Fácil e Difícil conservam suas regras de visibilidade.
- Israel foi retirado do catálogo jogável, dos três formatos de dados, das regiões, das opções de comparação, filtros, sorteios e bandeira sem uso. Pesquisa não retorna resultados. O importador registra a exclusão editorial e não reintroduz o país.
- Fácil permanece com 36 países e Normal com 60. A Noruega já validada entra nas listas Fácil e conhecida; os 30 menos conhecidos são iguais. Cada participante Normal continua recebendo seis de cada grupo.
- Banco ativo: 194 países, 1.164 números e 194 bandeiras. Comparação integral com a revisão anterior confirma todos os 194 registros restantes idênticos, incluindo nomes, bandeiras e números. Os 216 valores dos 36 países da versão original também passam pela regressão.
- Cobertura estatística e curadoria são distintas: a auditoria fora da pasta publicada conserva 195 registros de fonte; um tem `available: false` por decisão editorial. Não há preenchimento artificial nem reatribuição dos dados excluídos.
- Regiões M49: África 54, Américas 35, Ásia 47, Europa 44, Oceania 14. Os metadados cobrem exatamente os 194 países ativos.
- `computer.js`, `difficulty.js`, `rules.js`, `selection.js`, `engine.js`, `indicators.js` e `styles.css` ficaram byte a byte iguais. Mesma paleta, tipografia, componentes e inteligência: pesos 70/25/5, incerteza 0,15 e escolha anterior à seleção adversária.

## Testes automatizados

`node scripts/test.mjs` passou:

- 600 partidas completas, 200 por modo: bancos 36/60/194, 24 países distintos, 12 cartas por lado, 12 rodadas equilibradas, reposição, descarte, pontuação e resultado final. Todos os países disponíveis foram sorteados no conjunto de testes; Israel nunca aparece.
- Normal sempre com seis conhecidos e seis menos conhecidos por lado; reserva não jogável e sem números na visão Normal/Difícil. Fácil mantém todas as cartas restantes disponíveis.
- 120 pares de partidas (240 jogos) alterando escolhas e valores adversários sem alterar a decisão do computador; nenhuma reavaliação depois da seleção.
- 1.000 regressões exatas da IA, 30.000 escolhas ponderadas, entradas restritas, imprecisão real, parâmetros configuráveis e fim de partida com duas/uma carta.
- 36 rodadas de empate nos templates reais: zero pontos e ausência de destaque vencedor. Todos os indicadores e objetivos também foram testados no motor.
- Em todas as 12 rodadas do template Normal, cada carta possui seis rótulos, seis números/unidades, destaque atual e nenhuma seção recolhível.
- 194 cartas de estudo e todos os 1.164 números conferidos; paridade JSON/JS/CSV, fontes brutas WPP, bandeiras, pesquisa sem acentos, filtros combinados, seis explicações, comparação neutra e proteção de navegação durante partida.

Os testes de templates usam um DOM mínimo em Node e complementam o navegador real. Fixtures de empate não entram na publicação.

## Navegador em computador e celular

Seis partidas completas novas, uma por modo em cada tamanho, totalizaram **72 rodadas**. Viewports solicitados: 1366 × 900 e 390 × 844; teste adicional do Normal em 320 × 720. O tamanho útil foi medido no DOM e chegou a 277 px no cenário mais estreito devido à escala/barra do navegador. São testes de viewport, não de aparelho físico.

Em todas as rodadas: escolha legal, objetivo/indicador, seis MAIOR e seis MENOR, 24 descartes distintos, pontuação e vencedor corretos, ausência de Israel e conclusão da partida. Os valores visíveis foram conferidos com o catálogo local. No Normal, os outros cinco indicadores tinham conteúdo renderizado visível antes e depois de escolher a carta, sem abrir qualquer painel; no Difícil não havia números antes da revelação. Os seis indicadores das duas cartas reveladas continuam consultáveis.

Também passaram:

- Normal estreito: três cartas, 18 números/unidades presentes e visíveis, sem rolagem horizontal; destaque do indicador atual preservado.
- Meu baralho: 12 identidades, três na mão, nove na reserva; nenhum número ou controle de jogada dentro da consulta. Cancelar saída preserva seleção; encerrar abre o catálogo com aviso de perda de progresso.
- Catálogo com 194 cartas e 194 opções por comparador; busca Israel retorna 0 de 194. Todos os cinco filtros têm a contagem esperada. Página Sobre não inclui Israel nas listas disponíveis.
- Noruega com sua própria bandeira e seis valores originais; definição sobreposta fecha sem fechar a carta.
- Comparação Índia/China no celular: seis linhas, 12 valores e nenhuma rolagem horizontal; sem pontuação/classificação.
- Tutorial interativo reaberto em Como jogar e concluído; instruções do Normal atualizadas.
- Console sem erros ou avisos da aplicação.

Registros: `ui-results.json`, `atlas-catalog-results.json` e imagens `ajustes-*`. Evidências `atlas-*` e relatórios históricos de outras revisões não representam a contagem atual.

## Simulações

`node scripts/simulate-balance.mjs` concluiu **60.000 partidas / 720.000 rodadas**, com 5.000 por combinação de modo e perfil. Nenhuma mudança na IA ou calibração para obter 50%. Como os bancos mudaram, as taxas foram recalculadas.

No Normal, o computador venceu 79,76% contra seleção aleatória, 56,26% contra o perfil básico, 38,74% contra o intermediário e 17,40% contra o perfil que escolhe o melhor valor atual. Empates são contados separadamente. Os modelos consultam apenas as informações permitidas da própria mão; não preveem o desempenho de pessoas reais. Relatório completo em `EQUILIBRIO.md` e `balance-results.json`.

## Aprovação e publicação

Os commits atualizam somente a branch existente e o PR #2. Histórico, configuração do Pages e workflow preservados. A main e o endereço público `https://gonzagao01.github.io/SuperTrunfoDEMO/` só serão atualizados após aprovação explícita posterior.

# Validação — Baralho e melhorias didáticas

Revisão do PR #2 na branch existente `atualizacao/tres-modos-mundial`, sem integração à main ou publicação no GitHub Pages. Base desta etapa: `c3305c318ddf8dcee6658df79f9165a840d8c2a0`; main preservada em `4693621d19b8015ad8f0a458934084ca51e6f97d`.

## Dados e regressão

- Dataset canônico e seus arquivos JSON/JS/CSV byte a byte iguais aos da revisão anterior; SHA-256 do JSON `6f9b29dff5f3b0d8ab1310f113394695bc0a68f41b7dff9b94b66e399dfff5b5`.
- Mantidos 195 países, 1.170 valores e 195 bandeiras locais; comparação com as linhas WPP auditadas e com os 36 países anteriores continua passando.
- Códigos/regiões M49 acrescentados em arquivo separado: África 54, Américas 35, Ásia 48, Europa 44, Oceania 14. Cobertura dos 195 ISO3 e igualdade entre metadados JSON e JS verificadas.
- Estratégia, configuração, regras e distribuição permaneceram byte a byte iguais. Regressão de 1.000 mãos contra o snapshot anterior da IA: mesmas estimativas e mesmas decisões para entradas/sementes iguais.

## Testes automatizados

`node scripts/test.mjs` passou, incluindo:

- 600 partidas completas: 200 por modo, com 12 rodadas, cada indicador/objetivo exatamente uma vez, 24 países distintos, 12 cartas por lado, descarte, reposição, empates e resultado final.
- Fácil: 12 cartas iniciais e qualquer restante selecionável; Normal: até três cartas com valores acessíveis; Difícil: identidades sem números antes da revelação. Reserva permanece não jogável e sem números na visão do Normal/Difícil.
- Normal mantém exatamente seis conhecidos e seis menos conhecidos em cada baralho. O Difícil continua utilizando o banco mundial sem filtro de familiaridade.
- 120 pares de partidas (240 jogos adicionais) alteraram escolhas e valores do jogador sem mudar a sequência de decisões do computador. Nenhum novo sorteio ou avaliação entre escolha do jogador e revelação.
- 30.000 escolhas ponderadas, incerteza real em valores próximos, configurações congeladas, entradas protegidas e mão final de duas/uma carta.
- Empates em todos os indicadores e ambos os objetivos, inclusive em 36 rodadas dos templates reais: nenhum vencedor verde, zero pontos e resultado empatado.
- Renderização das 195 cartas de estudo e conferência dos 1.170 valores contra o catálogo canônico; ano, projeção e seis indicadores presentes.
- Busca sem acentos/maiúsculas, palavras combinadas, filtros geográficos, interseção vazia e entrada de pesquisa sem execução de conteúdo.
- Comparações Brasil/Japão, Vaticano/Índia, Togo/Turquia e Brasil/Brasil, sem vencedores ou pontos; seis definições; fechamento correto de diálogo sobreposto; bloqueio do catálogo durante partida sem confirmação de encerramento.

Os testes de templates usam um DOM mínimo em Node, de forma complementar à validação real no navegador. O fixture de empate nunca entra nos arquivos de dados publicados.

## Navegador: computador e celular

Seis novas partidas completas / **72 rodadas** — uma por modo em cada tamanho — foram registradas em `ui-results.json`. Foram solicitados viewports de 1366 × 900, 390 × 844 e 320 × 720; a largura útil foi medida no DOM, incluindo um cenário de cerca de 277 px devido à escala e à barra de rolagem do navegador.

Verificado em todas as rodadas: número e indicador corretos, seis objetivos MAIOR e seis MENOR, seleção habilitada entre cartas legais, valores atuais iguais aos do catálogo nos modos visíveis, ausência de números nas cartas ocultas do Difícil, descarte sem repetição, pontuação, vencedor verde conforme a regra, seis indicadores após a revelação, botão de avanço e resultado após 12 rodadas.

Verificado ainda:

- Fácil móvel com 12 cartas em duas colunas; um número focal por carta; expansão dos outros cinco sem selecionar a carta; usadas retiradas da seleção.
- Normal com três números focais antes da escolha e cinco indicadores expansíveis por carta; reserva não jogável.
- Meu baralho com 12 países, três na mão e nove na reserva ao iniciar Normal/Difícil, sem números da reserva ou controles para jogá-la.
- Menu de saída informa que encerra a partida e não salva o progresso. Continuar preserva o jogo; Encerrar e abrir Baralho entra no catálogo somente após encerrar.
- Navegação Jogar / Baralho / Sobre o projeto; tutorial reaberto em Como jogar, com três passos e três valores reais no exemplo de escolha, ajuda do indicador e retorno correto.
- Pesquisa `japao`, pesquisa com acento, filtro combinado sem resultado, limpeza e contagem dos cinco grupos geográficos no navegador.
- Carta detalhada com seis valores, incluindo fecundidade de Togo `4,121673`; explicação sobreposta sem fechar a carta.
- Comparação de grandes populações Índia/China com os valores completos lado a lado no celular; sem rolagem horizontal e sem verde de vencedor.
- Uso por cliques e teclado, controles de formulário nativos, foco visível e diálogos com nomes acessíveis. Preservada a animação de 400 ms e a alternativa CSS para movimento reduzido; a preferência do sistema do usuário não foi alterada para o teste.
- Console final sem erros ou avisos da aplicação. A prévia precisou ser restabelecida uma vez durante o trabalho; não houve alteração dos dados por isso.

Evidências atuais: imagens `atlas-*` nesta pasta e `atlas-catalog-results.json`. Os testes móveis são de viewport e não de aparelho físico.

## Equilíbrio repetido

`node scripts/simulate-balance.mjs` passou: **60.000 partidas / 720.000 rodadas**, 5.000 por modo/perfil. Fácil e Difícil reproduzem exatamente os resultados da revisão anterior com as mesmas sementes. No Normal os modelos passam a usar leitura dos valores disponíveis; o perfil que escolhe o melhor valor atual venceu 64,24% das partidas, contra 56,26% no modelo anterior com conhecimento impreciso. Isso compara modelos, não prevê o desempenho de pessoas reais. Não houve ajuste do robô para buscar 50%.

Taxas completas, empates, pontos médios e hipóteses estão em `EQUILIBRIO.md` e `balance-results.json`. Nenhum perfil consulta o adversário oculto ou as regras futuras.

## Entrega

A prévia desta revisão é local e destinada a teste no Work. O catálogo e as partidas continuam estáticos, sem API externa durante uso. O mesmo PR #2 recebe novos commits, preservando histórico, workflow, pasta publicada e endereço público. A integração à main e a publicação dependem de aprovação explícita posterior.

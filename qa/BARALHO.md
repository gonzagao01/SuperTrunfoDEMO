# Baralho educativo e visibilidade por dificuldade

Esta revisão continua na branch `atualizacao/tres-modos-mundial` e no PR #2, a partir de `1d380c37aa19d5a4c1be78c9d69ad95120dac86b`. Não altera o endereço público, a main ou o workflow de publicação.

## Funcionalidades

- Baralho no menu e na navegação das páginas de estudo, com 194 países, bandeiras e nomes em grade responsiva.
- Pesquisa por nome, sem diferenciar acentos ou maiúsculas; palavras podem ser combinadas. A pesquisa e a região funcionam juntas e há uma opção clara de limpar filtros quando nenhum país é encontrado.
- Carta detalhada com os seis indicadores do mesmo catálogo do jogo, sem cópia numérica por país. As taxas preservam até seis casas decimais, conforme a precisão de origem; a população é exibida em habitantes.
- Comparação de quaisquer dois países, inclusive o mesmo país em ambas as colunas. Permite trocas rápidas por seletores independentes da pesquisa. No celular, cada indicador fica acima dos dois valores, para que populações grandes permaneçam legíveis lado a lado. Não há vencedor, pontuação, seta ou cor que julgue os países.
- Explicações clicáveis nos nomes dos indicadores, nas cartas, nas comparações, no objetivo da rodada e em Sobre o projeto. Definições têm significado, interpretação/cálculo e relevância, com referência oficial. Ao fechar uma explicação, a carta ou a partida permanece aberta.
- Fácil: 12 cartas iniciais disponíveis ao jogador; um valor em destaque por carta e outros cinco em detalhes, inclusive em grade móvel de duas colunas. As usadas saem da seleção.
- Normal: até três cartas da mão com os seis indicadores, números e unidades permanentemente abertos antes da escolha. O indicador sorteado continua maior e destacado; os outros cinco não exigem expansão. A reserva permanece sem números e não pode ser jogada. Mantida a composição 6 conhecidos + 6 menos conhecidos por lado.
- Difícil — Conhecimento: até três cartas com nomes e bandeiras; os seis números só entram nas cartas depois da revelação. Banco mundial de 194 países; estratégia do robô inalterada.
- Baralho completo e Meu baralho são distintos. A consulta ao catálogo durante uma partida exige antes a confirmação de encerramento, com aviso de perda do progresso. Não há ligação direta ao catálogo na partida ativa; depois da tela de resultado ele é acessível diretamente.

## Dados demográficos e inteligência preservados

Israel foi removido dos três arquivos de execução `countries.json`, `countries.js` e `countries.csv`, das regiões, opções de comparação, pesquisa, sorteios e bandeira sem uso. São 194 países e 1.164 valores disponíveis. Todos os registros restantes mantêm integralmente os nomes, bandeiras e seis números anteriores, inclusive Togo. A Noruega já validada preserva o Fácil com 36 e o Normal com 60 (30/30); não houve troca de identidade ou de valores entre países. Os registros estatísticos originais de auditoria permanecem fora da pasta publicada, com a exclusão editorial identificada.

`computer.js`, `difficulty.js`, `rules.js` e `selection.js` também permaneceram idênticos. Pesos 70/25/5, incerteza 0,15 e compromisso antes da escolha adversária preservados. O motor permanece idêntico à revisão anterior, com a reserva do Normal/Difícil mascarada. O catálogo de estudo não é uma entrada da função de decisão do robô.

## Regiões: fonte e convenção

A classificação vem da [ONU, UNSD — Standard country or area codes for statistical use (M49)](https://unstats.un.org/unsd/methodology/m49/overview/), consultada em 23/10/2026. Usa os códigos da região geográfica ampla da tabela oficial, associados aos ISO3 dos mesmos 194 países. Não representa uma classificação política, econômica ou de desenvolvimento.

| Região M49 | Código | Países no catálogo |
| --- | --- | ---: |
| África | 002 | 54 |
| Américas | 019 | 35 |
| Ásia | 142 | 47 |
| Europa | 150 | 44 |
| Oceania | 009 | 14 |

Rússia integra Europa, Turquia e Chipre integram Ásia, segundo a convenção estatística M49. As Américas não são divididas em continentes neste filtro. Os metadados ficam em `data/geography.json` e `geography.js`, sem modificar o banco demográfico. O arquivo `scripts/fixtures/m49-regions.csv` registra o vínculo ISO2/ISO3/M49/região/sub-região. O importador `scripts/import-geography.py` aceita a página oficial salva em HTML e valida a cobertura de todos os países. SHA-256 da página consultada: `b9048114f6e7f2abda83bf03d4263c9d7cd1bd7230e3d0461025ee7839a7a1fb`.

## Referências das explicações

- [ONU, WPP 2024 — Methodology](https://population.un.org/wpp/assets/Files/WPP2024_Methodology.pdf): conceitos e metodologia, incluindo tábuas de mortalidade e taxa líquida de migração por pessoas-ano. As explicações são sínteses didáticas em português, sem trocar os valores do WPP por séries de outras fontes.
- [UNdata — Total fertility rate](https://data.un.org/Glossary.aspx?q=total+fertility+rate): fecundidade total combina taxas por idade; não é a taxa bruta de natalidade.
- [OMS — Infant mortality rate](https://www.who.int/data/gho/indicator-metadata-registry/imr-details/1): probabilidade de morrer antes de um ano, expressa por mil nascidos vivos; não confundir com número absoluto de óbitos.
- [ONU, Data Portal — Median age](https://population.un.org/dataportal/data/indicators/67/locations/910/start/1990/end/2023/metadata): mediana divide a população em duas metades; não é a média das idades.

A migração líquida é o saldo de entradas e saídas internacionais, e não o estoque total de imigrantes. A expectativa de vida é uma medida de período, não uma previsão da vida de uma pessoa específica. Os números não atribuem superioridade a países.

## Testes e problemas resolvidos

O relatório [VALIDACAO.md](VALIDACAO.md) contém os testes completos, e [EQUILIBRIO.md](EQUILIBRIO.md) traz as 60.000 partidas repetidas com a nova visibilidade do Normal. Os registros do navegador estão em `ui-results.json` e `atlas-catalog-results.json`; imagens com prefixo `ajustes-` mostram a revisão atual; imagens `atlas-` são evidências históricas da revisão anterior.

Foi corrigida a quebra dos números de população em telas muito estreitas, usando rótulos acima dos dois valores no celular. Os testes finais não registraram erros da aplicação no console. Não há problemas funcionais conhecidos pendentes nos cenários verificados. Os testes móveis foram realizados com viewport de navegador, não em um aparelho físico.

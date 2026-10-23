# Super Trunfo — Demografia UFMG

Versão de revisão com três modos, catálogo educativo Baralho, comparação entre países e banco local de 195 países. O visual GitHub Dark, os seis indicadores, as 12 rodadas e a pontuação foram preservados. **Esta branch não está aprovada para publicação.**

- Branch: `atualizacao/tres-modos-mundial`, criada da `main` após a integração da versão anterior.
- Site público preservado: https://gonzagao01.github.io/SuperTrunfoDEMO/
- Diretório publicado: `projeto-demografia-ufmg/`.
- O workflow `.github/workflows/deploy.yml` foi preservado; somente uma futura integração aprovada à `main` deverá publicar no mesmo endereço.

## Executar localmente

É um site estático, sem instalação de pacotes, backend ou consulta a APIs durante as partidas:

```sh
python3 -m http.server 4182 --directory projeto-demografia-ufmg
```

Abra http://127.0.0.1:4182/ no navegador. Também pode hospedar o conteúdo dessa pasta em um servidor estático. Os caminhos são relativos e compatíveis com a subpasta do GitHub Pages.

## Os três modos

| Modo | Banco | Escolha do jogador | Valores antes da disputa |
| --- | ---: | --- | --- |
| Fácil — Aprendizado | 36 | Qualquer carta própria ainda não usada, começando com 12 | Valor da rodada em destaque; outros cinco em detalhes |
| Normal — Estratégia | 60 | Mão de três; reposição da reserva | Valor da rodada em destaque; outros cinco em detalhes |
| Difícil — Conhecimento | 195 | Mão de três; reposição da reserva | Ocultos |

Cada partida usa 24 países distintos, 12 por participante. No Normal são sorteados 12 de cada grupo editorial de 30 e distribuídos seis por grupo a cada lado. Cada indicador aparece uma vez com MAIOR e uma com MENOR, em ordem embaralhada. Vitória vale um ponto; empate, zero. A mão do computador tem sempre até três cartas, inclusive no Fácil. Nas duas últimas rodadas do Normal/Difícil restam duas e uma carta, pois não há mais reserva.

O robô preserva o algoritmo anterior em todos os modos: avalia aproximadamente os próprios valores, com arredondamento e ruído de incerteza 0,15, e sorteia com pesos 70/25/5 entre as estimativas ordenadas. Não calcula percentis nem chances estatísticas exatas. A escolha fica definida no início da rodada, antes de qualquer seleção do jogador. A função de decisão recebe apenas estimativas próprias e o objetivo público. Pesos e incerteza ficam em `difficulty.js`; são copiados e congelados no início da partida.

## Baralho e Meu baralho

**Baralho** é o catálogo educativo completo dos 195 países, acessível antes e depois das partidas. Oferece pesquisa por nome sem diferenciar acentos/maiúsculas, filtros pelas cinco regiões M49 da ONU, carta com os seis valores e uma comparação neutra entre quaisquer dois países. As definições acessíveis pelo nome de cada indicador explicam significado, interpretação e relevância, com referências oficiais. Os valores são os mesmos do jogo, com precisão de origem, referência 2024 e unidades explícitas.

**Meu baralho** reúne somente os 12 países recebidos na partida, com nomes, bandeiras e estados. No Normal e no Difícil, não permite jogar a reserva e não expõe seus números. O jogador do Normal vê os valores apenas das cartas da mão. No Fácil, todas as cartas próprias ainda disponíveis podem ser escolhidas. A seleção visível usa uma grade de duas colunas no celular, com os outros cinco indicadores expansíveis.

Durante uma partida não há link direto ao catálogo completo. O Menu informa que sair encerra o jogo e perde o progresso; o jogador pode continuar, encerrar e voltar ao menu ou encerrar e abrir o Baralho. A confirmação nunca oferece uma consulta silenciosa ao catálogo mantendo a partida ativa. A tela de resultado oferece Baralho diretamente.

## Organização

- `atlas.js`: filtros do catálogo; `data/geography.js` e `geography.json`: metadados geográficos separados dos indicadores.
- `modes.js`: configurações e listas editoriais, sem duplicar dados demográficos.
- `rules.js`: seis indicadores, sequência equilibrada, comparação e embaralhamento.
- `selection.js`: bancos e distribuição por modo, sem ler números demográficos.
- `computer.js` / `difficulty.js`: avaliação incerta e escolha ponderada, iguais no Normal e no Difícil.
- `engine.js`: estado privado, mão/reserva/descarte, compromisso prévio do robô, pontuação e controle de revelação.
- `indicators.js`: rótulos, unidades e explicações didáticas.
- `app.js` / `styles.css`: interface e tutorial; animação de 400 ms com respeito a movimento reduzido.
- `data/countries.json`: catálogo canônico, exportado também em JS e CSV.
- `assets/flags/`: 195 bandeiras locais.

Como todo jogo inteiramente estático, os arquivos do catálogo são públicos. “Oculto” significa que a interface e o algoritmo de escolha não expõem nem consultam a escolha adversária antes da revelação; não constitui proteção contra inspeção manual dos arquivos pelo próprio usuário.

## Dados, listas e validação

- [Fontes, cobertura e auditoria dos 195 países](qa/COBERTURA-E-FONTES.md).
- [Listas definitivas por modo](qa/PAISES-POR-MODO.md).
- [Simulações e suas hipóteses](qa/EQUILIBRIO.md).
- [Verificação funcional e interface](qa/VALIDACAO.md).
- [Melhorias didáticas, geografia e referências dos indicadores](qa/BARALHO.md).

Fonte: ONU, World Population Prospects 2024, referência 2024, cenário Medium, **projeções**. Há 1.170 valores; os 216 dos 36 países anteriores foram preservados integralmente. Togo utiliza a atualização intermediária oficial. Os 193 membros e os dois observadores têm seis campos válidos; nenhuma exclusão ou substituição foi necessária. A lista de membros e observadores acompanha o registro oficial da ONU. Consulte o relatório para fontes, unidades, observações sobre microestados e reprodução da importação.

## Testes reproduzíveis

Requer apenas Node.js para executar os testes, sem dependências de pacotes:

```sh
node scripts/test.mjs
node scripts/simulate-balance.mjs
```

O primeiro verifica fontes/formatos/bandeiras, 600 partidas completas, privacidade, distribuição, empates e regressão exata da IA anterior; também confere as 195 cartas de estudo, todos os 1.170 valores, busca/filtros, comparação, definições e proteção da navegação durante partidas. O segundo executa 60.000 partidas / 720.000 rodadas nos três modos e quatro modelos de jogador, sem calibrar para obter 50% de vitórias. Os perfis consideram leitura dos números no Fácil/Normal e conhecimento prévio no Difícil; não preveem o desempenho de pessoas reais. Há registros estruturados em `qa/`.

O snapshot `scripts/fixtures/normal-engine-v1.cjs` é usado somente como referência de regressão do algoritmo antigo, fora da pasta publicada. O fixture de números iguais nos testes serve somente para verificar empates; nunca modifica os dados do jogo.

## Publicação após aprovação

Revisar o pull request desta branch. Somente após aprovação explícita, integrar à `main`, mantendo histórico e workflow existentes. Nenhum outro repositório, site ou endereço foi criado. A atualização usa a mesma pasta pública e não acrescenta testes ou relatórios ao diretório publicado.

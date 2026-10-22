# Trabalho de Demografia UFMG

Super Trunfo — Demografia Mundial. Projeto completo em HTML, CSS e JavaScript, com a mecânica atual de mãos de três cartas e indicadores automáticos. Sem dependências de instalação ou build.

## Publicar no GitHub Pages

1. Descompacte este ZIP no computador.
2. Envie o conteúdo extraído ao repositório do GitHub, incluindo as pastas `assets`, `data` e `scripts`. O arquivo `index.html` deve ficar na raiz do repositório, junto com este README.
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch que contém os arquivos (normalmente **main**) e a pasta **/ (root)**. Clique em **Save**.
6. Aguarde a publicação e abra o endereço exibido na seção Pages para testar.

Não envie somente o ZIP ao repositório: o GitHub Pages precisa dos arquivos descompactados. O projeto usa caminhos relativos e funciona no endereço `https://usuario.github.io/nome-do-repositorio/`.

## Testar no computador

Abra `index.html` diretamente no navegador. Como alternativa, execute na pasta extraída:

```sh
python3 -m http.server 4173
```

Depois acesse `http://localhost:4173`. Bandeiras e dados são locais; as partidas não consultam APIs.

## Conteúdo

- `index.html`, `styles.css`, `app.js` e `engine.js`: site completo.
- `assets/flags/`: as 24 bandeiras.
- `data/`: os 144 valores demográficos e os metadados, em JavaScript, JSON e CSV.
- `scripts/`: testes da mecânica e importador reproduzível dos dados oficiais.
- `qa/VERIFICACAO.md`: registro das verificações.
- `.nojekyll`: publicação estática no GitHub Pages.

## Regras

- Exatamente 24 países, distribuídos aleatoriamente em dois conjuntos de 12: cada lado começa com três cartas na mão e nove na própria reserva.
- A sequência completa de 12 rodadas é gerada e embaralhada antes da primeira escolha. Cada um dos seis indicadores aparece exatamente uma vez com objetivo “maior” e uma com objetivo “menor”.
- Não existe escolha manual de indicador. O jogador escolhe uma das cartas disponíveis; os três botões acima da carta permitem examinar os países antes de confirmar.
- O computador decide qual carta usar antes de qualquer seleção do jogador. Considera somente suas próprias cartas e a combinação atual de indicador e objetivo. Quando há mais de uma carta, escolhe o melhor valor com probabilidade de 70%; nos demais casos, escolhe outra carta, aleatoriamente. Empates entre opções equivalentes usam ordem aleatória.
- As duas escolhas são confirmadas antes da comparação. As cartas utilizadas são descartadas, e cada mão é reposta a partir de sua própria reserva ao avançar. Depois de esgotadas as reservas, as mãos passam a duas cartas na rodada 11 e uma na rodada 12.
- O estado do computador, sua escolha já definida e as reservas ficam privados dentro do motor do jogo. A interface recebe apenas uma visão de leitura: a mão do jogador, a regra atual e os resultados já revelados. A estratégia não recebe a seleção do jogador, sua mão, nenhuma reserva ou rodadas futuras.
- Carta adversária oculta até confirmação; um ponto por vitória, nenhum por empate; nenhuma carta é reutilizada.
- Comparação na precisão original. Taxas apresentadas com duas casas decimais; população inteira em habitantes.

## Dados

Fonte primária: United Nations, DESA, Population Division, **World Population Prospects 2024**, cenário médio, ano de referência 2024. Os valores de 2024 são **projeções**, nesta revisão, e não estimativas históricas (que terminam em 2023).

- [Página da fonte](https://population.un.org/wpp/)
- [Arquivo oficial utilizado](https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz)
- Consulta: 22/10/2026. Licença: CC BY 3.0 IGO.
- SHA-256 do arquivo original: `286ac36bb1415e2e1ade03acfef0a29f0e4c087e2f78e38c48f50c5df89082bc`.

Os 144 valores estão em `data/countries.json`, acompanhados de fonte, revisão, ano, natureza, unidades, colunas e transformações. `countries.csv` permite análise em planilha. `countries.js` é a cópia local carregada pelo navegador, inclusive ao abrir o HTML diretamente.

| Indicador | Coluna WPP | Unidade no jogo |
| --- | --- | --- |
| População total | TPopulation1July | habitantes (original × 1.000) |
| Expectativa de vida ao nascer | LEx | anos |
| Fecundidade | TFR | filhos por mulher |
| Mortalidade infantil | IMR | óbitos por mil nascidos vivos |
| Taxa líquida de migração | CNMR | migrantes líquidos por mil habitantes |
| Idade mediana | MedianAgePop | anos |

Para reproduzir a extração, baixe o arquivo oficial acima e execute:

```sh
python3 scripts/import-data.py /caminho/WPP2024_Demographic_Indicators_Medium.csv.gz
```

As bandeiras SVG foram obtidas de `https://flagcdn.com/{codigo-iso2}.svg` e são distribuídas localmente. São símbolos nacionais, sem uso de emojis.

Maior ou menor é uma regra lúdica; não indica superioridade social ou econômica de um país. As definições e fontes ficam em **Sobre o projeto**.

## Verificação

```sh
node scripts/test.mjs
```

A verificação cobre 200 partidas completas: cada combinação de indicador e objetivo exatamente uma vez, mãos de três cartas, reposição, descarte dos 24 países, pontuação, empates, taxas migratórias negativas e preservação dos 144 valores e 24 bandeiras. Outras 40 duplas de partidas completas usam os mesmos sorteios e escolhas diferentes do jogador: todas as escolhas do computador e regras permanecem idênticas. Também são verificados o bloqueio de confirmação duplicada, a ausência de decisões do computador durante a seleção e a proteção de informações ocultas na visão da interface. A pasta `qa/` contém o registro da revisão visual e funcional no navegador.

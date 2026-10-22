# Super Trunfo — Demografia UFMG — versão para aprovação

Esta é uma versão separada de avaliação. Não foi publicada no GitHub Pages de produção, enviada ao repositório estável ou implantada no Sites. O projeto estável e seus ZIPs anteriores foram preservados.

## Testar localmente

Abra `index.html` diretamente no navegador. Não é necessário instalar pacotes. Os dados e as 36 bandeiras são locais e a partida não consulta APIs.

Opcionalmente, nesta pasta:

```sh
python3 -m http.server 4180
```

Abra `http://localhost:4180`. O tutorial aparece na primeira partida. Depois, pode ser revisto em **Como jogar → Ver tutorial**. Se o navegador bloquear o armazenamento local, ele continua funcionando na sessão atual.

## O que mudou

- Catálogo de 36 países, preservando os 24 originais e seus 144 valores. Acrescentados Canadá, Chile, Noruega, Portugal, Coreia do Sul, Bangladesh, Paquistão, Filipinas, Turquia, Egito, Etiópia e Nova Zelândia. Total: 216 valores.
- Cada partida sorteia 24 países e entrega 12 a cada lado: três na mão e nove na reserva. Os 12 não sorteados ficam fora da partida.
- **Ver meu baralho** mostra os 12 países do jogador, bandeiras e estados Na mão, Na reserva e Descartada. Não mostra valores, raridade da reserva ou cartas adversárias. Só cartas da mão podem ser selecionadas.
- Antes da confirmação, as cartas mostram bandeira, nome e somente a palavra de raridade da rodada. Nenhum valor numérico de indicador é inserido no HTML ou nos atributos de acessibilidade nessa etapa.
- As escolhas são confirmadas antes da revelação. Depois, todos os seis indicadores das duas cartas ficam disponíveis, com o indicador da rodada destacado.
- Preservados: 12 rodadas, cada indicador uma vez com MAIOR e uma com MENOR, um ponto por vitória, empate sem pontos, descarte, reposição e resultado final.

## Raridade contextual

A classificação é calculada separadamente para cada indicador usando o catálogo completo de 36 países, antes de iniciar a partida. Não usa o objetivo MAIOR/MENOR, não cria ranking geral e não indica chance de vitória.

Com valores distintos, as posições ordenadas têm:

- Comum: as 18 posições centrais (10 a 27).
- Rara: sete posições de cada lado (3 a 9 e 28 a 34).
- Épica: as duas posições de cada extremidade (1, 2, 35 e 36).

Empates são agrupados e recebem a mesma classe. O algoritmo usa a posição média do grupo empatado; a distância à ponta mais próxima é comparada aos limites intermediários 2,5 e 9,5. Assim, grupos não são quebrados para forçar as quantidades nominais. Se todos os valores forem iguais, todos são Comuns. Inverter os sinais de todos os valores mantém as raridades de cada país: não há indicação de direção.

Na interface, aparecem apenas Comum, Rara ou Épica, com a tipografia e as cores já existentes. Não aparecem posições, percentis, números de raridade, setas, medalhas ou cores de categoria. Os detalhes numéricos acima são documentação técnica, não são mostrados nas cartas.

## Igualdade de informação do computador

O motor separa os valores reais das pistas. A função de decisão recebe:

- As cartas na própria mão somente com identificador, nome, bandeira e raridade atual.
- Os países e estados do próprio baralho, sem valores.
- A regra atual, o placar e resultados já revelados publicamente.

Ela não recebe valores ocultos das próprias cartas, reservas com números, cartas do jogador, sua seleção ou as regras futuras. A decisão é definida antes de qualquer seleção do jogador e não é recalculada ao trocar de carta.

Sem saber se um valor é alto ou baixo, a estratégia combina duas formas de sorteio: metade das decisões sorteia entre as cartas; a outra metade sorteia uma das raridades presentes e depois uma carta daquela classe. Não dá prioridade fixa a Épica, Rara ou Comum e não usa conhecimento numérico embutido por país.

Os valores reais só são consultados pelo cálculo de raridade na preparação e pela comparação/revelação após confirmar as escolhas. O estado privado usa WeakMap e a visão da interface é imutável, sem valores ainda ocultos. Os arquivos de dados permanecem disponíveis como fonte acadêmica; as cartas e a função de decisão seguem o momento de revelação definido nas regras.

## Fonte e validação dos dados

Fonte: United Nations, DESA, Population Division, **World Population Prospects 2024**, cenário médio, referência 2024. São projeções do cenário médio nesta revisão; estimativas históricas terminam em 2023.

- [Página da ONU](https://population.un.org/wpp/)
- [Arquivo oficial utilizado](https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz)
- Consulta: 22/10/2026. Licença: CC BY 3.0 IGO.
- SHA-256 da origem: `286ac36bb1415e2e1ade03acfef0a29f0e4c087e2f78e38c48f50c5df89082bc`.

Os novos países foram extraídos do mesmo arquivo oficial verificado utilizado na versão estável. Todos os objetos dos 24 países originais foram comparados e preservados exatamente. Não foram substituídos dados corretos, preenchidos ausentes com zeros ou inventados valores.

| Indicador | Coluna WPP | Unidade |
| --- | --- | --- |
| População total em 1º de julho | TPopulation1July | habitantes; original em milhares multiplicado por 1.000 |
| Expectativa de vida ao nascer | LEx | anos |
| Fecundidade | TFR | filhos por mulher |
| Mortalidade infantil | IMR | óbitos por mil nascidos vivos |
| Taxa líquida de migração | CNMR | por mil habitantes |
| Idade mediana | MedianAgePop | anos |

Dados e metadados estão em `data/countries.json`, com cópias em CSV e JavaScript local. As bandeiras SVG estão em `assets/flags/`, obtidas de `https://flagcdn.com/{iso2}.svg`.

Para reproduzir a extração a partir do arquivo oficial:

```sh
python3 scripts/import-data.py /caminho/WPP2024_Demographic_Indicators_Medium.csv.gz
```

## Testes

```sh
node scripts/test.mjs
```

Cobertura: dataset e preservação original, 36 bandeiras, raridades nominais, empates e simetria, 200 partidas completas, 40 duplas com escolhas diferentes do jogador e 20 duplas com valores ocultos invertidos. Verifica também estados do baralho, bloqueio de reserva/descartes, ausência de valores nas pistas, reposição, pontuação, empates e conclusão. Veja `qa/VERIFICACAO.md` para os testes reais em computador e celular.

## Aprovação antes da publicação

O ZIP de avaliação contém o site na raiz para facilitar o teste local, além do código, testes e documentação. Não há configuração de deploy automático ou credenciais. Abra o HTML e avalie esta versão antes de substituir qualquer arquivo no repositório ou publicar uma atualização do site público.

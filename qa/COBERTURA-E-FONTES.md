# Fontes e cobertura demográfica — revisão de 23/10/2026

**195 países incluídos: 193 Estados-membros da ONU e dois observadores, com 1.170 valores válidos.** Todos têm os seis indicadores. Nenhum país solicitado ficou sem cobertura; não foi necessário substituir nenhum das listas propostas, inventar valores ou preencher ausências com zero. Os 36 países da versão anterior e seus 216 valores foram preservados integralmente. Foram acrescentados 159 países e 954 valores.

## Fontes primárias e referência

- [ONU: World Population Prospects 2024](https://population.un.org/wpp/), revisão WPP 2024, cenário Medium, referência 2024. **São projeções**, pois nesta revisão as estimativas históricas terminam em 2023. Não apresentar esses valores como contagens censitárias observadas de 2024.
- [CSV Medium oficial](https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/CSV_FILES/WPP2024_Demographic_Indicators_Medium.csv.gz): fornece a série principal, incluindo os seis indicadores dos países incluídos.
- [Atualização intermediária oficial](https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/WPP2024_CSV_files_update.zip): aplicada a Togo. A ONU corrigiu um ajuste censitário duplicado; sua linha Medium de 2024 foi usada por inteiro. A população é 8.406.558 habitantes, em vez dos 9.515.236 da primeira série. [Catálogo oficial com a nota da correção](https://population.un.org/wpp/assets/downloads.json).
- [Lista oficial dos membros da ONU](https://www.un.org/en/about-us/member-states) e [Estados não membros observadores](https://www.un.org/en/about-us/non-member-states): definem o universo de 193 + 2, sem incluir outros territórios do WPP.

Os observadores **Santa Sé (Vaticano), VAT**, e **Estado da Palestina, PSE**, têm cobertura para os seis campos no WPP e foram incluídos no Difícil. Indicadores modelados para microestados devem ser interpretados com cautela; cobertura numérica não equivale a precisão censitária. A página de membros utiliza atualmente o nome Naoero para Nauru; o registro associa esse nome a NRU e exibe “Nauru (Naoero)”. Nomes em português usam os códigos oficiais ISO, com os 36 nomes anteriores preservados.

## Indicadores e transformação

| Campo local | Coluna oficial | Unidade | Tratamento |
| --- | --- | --- | --- |
| population | TPopulation1July | Habitantes, em 1º de julho | Multiplicação exata de milhares por 1.000; inteiro |
| lifeExpectancy | LEx | Anos ao nascer, ambos os sexos | Precisão oficial preservada |
| fertility | TFR | Filhos por mulher | Precisão oficial preservada |
| infantMortality | IMR | Óbitos antes de um ano por 1.000 nascidos vivos | Precisão oficial preservada |
| netMigration | CNMR | Saldo migratório anual por 1.000 habitantes | Preservados valores positivos, negativos e zeros oficiais |
| medianAge | MedianAgePop | Anos, em 1º de julho | Precisão oficial preservada |

A comparação usa os valores originais, sem arredondamento. Os valores comparados mostram até seis casas para evitar aparentes empates causados pela apresentação; os outros indicadores têm duas casas. Zero só é aceito quando consta da fonte. O importador rejeita ausências, valores não finitos e intervalos incompatíveis. Há um único catálogo de execução, exportado em JSON, JavaScript e CSV, cujas representações são verificadas quanto à igualdade.

## Auditoria e reprodução

O arquivo `scripts/fixtures/un-register.json` associa cada código ao nome da ONU, ao nome do WPP, à bandeira e ao estado de cobertura. O arquivo `scripts/fixtures/wpp-2024-source-rows.csv` preserva os seis campos brutos de cada linha de 2024, identificando Togo como atualização intermediária. `qa/coverage.json` contém a versão estruturada deste levantamento. Os testes conferem os 1.170 valores contra essas linhas e os 216 valores anteriores contra a versão estável.

Baixe os quatro arquivos oficiais descritos na documentação de `scripts/import-data.py` para uma pasta de fontes e execute `python3 scripts/import-data.py /caminho/da/pasta`. Os arquivos esperados são `WPP2024_Demographic_Indicators_Medium.csv.gz`, `WPP2024_CSV_files_update.zip`, `un-members.html` e `un-observers.html`. O importador fixa a revisão principal por SHA-256 e falha se a lista da ONU mudar, para exigir revisão humana. Execute depois `node scripts/test.mjs`.

As 195 bandeiras são SVG locais do [FlagCDN](https://flagcdn.com/), compatíveis com os códigos ISO2. Foram verificadas quanto à existência, formato SVG e ausência de scripts/foreignObject/eventos onload. O manifesto `qa/flag-sources.json` registra URL e SHA-256 de cada arquivo. As 36 bandeiras anteriores foram reaproveitadas sem alteração. Não há acesso a APIs durante partidas.

Dados WPP: licença CC BY 3.0 IGO, conforme metadados anteriores. As listas de familiaridade são editoriais, sem ranking de desenvolvimento ou de força. O banco mundial segue o registro oficial da ONU, sem seleção por familiaridade.

## Integridade dos arquivos consultados

- WPP Medium original: `286ac36bb1415e2e1ade03acfef0a29f0e4c087e2f78e38c48f50c5df89082bc`.
- Atualização oficial: `eb7846bf5d937ee15060198e1130e770b885e58c24035b314966681ed929ca9f`.
- Página de membros: `b2f90ad5520bc822c603ce95abd599ef5e3e68c861d566fa6b944a81e7433011`.
- Página de observadores: `13cbc49f200f1b1b7ec865137a5442c40f2ba157cfabbf18d548f3c4b29bbcf2`.

## Cobertura por país

| País | ISO3 | Condição ONU | Campos válidos |
| --- | --- | --- | ---: |
| Afeganistão | AFG | Membro | 6 / 6 |
| África do Sul | ZAF | Membro | 6 / 6 |
| Albânia | ALB | Membro | 6 / 6 |
| Alemanha | DEU | Membro | 6 / 6 |
| Andorra | AND | Membro | 6 / 6 |
| Angola | AGO | Membro | 6 / 6 |
| Antígua e Barbuda | ATG | Membro | 6 / 6 |
| Arábia Saudita | SAU | Membro | 6 / 6 |
| Argélia | DZA | Membro | 6 / 6 |
| Argentina | ARG | Membro | 6 / 6 |
| Armênia | ARM | Membro | 6 / 6 |
| Austrália | AUS | Membro | 6 / 6 |
| Áustria | AUT | Membro | 6 / 6 |
| Azerbaijão | AZE | Membro | 6 / 6 |
| Bahamas | BHS | Membro | 6 / 6 |
| Bangladesh | BGD | Membro | 6 / 6 |
| Barbados | BRB | Membro | 6 / 6 |
| Barein | BHR | Membro | 6 / 6 |
| Bélgica | BEL | Membro | 6 / 6 |
| Belize | BLZ | Membro | 6 / 6 |
| Benin | BEN | Membro | 6 / 6 |
| Bielorrússia | BLR | Membro | 6 / 6 |
| Bolívia | BOL | Membro | 6 / 6 |
| Bósnia e Herzegovina | BIH | Membro | 6 / 6 |
| Botsuana | BWA | Membro | 6 / 6 |
| Brasil | BRA | Membro | 6 / 6 |
| Brunei | BRN | Membro | 6 / 6 |
| Bulgária | BGR | Membro | 6 / 6 |
| Burquina Faso | BFA | Membro | 6 / 6 |
| Burundi | BDI | Membro | 6 / 6 |
| Butão | BTN | Membro | 6 / 6 |
| Cabo Verde | CPV | Membro | 6 / 6 |
| Camarões | CMR | Membro | 6 / 6 |
| Camboja | KHM | Membro | 6 / 6 |
| Canadá | CAN | Membro | 6 / 6 |
| Catar | QAT | Membro | 6 / 6 |
| Cazaquistão | KAZ | Membro | 6 / 6 |
| Chade | TCD | Membro | 6 / 6 |
| Chile | CHL | Membro | 6 / 6 |
| China | CHN | Membro | 6 / 6 |
| Chipre | CYP | Membro | 6 / 6 |
| Colômbia | COL | Membro | 6 / 6 |
| Comores | COM | Membro | 6 / 6 |
| Congo | COG | Membro | 6 / 6 |
| Coreia do Norte | PRK | Membro | 6 / 6 |
| Coreia do Sul | KOR | Membro | 6 / 6 |
| Costa do Marfim | CIV | Membro | 6 / 6 |
| Costa Rica | CRI | Membro | 6 / 6 |
| Croácia | HRV | Membro | 6 / 6 |
| Cuba | CUB | Membro | 6 / 6 |
| Dinamarca | DNK | Membro | 6 / 6 |
| Djibuti | DJI | Membro | 6 / 6 |
| Dominica | DMA | Membro | 6 / 6 |
| Egito | EGY | Membro | 6 / 6 |
| El Salvador | SLV | Membro | 6 / 6 |
| Emirados Árabes Unidos | ARE | Membro | 6 / 6 |
| Equador | ECU | Membro | 6 / 6 |
| Eritreia | ERI | Membro | 6 / 6 |
| Eslováquia | SVK | Membro | 6 / 6 |
| Eslovênia | SVN | Membro | 6 / 6 |
| Espanha | ESP | Membro | 6 / 6 |
| Essuatíni | SWZ | Membro | 6 / 6 |
| Estado da Palestina | PSE | Observador | 6 / 6 |
| Estados Unidos | USA | Membro | 6 / 6 |
| Estônia | EST | Membro | 6 / 6 |
| Etiópia | ETH | Membro | 6 / 6 |
| Fiji | FJI | Membro | 6 / 6 |
| Filipinas | PHL | Membro | 6 / 6 |
| Finlândia | FIN | Membro | 6 / 6 |
| França | FRA | Membro | 6 / 6 |
| Gabão | GAB | Membro | 6 / 6 |
| Gâmbia | GMB | Membro | 6 / 6 |
| Gana | GHA | Membro | 6 / 6 |
| Geórgia | GEO | Membro | 6 / 6 |
| Granada | GRD | Membro | 6 / 6 |
| Grécia | GRC | Membro | 6 / 6 |
| Guatemala | GTM | Membro | 6 / 6 |
| Guiana | GUY | Membro | 6 / 6 |
| Guiné | GIN | Membro | 6 / 6 |
| Guiné-Bissau | GNB | Membro | 6 / 6 |
| Guiné Equatorial | GNQ | Membro | 6 / 6 |
| Haiti | HTI | Membro | 6 / 6 |
| Honduras | HND | Membro | 6 / 6 |
| Hungria | HUN | Membro | 6 / 6 |
| Iêmen | YEM | Membro | 6 / 6 |
| Ilhas Marshall | MHL | Membro | 6 / 6 |
| Ilhas Salomão | SLB | Membro | 6 / 6 |
| Índia | IND | Membro | 6 / 6 |
| Indonésia | IDN | Membro | 6 / 6 |
| Irã | IRN | Membro | 6 / 6 |
| Iraque | IRQ | Membro | 6 / 6 |
| Irlanda | IRL | Membro | 6 / 6 |
| Islândia | ISL | Membro | 6 / 6 |
| Israel | ISR | Membro | 6 / 6 |
| Itália | ITA | Membro | 6 / 6 |
| Jamaica | JAM | Membro | 6 / 6 |
| Japão | JPN | Membro | 6 / 6 |
| Jordânia | JOR | Membro | 6 / 6 |
| Kuwait | KWT | Membro | 6 / 6 |
| Laos | LAO | Membro | 6 / 6 |
| Lesoto | LSO | Membro | 6 / 6 |
| Letônia | LVA | Membro | 6 / 6 |
| Líbano | LBN | Membro | 6 / 6 |
| Libéria | LBR | Membro | 6 / 6 |
| Líbia | LBY | Membro | 6 / 6 |
| Liechtenstein | LIE | Membro | 6 / 6 |
| Lituânia | LTU | Membro | 6 / 6 |
| Luxemburgo | LUX | Membro | 6 / 6 |
| Macedônia do Norte | MKD | Membro | 6 / 6 |
| Madagascar | MDG | Membro | 6 / 6 |
| Malásia | MYS | Membro | 6 / 6 |
| Malawi | MWI | Membro | 6 / 6 |
| Maldivas | MDV | Membro | 6 / 6 |
| Mali | MLI | Membro | 6 / 6 |
| Malta | MLT | Membro | 6 / 6 |
| Marrocos | MAR | Membro | 6 / 6 |
| Maurício | MUS | Membro | 6 / 6 |
| Mauritânia | MRT | Membro | 6 / 6 |
| México | MEX | Membro | 6 / 6 |
| Mianmar (Birmânia) | MMR | Membro | 6 / 6 |
| Micronésia | FSM | Membro | 6 / 6 |
| Moçambique | MOZ | Membro | 6 / 6 |
| Moldávia | MDA | Membro | 6 / 6 |
| Mônaco | MCO | Membro | 6 / 6 |
| Mongólia | MNG | Membro | 6 / 6 |
| Montenegro | MNE | Membro | 6 / 6 |
| Namíbia | NAM | Membro | 6 / 6 |
| Nauru (Naoero) | NRU | Membro | 6 / 6 |
| Nepal | NPL | Membro | 6 / 6 |
| Nicarágua | NIC | Membro | 6 / 6 |
| Níger | NER | Membro | 6 / 6 |
| Nigéria | NGA | Membro | 6 / 6 |
| Noruega | NOR | Membro | 6 / 6 |
| Nova Zelândia | NZL | Membro | 6 / 6 |
| Omã | OMN | Membro | 6 / 6 |
| Países Baixos | NLD | Membro | 6 / 6 |
| Palau | PLW | Membro | 6 / 6 |
| Panamá | PAN | Membro | 6 / 6 |
| Papua-Nova Guiné | PNG | Membro | 6 / 6 |
| Paquistão | PAK | Membro | 6 / 6 |
| Paraguai | PRY | Membro | 6 / 6 |
| Peru | PER | Membro | 6 / 6 |
| Polônia | POL | Membro | 6 / 6 |
| Portugal | PRT | Membro | 6 / 6 |
| Quênia | KEN | Membro | 6 / 6 |
| Quirguistão | KGZ | Membro | 6 / 6 |
| Quiribati | KIR | Membro | 6 / 6 |
| Reino Unido | GBR | Membro | 6 / 6 |
| República Centro-Africana | CAF | Membro | 6 / 6 |
| República Democrática do Congo | COD | Membro | 6 / 6 |
| República Dominicana | DOM | Membro | 6 / 6 |
| Romênia | ROU | Membro | 6 / 6 |
| Ruanda | RWA | Membro | 6 / 6 |
| Rússia | RUS | Membro | 6 / 6 |
| Samoa | WSM | Membro | 6 / 6 |
| San Marino | SMR | Membro | 6 / 6 |
| Santa Lúcia | LCA | Membro | 6 / 6 |
| Santa Sé (Vaticano) | VAT | Observador | 6 / 6 |
| São Cristóvão e Névis | KNA | Membro | 6 / 6 |
| São Tomé e Príncipe | STP | Membro | 6 / 6 |
| São Vicente e Granadinas | VCT | Membro | 6 / 6 |
| Seicheles | SYC | Membro | 6 / 6 |
| Senegal | SEN | Membro | 6 / 6 |
| Serra Leoa | SLE | Membro | 6 / 6 |
| Sérvia | SRB | Membro | 6 / 6 |
| Singapura | SGP | Membro | 6 / 6 |
| Síria | SYR | Membro | 6 / 6 |
| Somália | SOM | Membro | 6 / 6 |
| Sri Lanka | LKA | Membro | 6 / 6 |
| Sudão | SDN | Membro | 6 / 6 |
| Sudão do Sul | SSD | Membro | 6 / 6 |
| Suécia | SWE | Membro | 6 / 6 |
| Suíça | CHE | Membro | 6 / 6 |
| Suriname | SUR | Membro | 6 / 6 |
| Tadjiquistão | TJK | Membro | 6 / 6 |
| Tailândia | THA | Membro | 6 / 6 |
| Tanzânia | TZA | Membro | 6 / 6 |
| Tchéquia | CZE | Membro | 6 / 6 |
| Timor-Leste | TLS | Membro | 6 / 6 |
| Togo | TGO | Membro | 6 / 6 |
| Tonga | TON | Membro | 6 / 6 |
| Trinidad e Tobago | TTO | Membro | 6 / 6 |
| Tunísia | TUN | Membro | 6 / 6 |
| Turcomenistão | TKM | Membro | 6 / 6 |
| Turquia | TUR | Membro | 6 / 6 |
| Tuvalu | TUV | Membro | 6 / 6 |
| Ucrânia | UKR | Membro | 6 / 6 |
| Uganda | UGA | Membro | 6 / 6 |
| Uruguai | URY | Membro | 6 / 6 |
| Uzbequistão | UZB | Membro | 6 / 6 |
| Vanuatu | VUT | Membro | 6 / 6 |
| Venezuela | VEN | Membro | 6 / 6 |
| Vietnã | VNM | Membro | 6 / 6 |
| Zâmbia | ZMB | Membro | 6 / 6 |
| Zimbábue | ZWE | Membro | 6 / 6 |

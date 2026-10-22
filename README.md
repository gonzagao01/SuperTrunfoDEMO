# Super Trunfo — Demografia UFMG — dificuldade normal

Atualização para aprovação na branch `atualizacao/dificuldade-normal` do repositório existente `gonzagao01/SuperTrunfoDEMO`. A branch `main` e a publicação permanecem na versão estável até aprovação explícita.

## Testar

Nesta pasta:

```sh
python3 -m http.server 4181 --directory projeto-demografia-ufmg
```

Abra `http://localhost:4181`. Não há pacotes a instalar. Os dados e as 36 bandeiras são locais. O diretório `projeto-demografia-ufmg` contém apenas os arquivos do site. Documentação, testes e evidências ficam na raiz do repositório, fora da publicação.

## Alterações funcionais

- Removida a classificação das cartas, seu cálculo e seus rótulos. Antes da confirmação, a carta mostra somente bandeira e nome. Nenhum valor de indicador é inserido no HTML ou nos atributos de acessibilidade nessa etapa.
- O jogador continua escolhendo entre suas três cartas e pode mudar de escolha antes de confirmar. **Ver meu baralho** conserva nomes, bandeiras e estados dos 12 países. As cartas da reserva e as descartadas não podem ser jogadas.
- O computador estima as próprias cartas para o indicador e o objetivo atuais, com arredondamento e incerteza. Sorteia a primeira, segunda ou terceira carta dessa ordem estimada com pesos iniciais de **70% / 25% / 5%**.
- Sua escolha fica definida no início da rodada, antes de qualquer seleção do jogador. Trocas da escolha adversária não provocam nova avaliação.
- Após a confirmação, os seis valores das duas cartas são revelados, com o indicador utilizado destacado.
- Tutorial e Como jogar foram atualizados para refletir a mecânica. Cores, tipografia, disposição, cartas e demais componentes foram preservados; o CSS mudou somente para remover estilos dos rótulos e da explicação eliminados.

Permanecem: 36 países e 216 valores, sorteio de 24 países, 12 cartas por lado, mãos de três cartas enquanto houver reserva, 12 rodadas, cada indicador uma vez com MAIOR e uma com MENOR, um ponto por vitória, empate sem pontuação, descarte e resultado final. As duas últimas rodadas têm duas cartas e depois uma, pois todas as 12 cartas são usadas.

## Configurar a dificuldade

Edite `projeto-demografia-ufmg/difficulty.js`:

```js
rankWeights: Object.freeze([0.70, 0.25, 0.05]),
uncertainty: 0.15,
```

Os três pesos se referem à ordem **estimada** da mão, não à chance de vitória nem à ordem real. Podem ser proporções ou pesos como `[70, 25, 5]`; são normalizados. Com duas cartas, os pesos restantes são renormalizados; se ambos forem zero, o sorteio é uniforme. Com uma carta, ela é obrigatória. As configurações são copiadas e congeladas ao iniciar cada partida.

A aproximação usa somente os valores do indicador atual nas próprias cartas. A população é transformada em escala logarítmica, para lidar com países de tamanhos muito diferentes. A escala de incerteza é o maior entre a amplitude da própria mão e 10% da maior magnitude, com arredondamento em passos de 10% dessa escala e ruído uniforme de até `uncertainty` vezes a escala para cada carta. Valores próximos podem trocar de posição na estimativa. A decisão ponderada também permite escolher cartas estimadas como menos favoráveis.

A função de escolha recebe apenas IDs, estimativas e o objetivo público. Não recebe valores adversários, seleção do jogador, cartas da reserva, catálogo, regras futuras, percentis ou probabilidades exatas de vitória. A regra e o baralho são sorteados antes da primeira decisão do computador; os parâmetros de estratégia não influenciam o sorteio inicial.

O motor mantém o estado privado em `WeakMap`. A visão da interface expõe apenas identidades antes da revelação e resultados já públicos depois dela. Como na versão anterior, o dataset acadêmico continua disponível nos arquivos locais; não se trata de ocultação criptográfica dos dados.

## Dataset preservado

Os arquivos de dados e as 36 bandeiras permanecem idênticos aos da versão aprovada. Fonte registrada no projeto: ONU, World Population Prospects 2024, cenário médio, referência 2024. Não houve nova extração, substituição, arredondamento ou alteração dos valores nesta atualização.

SHA-256 de `countries.json`: `3cd1d5ebb4b148e37d9d0b150b15529d4a89cb51c0e3242c9fbf32d7868aa9bb`.

## Testes e equilíbrio

```sh
node scripts/test.mjs
node scripts/simulate-balance.mjs
```

O primeiro verifica dados, escolhas, privacidade, reposição, descarte, regras, pontuação, empates, conclusão, probabilidades e configurações. Inclui 200 partidas completas e 80 pares de partidas que variam escolhas e valores ocultos do adversário.

O segundo executa 20.000 partidas completas contra quatro modelos de conhecimento. Os resultados estão em `qa/EQUILIBRIO.md` e `qa/balance-results.json`. Contra escolhas aleatórias, o computador é forte; contra conhecimento básico, o desafio é moderado; o desempenho cai contra conhecimento mais elevado. Não houve ajuste para forçar 50% de vitórias. Esses modelos não substituem testes com pessoas.

Veja `qa/VERIFICACAO.md` para a validação em navegador de computador e em larguras de celular. Esta versão deve ser aprovada antes de substituir arquivos do site público.

## Publicação no mesmo endereço

O único endereço público é https://gonzagao01.github.io/SuperTrunfoDEMO/. Esta atualização deve substituir a versão anterior nesse mesmo site, sem criar outro repositório ou site.

- Desenvolvimento e revisão na branch `atualizacao/dificuldade-normal`.
- Integrar à `main` somente após a aprovação do responsável. Não ativar integração automática.
- Preservar `.github/workflows/deploy.yml`, as configurações do GitHub Pages e o histórico de commits.
- Manter `projeto-demografia-ufmg` como diretório publicado pelo workflow existente.
- A proposta retira desse diretório os relatórios, imagens e testes anteriores; a documentação e os testes atualizados ficam fora da publicação. Os dados e bandeiras são preservados exatamente.
- Após a aprovação e a integração, aguardar o workflow existente e verificar no mesmo endereço o tutorial, as 12 rodadas, os valores ocultos/revelados, as bandeiras, as fontes, os downloads de dados e a experiência em tamanhos de computador e celular.
- Para recuperação, reverter o commit de integração usando o histórico, sem apagar o repositório nem reescrever commits.

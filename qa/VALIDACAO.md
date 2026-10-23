# Validação da atualização dos três modos

Revisão de 23/10/2026, para aprovação na branch `atualizacao/tres-modos-mundial`. A base é a `main` no commit `4693621d19b8015ad8f0a458934084ca51e6f97d`, após a integração da atualização anterior pelo responsável. Nenhuma integração ou publicação foi realizada nesta revisão.

## Dados

- 195 países únicos: 193 membros da ONU e dois observadores; seis campos finitos por país, 1.170 valores.
- Os 36 países anteriores e seus 216 valores, nomes e bandeiras foram preservados. Atualização oficial intermediária aplicada a Togo, com todos os seis valores da mesma linha de 2024.
- Paridade JSON / JavaScript / CSV; comparação dos 1.170 campos com as linhas oficiais arquivadas para auditoria; população convertida exatamente de milhares para habitantes.
- 195 bandeiras SVG locais, códigos ISO2 e arquivos seguros verificados. Nenhum campo ausente foi preenchido com zero.
- Relatório completo e listas definitivas: `COBERTURA-E-FONTES.md` e `PAISES-POR-MODO.md`.

## Regras e privacidade automatizadas

`node scripts/test.mjs` passou:

- 200 partidas completas por modo, 600 no total; 24 países distintos, 12 por lado, 12 rodadas e todas as combinações indicador/objetivo exatamente uma vez.
- Fácil: todas as 12 cartas próprias disponíveis no início, seis números visíveis; qualquer carta restante pode ser escolhida e a utilizada é descartada.
- Normal: banco 60, seis conhecidos e seis menos conhecidos para cada participante. Escolha legal entre até três cartas, com reposição da reserva.
- Difícil: sorteio sem grupos a partir de todo o banco mundial. Nas 200 partidas, os 195 países apareceram no conjunto dos sorteios.
- Identidade, nome e bandeira são os únicos campos das cartas próprias ainda ocultas no Normal e Difícil. Baralho próprio inclui estados; nenhuma reserva pode ser jogada nesses modos.
- 120 pares de partidas, 240 jogos adicionais, alteraram escolhas e apenas os valores do jogador, sem mudar a sequência de cartas selecionadas pelo robô. Nenhum sorteio ou reconsideração ocorre entre seleção do jogador e revelação.
- 1.000 mãos comparadas contra um snapshot do algoritmo anterior: estimativas e decisões idênticas para as mesmas entradas e sementes. Normal e Difícil passam pela mesma função, com pesos 70/25/5 e incerteza 0,15. Configurações da partida são copiadas e congeladas.
- Entradas protegidas verificam que a avaliação lê apenas IDs e o indicador atual da própria mão; a decisão recebe somente IDs, estimativas e o objetivo. Dados adversários e valores crus são rejeitados na função de decisão.
- 30.000 escolhas de teste: 21.014 primeiras estimativas, 7.460 segundas e 1.526 terceiras (70,05% / 24,87% / 5,09%). Verificadas também mãos finais de duas e uma carta.
- Empates para todos os indicadores e ambos os objetivos em cada modo, sem pontos; migração negativa comparada com sinal correto; diferenças pequenas não são arredondadas antes da comparação.
- Os templates reais de `app.js` foram exercitados em mais 36 rodadas empatadas com fixture de teste: MAIOR e MENOR, nenhum número vencedor verde, dois detalhes de indicadores, placar zero e resultado empatado. Esse teste usa um DOM mínimo em Node, separadamente da verificação visual no navegador. O catálogo publicado nunca recebe esse fixture.

## Navegador: computador e celular

Foram jogadas **seis partidas completas / 72 rodadas**, uma por modo em cada tamanho, registradas em `ui-results.json`:

- Computador: viewport solicitado 1366 × 900; área útil variou de 1351 a 1366 px com a barra de rolagem.
- Celular: viewport solicitado 390 × 844; a largura útil foi conferida no DOM em cada rodada. Teste adicional de cliques, objetivo, revelação e tutorial com 320 × 720.
- Antes da confirmação: botão desabilitado sem escolha; no Fácil, seis campos por carta legal; Normal/Difícil sem valores numéricos de indicadores no HTML das cartas. Reserva apenas consultável.
- Depois da confirmação: dois números grandes, verde somente no vencedor real conforme MAIOR/MENOR, texto explicativo coerente, placar atualizado e seis indicadores acessíveis em detalhes.
- Em cada partida: 12 combinações únicas, seis MAIOR e seis MENOR; 24 países sem repetição; 12 resultados e tela final alcançada. Nenhuma rolagem horizontal na área útil verificada.
- Tutorial completado na primeira abertura, reaberto em Como jogar e testado por teclado e por cliques; seleção de dificuldade, baralho próprio e retorno ao menu também verificados.
- Console do navegador sem erros ou avisos. As bandeiras das partidas carregaram; uma checagem inicial de imagem feita antes do fim do carregamento foi repetida e confirmou o SVG, sem falha no arquivo.
- Navegação por teclado exercitou seleção, confirmação, expansão dos seis indicadores e avanço. Foco visível, controles nativos de rádio e diálogo, nomes acessíveis e regiões de resultado presentes.
- Animação de revelação de 400 ms. A folha de estilo contém a alternativa `prefers-reduced-motion: reduce`, que desativa animações, transições e rolagem animada; a preferência do sistema do usuário não foi modificada para o teste. Contraste preservado na paleta aprovada, com o vencedor em verde claro sobre cinza escuro.

São testes de navegador com viewport de celular, não testes em um aparelho físico ou garantia de compatibilidade com todo navegador móvel. As evidências JPEG acompanham os relatórios nesta pasta. `celular-320-revelacao.jpg` mostra a comparação completa com objetivo MENOR, incluindo vitória do computador.

## Simulações

`node scripts/simulate-balance.mjs` passou: **60.000 partidas / 720.000 rodadas**, com 5.000 por modo e perfil. Todos os baralhos e sequências de cada combinação foram distintos e válidos. As hipóteses, taxas de vitória, empates e pontos médios estão em `EQUILIBRIO.md` e `balance-results.json`. Não foi feita calibração para buscar 50%; modelos de conhecimento não substituem testes com pessoas.

## Publicação e arquitetura

O projeto continua estático, com configuração de modos, regras, distribuição e robô separados, um único catálogo e assets locais. O workflow de publicação e a pasta pública foram preservados. Testes, snapshots e relatórios ficam fora de `projeto-demografia-ufmg/`. A revisão deve ser integrada à `main` apenas após aprovação explícita; depois disso, a validação da publicação deverá usar o mesmo endereço já existente.

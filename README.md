# O Mistério das Portas Mágicas 🚪✨

Um jogo educacional que transforma **portas lógicas** em **magias de outro universo**. Explore o funcionamento das operações booleanas de forma lúdica: duas portas, dois artefatos místicos e um portal sagrado cuja lógica só você pode desvendar.

> 🔮 **Jogue agora:** [evandrolimabarbosa.github.io/PortasMagicas](https://evandrolimabarbosa.github.io/PortasMagicas/)

---

## 🎮 Como jogar

1. **Abra as portas** — Clique nas portas A e B para ativar ou desativar os artefatos.
2. **Observe o sinal** — O orbe central indica se o Portal Sagrado está *ativo* ou *inativo* para cada combinação de artefatos.
3. **Consulte a tabela de artefatos** — Alternne entre as abas **Portas** e **Tabela** para ver o sinal do portal em todas as combinações possíveis (a linha atual fica destacada).
4. **Descubra a magia** — Escolha qual operação lógica controla o portal. Acertou? As portas se abrem e revelam o tesouro! Errou? O selo mágico te repele — mas agora você sabe qual era a resposta.

## 🧙 As magias do portal

| Símbolo | Operação | Nome mágico | Regra |
| :-: | :-: | :- | :- |
| `·` | AND | Magia da Conjunção | Ativa quando **A e B** estão ativos |
| `+` | OR | Magia da Disjunção | Ativa quando **A ou B** (ou ambos) está ativo |
| `⊕` | XOR | Magia do Exclusivo | Ativa quando **exatamente um** está ativo |
| `¬` | NOT | Magia do Inversor | Sempre o **oposto do Artefato A** |
| `⊼` | NAND | Magia da Negação da Conjunção | Falha **só com ambos ativos** |
| `⊽` | NOR | Magia da Negação da Disjunção | Ativa **só com ambos inativos** |

## ✨ Destaques

- 🚪 Portas animadas com efeito 3D ao abrir e tremor ao errar
- 🔍 Tabela-verdade interativa que destaca a combinação atual
- 📊 Estatísticas persistentes: rodadas, acertos, erros e sequência de vitórias
- 🧘 Acessibilidade: navegação por teclado, `aria-live` e suporte a `prefers-reduced-motion`
- 📱 Layout responsivo para desktop e mobile

## 🛠️ Tecnologias

- **HTML5** — estrutura semântica e acessível
- **CSS3** — tema místico com gradientes, animações e dark mode
- **JavaScript** (vanilla) — lógica do jogo, sem dependências

## 🚀 Como executar

Como é um projeto 100% estático, basta abrir o `index.html` no navegador ou servir a pasta com qualquer servidor local:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Depois acesse `http://localhost:8000`.

## 🏗️ Estrutura do projeto

```
Portas-Magicas/
├── index.html   # Estrutura e interface do jogo
├── style.css    # Tema místico, animações e responsividade
├── game.js      # Lógica do jogo (portas lógicas, tabela-verdade, estatísticas)
└── README.md
```

## 📖 Conceito educacional

O jogo ensina os fundamentos da **álgebra booleana** e das **portas lógicas** — a base de toda a computação — por trás de uma narrativa mística. Cada rodada sorteia uma operação e o jogador precisa inferir a regra a partir da experimentação, estimulando o **raciocínio lógico** e a **investigação científica**.

---

Feito com 💜 e um toque de magia. Divirta-se desvendando os mistérios do portal!

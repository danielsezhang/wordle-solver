# Entropy-based Wordle solver

The solver precomputes a compact feedback matrix for every guess/answer pair and
ranks guesses by Shannon entropy. It accepts arbitrary word lists, including
12,000+ word corpora, without changing its search algorithm.

```js
import { EntropySolver } from "./src/solver.js";

const solver = new EntropySolver(answerWords, allowedGuesses);
const choice = solver.suggest(1)[0];
solver.observe(choice.word, observedFeedback);
```

```sh
npm test
npm run benchmark
```

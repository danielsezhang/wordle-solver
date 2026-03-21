# Entropy-based Wordle solver

The solver precomputes a compact feedback matrix for every guess/answer pair and
ranks guesses by Shannon entropy. It accepts arbitrary word lists, including
12,000+ word corpora, without changing its search algorithm.

```js
import { CORRECT, PRESENT, ABSENT, encodeFeedback } from "./src/feedback.js";
import { EntropySolver } from "./src/solver.js";

const solver = new EntropySolver(answerWords, allowedGuesses);
const [choice] = solver.suggest(1); // { word, entropy, candidate }
solver.observe(choice.word, encodeFeedback([CORRECT, ABSENT, PRESENT, ABSENT, ABSENT]));
solver.remaining(); // answers still consistent with every observation
```

## Behaviour

- Feedback follows Wordle's repeated-letter rule: a letter is marked present only as many
  times as the answer still has unmatched copies of it.
- On equal entropy, `suggest` prefers a word that can still be the answer, so it guesses the
  answer once no other guess can split the remaining candidates.
- `observe` throws, and keeps the current candidates, when the feedback is invalid or rules out
  every remaining answer.
- The opening ranking is cached, because it depends only on the word lists.

## Commands

```sh
npm test
npm run benchmark
```

The benchmark builds a 13,000 x 2,300 matrix of synthetic words, ranks the opening guess, and
plays 200 games to report the mean and worst number of guesses.

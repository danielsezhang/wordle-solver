import { feedback } from "./feedback.js";

const OUTCOME_COUNT = 3 ** 5;

function normalize(words) {
  const unique = new Set();
  for (const word of words) {
    const normalized = word.trim().toLowerCase();
    if (/^[a-z]{5}$/.test(normalized)) unique.add(normalized);
  }
  return [...unique];
}

export class EntropySolver {
  constructor(answers, guesses = answers) {
    this.answers = normalize(answers);
    this.guesses = normalize(guesses);
    if (this.answers.length === 0 || this.guesses.length === 0) {
      throw new Error("A non-empty five-letter lexicon is required");
    }
    this.answerIndex = new Map(this.answers.map((word, index) => [word, index]));
    this.guessIndex = new Map(this.guesses.map((word, index) => [word, index]));
    this.matrix = this.#buildMatrix();
    this.candidates = Uint32Array.from(this.answers.keys());
  }

  reset() {
    this.candidates = Uint32Array.from(this.answers.keys());
  }

  observe(guess, outcome) {
    const guessIndex = this.guessIndex.get(guess);
    if (guessIndex === undefined) throw new Error(`Unknown guess: ${guess}`);
    const kept = [];
    for (const answerIndex of this.candidates) {
      if (this.matrix[guessIndex * this.answers.length + answerIndex] === outcome) kept.push(answerIndex);
    }
    this.candidates = Uint32Array.from(kept);
    return this.candidates.length;
  }

  entropy(guessIndex) {
    const buckets = new Uint32Array(OUTCOME_COUNT);
    for (const answerIndex of this.candidates) {
      buckets[this.matrix[guessIndex * this.answers.length + answerIndex]] += 1;
    }
    const total = this.candidates.length;
    let value = 0;
    for (const count of buckets) {
      if (count !== 0) {
        const probability = count / total;
        value -= probability * Math.log2(probability);
      }
    }
    return value;
  }

  suggest(limit = 10) {
    return this.guesses
      .map((word, index) => ({ word, entropy: this.entropy(index) }))
      .sort((left, right) => right.entropy - left.entropy || left.word.localeCompare(right.word))
      .slice(0, limit);
  }

  #buildMatrix() {
    const matrix = new Uint8Array(this.guesses.length * this.answers.length);
    for (let guessIndex = 0; guessIndex < this.guesses.length; guessIndex += 1) {
      for (let answerIndex = 0; answerIndex < this.answers.length; answerIndex += 1) {
        matrix[guessIndex * this.answers.length + answerIndex] =
          feedback(this.guesses[guessIndex], this.answers[answerIndex]);
      }
    }
    return matrix;
  }
}

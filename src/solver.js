import { OUTCOME_COUNT, feedbackFromCodes, isFeedbackCode, letterCodes } from "./feedback.js";

function normalize(words) {
  const unique = new Set();
  for (const word of words) {
    const normalized = word.trim().toLowerCase();
    if (/^[a-z]{5}$/.test(normalized)) unique.add(normalized);
  }
  return [...unique];
}

function compareSuggestions(left, right) {
  if (left.entropy !== right.entropy) return right.entropy - left.entropy;
  if (left.candidate !== right.candidate) return left.candidate ? -1 : 1;
  if (left.word === right.word) return 0;
  return left.word < right.word ? -1 : 1;
}

export class EntropySolver {
  #buckets = new Uint32Array(OUTCOME_COUNT);
  #touched = new Uint8Array(OUTCOME_COUNT);
  #opening = [];

  /** Answer indices that are still consistent with every observation. */
  candidates;

  /**
   * @param {Iterable<string>} answers Words that can be the hidden answer.
   * @param {Iterable<string>} [guesses] Words that may be guessed; defaults to `answers`.
   */
  constructor(answers, guesses = answers) {
    this.answers = normalize(answers);
    this.guesses = normalize(guesses);
    if (this.answers.length === 0 || this.guesses.length === 0) {
      throw new Error("A non-empty five-letter lexicon is required");
    }
    this.guessIndex = new Map(this.guesses.map((word, index) => [word, index]));
    this.matrix = this.#buildMatrix();
    this.reset();
  }

  reset() {
    this.candidates = Uint32Array.from(this.answers.keys());
  }

  /** Returns the answer words that are still possible. */
  remaining() {
    return Array.from(this.candidates, (answerIndex) => this.answers[answerIndex]);
  }

  /**
   * Keeps only answers that produce `outcome` for `guess`.
   * Throws without changing state when the outcome rules out every candidate.
   * @returns {number} The number of remaining candidates.
   */
  observe(guess, outcome) {
    const guessIndex = this.guessIndex.get(guess.trim().toLowerCase());
    if (guessIndex === undefined) throw new Error(`Unknown guess: ${guess}`);
    if (!isFeedbackCode(outcome)) throw new Error(`Invalid feedback code: ${outcome}`);

    const row = this.#row(guessIndex);
    const kept = this.candidates.filter((answerIndex) => row[answerIndex] === outcome);
    if (kept.length === 0) {
      throw new Error(`Feedback ${outcome} for ${guess} is inconsistent with every candidate`);
    }
    this.candidates = kept;
    return kept.length;
  }

  /** Shannon entropy, in bits, of the feedback distribution over the remaining candidates. */
  entropy(guessIndex) {
    const buckets = this.#buckets;
    const touched = this.#touched;
    const row = this.#row(guessIndex);
    let touchedCount = 0;
    for (const answerIndex of this.candidates) {
      const outcome = row[answerIndex];
      if (buckets[outcome] === 0) touched[touchedCount++] = outcome;
      buckets[outcome] += 1;
    }

    const total = this.candidates.length;
    let value = 0;
    for (let index = 0; index < touchedCount; index += 1) {
      const probability = buckets[touched[index]] / total;
      value -= probability * Math.log2(probability);
      buckets[touched[index]] = 0;
    }
    return value;
  }

  /**
   * Ranks guesses by entropy. On equal entropy, a guess that can still be the answer ranks first,
   * so the solver commits to the answer once no guess can split the candidates further.
   */
  suggest(limit = 10) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error(`Invalid limit: ${limit}`);
    // Candidates are a subset of answers, so a full-length set is the unchanging opening state.
    const opening = this.candidates.length === this.answers.length;
    if (opening && this.#opening.length >= Math.min(limit, this.guesses.length)) {
      return this.#opening.slice(0, limit).map((suggestion) => ({ ...suggestion }));
    }

    const remaining = new Set(this.remaining());
    const best = [];
    for (let index = 0; index < this.guesses.length; index += 1) {
      const word = this.guesses[index];
      const suggestion = { word, entropy: this.entropy(index), candidate: remaining.has(word) };
      if (best.length === limit && compareSuggestions(suggestion, best[limit - 1]) >= 0) continue;

      let position = best.length === limit ? limit - 1 : best.length;
      while (position > 0 && compareSuggestions(suggestion, best[position - 1]) < 0) {
        best[position] = best[position - 1];
        position -= 1;
      }
      best[position] = suggestion;
    }
    if (opening) this.#opening = best.map((suggestion) => ({ ...suggestion }));
    return best;
  }

  #row(guessIndex) {
    const width = this.answers.length;
    return this.matrix.subarray(guessIndex * width, (guessIndex + 1) * width);
  }

  #buildMatrix() {
    const width = this.answers.length;
    const answers = this.answers.map(letterCodes);
    const matrix = new Uint8Array(this.guesses.length * width);
    for (let guessIndex = 0; guessIndex < this.guesses.length; guessIndex += 1) {
      const guess = letterCodes(this.guesses[guessIndex]);
      const offset = guessIndex * width;
      for (let answerIndex = 0; answerIndex < width; answerIndex += 1) {
        matrix[offset + answerIndex] = feedbackFromCodes(guess, answers[answerIndex]);
      }
    }
    return matrix;
  }
}

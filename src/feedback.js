export const CORRECT = 2;
export const PRESENT = 1;
export const ABSENT = 0;

export const WORD_LENGTH = 5;
export const OUTCOME_COUNT = 3 ** WORD_LENGTH;
export const ALL_CORRECT = OUTCOME_COUNT - 1;

const LETTER_A = 97;
const ALPHABET_SIZE = 26;

// Scratch buffers keep the hot path allocation-free; feedback is computed once per matrix cell.
const unmatched = new Uint8Array(ALPHABET_SIZE);
const marks = new Uint8Array(WORD_LENGTH);

/** Converts a lowercase five-letter word into letter indices in [0, 26). */
export function letterCodes(word) {
  if (word.length !== WORD_LENGTH) throw new Error("Words must be five letters");
  const codes = new Uint8Array(WORD_LENGTH);
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    const code = word.charCodeAt(index) - LETTER_A;
    if (code < 0 || code >= ALPHABET_SIZE) throw new Error(`Invalid word: ${word}`);
    codes[index] = code;
  }
  return codes;
}

/** Returns the base-3 encoded Wordle feedback for `guess` against `answer`. */
export function feedback(guess, answer) {
  return feedbackFromCodes(letterCodes(guess), letterCodes(answer));
}

/** Same as `feedback`, for words already converted with `letterCodes`. */
export function feedbackFromCodes(guess, answer) {
  unmatched.fill(0);
  let code = 0;
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (guess[index] === answer[index]) {
      marks[index] = CORRECT;
    } else {
      marks[index] = ABSENT;
      unmatched[answer[index]] += 1;
    }
  }
  for (let index = 0; index < WORD_LENGTH; index += 1) {
    if (marks[index] === ABSENT && unmatched[guess[index]] > 0) {
      marks[index] = PRESENT;
      unmatched[guess[index]] -= 1;
    }
    code = code * 3 + marks[index];
  }
  return code;
}

/** Encodes five marks (ABSENT, PRESENT, CORRECT) as an integer in [0, OUTCOME_COUNT). */
export function encodeFeedback(result) {
  if (result.length !== WORD_LENGTH) throw new Error("Feedback must have five marks");
  let code = 0;
  for (const mark of result) {
    if (mark !== ABSENT && mark !== PRESENT && mark !== CORRECT) {
      throw new Error(`Invalid feedback mark: ${mark}`);
    }
    code = code * 3 + mark;
  }
  return code;
}

export function decodeFeedback(code) {
  if (!isFeedbackCode(code)) throw new Error(`Invalid feedback code: ${code}`);
  const result = new Uint8Array(WORD_LENGTH);
  for (let index = WORD_LENGTH - 1; index >= 0; index -= 1) {
    result[index] = code % 3;
    code = Math.floor(code / 3);
  }
  return result;
}

export function isFeedbackCode(code) {
  return Number.isInteger(code) && code >= 0 && code < OUTCOME_COUNT;
}

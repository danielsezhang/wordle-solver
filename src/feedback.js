export const CORRECT = 2;
export const PRESENT = 1;
export const ABSENT = 0;

export function feedback(guess, answer) {
  if (guess.length !== 5 || answer.length !== 5) throw new Error("Words must be five letters");
  const result = new Uint8Array(5);
  const remaining = new Map();

  for (let index = 0; index < 5; index += 1) {
    if (guess[index] === answer[index]) {
      result[index] = CORRECT;
    } else {
      remaining.set(answer[index], (remaining.get(answer[index]) ?? 0) + 1);
    }
  }
  for (let index = 0; index < 5; index += 1) {
    if (result[index] === CORRECT) continue;
    const count = remaining.get(guess[index]) ?? 0;
    if (count > 0) {
      result[index] = PRESENT;
      remaining.set(guess[index], count - 1);
    }
  }
  return encodeFeedback(result);
}

export function encodeFeedback(result) {
  let code = 0;
  for (const mark of result) code = code * 3 + mark;
  return code;
}

export function decodeFeedback(code) {
  const result = new Uint8Array(5);
  for (let index = 4; index >= 0; index -= 1) {
    result[index] = code % 3;
    code = Math.floor(code / 3);
  }
  return result;
}

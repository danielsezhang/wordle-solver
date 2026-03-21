import assert from "node:assert/strict";
import test from "node:test";

import { ABSENT, CORRECT, PRESENT, decodeFeedback, feedback } from "../src/feedback.js";
import { EntropySolver } from "../src/solver.js";

test("feedback accounts for repeated letters", () => {
  const marks = decodeFeedback(feedback("allay", "apple"));
  assert.deepEqual([...marks], [CORRECT, PRESENT, ABSENT, ABSENT, ABSENT]);
});

test("entropy ranking and observation reduce the search space", () => {
  const words = ["cigar", "rebut", "sissy", "humph", "awake", "blush"];
  const solver = new EntropySolver(words);
  const guess = solver.suggest(1)[0];
  assert.ok(guess.entropy > 0);

  const target = "awake";
  const remaining = solver.observe(guess.word, feedback(guess.word, target));
  assert.ok(remaining < words.length);
  assert.ok(solver.candidates.length >= 1);
});

test("an all-absent result removes incompatible answers", () => {
  const solver = new EntropySolver(["cigar", "rebut", "humph"]);
  solver.observe("cigar", ABSENT);
  assert.deepEqual([...solver.candidates].map((index) => solver.answers[index]), ["humph"]);
});

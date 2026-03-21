import assert from "node:assert/strict";
import test from "node:test";

import {
  ABSENT,
  ALL_CORRECT,
  CORRECT,
  OUTCOME_COUNT,
  PRESENT,
  decodeFeedback,
  encodeFeedback,
  feedback,
} from "../src/feedback.js";
import { EntropySolver } from "../src/solver.js";

const C = CORRECT;
const P = PRESENT;
const A = ABSENT;

function marks(guess, answer) {
  return [...decodeFeedback(feedback(guess, answer))];
}

function play(solver, answer, maxGuesses = 10) {
  solver.reset();
  for (let turn = 1; turn <= maxGuesses; turn += 1) {
    const { word } = solver.suggest(1)[0];
    const outcome = feedback(word, answer);
    if (outcome === ALL_CORRECT) return turn;
    solver.observe(word, outcome);
  }
  return Infinity;
}

test("feedback marks repeated letters only as often as the answer contains them", () => {
  assert.deepEqual(marks("allay", "apple"), [C, P, A, A, A]);
  assert.deepEqual(marks("speed", "abide"), [A, A, P, A, P]);
  assert.deepEqual(marks("eerie", "there"), [P, A, P, A, C]);
  assert.deepEqual(marks("lolly", "hello"), [A, P, C, C, A]);
  assert.equal(feedback("crane", "crane"), ALL_CORRECT);
});

test("feedback rejects words that are not five lowercase letters", () => {
  assert.throws(() => feedback("four", "crane"), /five letters/);
  assert.throws(() => feedback("CRANE", "crane"), /Invalid word/);
});

test("feedback codes round-trip through decode and encode", () => {
  for (let code = 0; code < OUTCOME_COUNT; code += 1) {
    assert.equal(encodeFeedback(decodeFeedback(code)), code);
  }
  assert.throws(() => decodeFeedback(OUTCOME_COUNT), /Invalid feedback code/);
  assert.throws(() => encodeFeedback([3, 0, 0, 0, 0]), /Invalid feedback mark/);
});

test("an all-absent result removes incompatible answers", () => {
  const solver = new EntropySolver(["cigar", "rebut", "humph"]);
  assert.equal(solver.observe("cigar", encodeFeedback([A, A, A, A, A])), 1);
  assert.deepEqual(solver.remaining(), ["humph"]);
});

test("observe normalizes the guess and rejects invalid or impossible feedback", () => {
  const solver = new EntropySolver(["cigar", "rebut", "humph"]);
  assert.throws(() => solver.observe("zzzzz", 0), /Unknown guess/);
  assert.throws(() => solver.observe("cigar", -1), /Invalid feedback code/);
  assert.throws(() => solver.observe("cigar", encodeFeedback([C, C, C, C, A])), /inconsistent/);
  assert.deepEqual(solver.remaining(), ["cigar", "rebut", "humph"]);
  assert.equal(solver.observe(" CIGAR ", feedback("cigar", "rebut")), 1);
});

test("suggest returns the last candidate instead of an alphabetically earlier guess", () => {
  const answers = ["cigar", "rebut", "humph"];
  const solver = new EntropySolver(answers, ["aaaaa", ...answers]);
  solver.observe("cigar", feedback("cigar", "humph"));
  assert.deepEqual(solver.suggest(1), [{ word: "humph", entropy: 0, candidate: true }]);
});

test("suggest prefers a possible answer over an equally informative non-answer", () => {
  const solver = new EntropySolver(["mount", "point"], ["abbbb", "mount", "point"]);
  const [best] = solver.suggest(1);
  assert.equal(best.entropy, 1);
  assert.equal(best.word, "mount");
});

test("suggest ranks the most informative guess first", () => {
  const words = ["cigar", "rebut", "sissy", "humph", "awake", "blush"];
  const solver = new EntropySolver(words);
  const ranked = solver.suggest(words.length);
  assert.equal(ranked.length, words.length);
  for (let index = 1; index < ranked.length; index += 1) {
    assert.ok(ranked[index - 1].entropy >= ranked[index].entropy);
  }
  assert.throws(() => solver.suggest(0), /Invalid limit/);
});

test("the solver finds every answer in a small lexicon", () => {
  const words = ["cigar", "rebut", "sissy", "humph", "awake", "blush", "focal", "evade", "naval"];
  const solver = new EntropySolver(words);
  for (const answer of words) {
    assert.ok(play(solver, answer, words.length) <= words.length, answer);
  }
});

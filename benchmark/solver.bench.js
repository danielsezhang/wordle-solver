import { performance } from "node:perf_hooks";

import { ALL_CORRECT, feedback } from "../src/feedback.js";
import { EntropySolver } from "../src/solver.js";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz";
const GUESS_COUNT = 13_000;
const ANSWER_COUNT = 2_300;
const SIMULATED_GAMES = 200;

// Deterministic pseudo-words; a multiplicative step spreads letters across positions.
function syntheticWords(count) {
  const words = [];
  for (let value = 0; words.length < count; value += 7_919) {
    let word = "";
    let number = value;
    for (let index = 0; index < 5; index += 1) {
      word += ALPHABET[number % ALPHABET.length];
      number = Math.floor(number / ALPHABET.length);
    }
    words.push(word);
  }
  return words;
}

function guessesToSolve(solver, answer) {
  solver.reset();
  for (let turn = 1; ; turn += 1) {
    const { word } = solver.suggest(1)[0];
    const outcome = feedback(word, answer);
    if (outcome === ALL_CORRECT) return turn;
    solver.observe(word, outcome);
  }
}

const guesses = syntheticWords(GUESS_COUNT);
const answers = guesses.slice(0, ANSWER_COUNT);

let started = performance.now();
const solver = new EntropySolver(answers, guesses);
const matrixMs = performance.now() - started;

started = performance.now();
const best = solver.suggest(1)[0];
const rankMs = performance.now() - started;

started = performance.now();
let totalGuesses = 0;
let worstGuesses = 0;
for (const answer of answers.slice(0, SIMULATED_GAMES)) {
  const turns = guessesToSolve(solver, answer);
  totalGuesses += turns;
  worstGuesses = Math.max(worstGuesses, turns);
}
const simulateMs = performance.now() - started;

console.log(`lexicon: ${guesses.length} guesses x ${answers.length} answers`);
console.log(`matrix: ${matrixMs.toFixed(0)} ms; opening rank: ${rankMs.toFixed(0)} ms`);
console.log(`opening guess: ${best.word}`);
console.log(
  `games: ${SIMULATED_GAMES}; mean guesses: ${(totalGuesses / SIMULATED_GAMES).toFixed(3)}; ` +
    `worst: ${worstGuesses}; ${simulateMs.toFixed(0)} ms`,
);

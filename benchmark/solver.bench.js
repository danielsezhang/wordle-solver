import { performance } from "node:perf_hooks";

import { EntropySolver } from "../src/solver.js";

const alphabet = "abcdefghijklmnopqrstuvwxyz";
const words = [];
for (let value = 0; words.length < 2_000; value += 1) {
  let word = "";
  let number = value;
  for (let index = 0; index < 5; index += 1) {
    word += alphabet[number % alphabet.length];
    number = Math.floor(number / alphabet.length);
  }
  words.push(word);
}

const started = performance.now();
const solver = new EntropySolver(words);
const constructionMs = performance.now() - started;
const rankingStarted = performance.now();
const best = solver.suggest(1)[0];
const rankingMs = performance.now() - rankingStarted;
console.log(`matrix: ${constructionMs.toFixed(1)} ms; rank: ${rankingMs.toFixed(1)} ms; best: ${best.word}`);

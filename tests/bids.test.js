import { test } from "node:test";
import assert from "node:assert/strict";
import { bidOrderFor, bidStatus, forbiddenBid, checkBid } from "../src/lib/wizard.js";

test("Reihenfolge: Beginn rückt jede Runde eins weiter, Letzter = Geber", () => {
  assert.deepEqual(bidOrderFor(0, 4, 2), [2, 3, 0, 1]);
  assert.deepEqual(bidOrderFor(1, 4, 2), [3, 0, 1, 2]);
  assert.deepEqual(bidOrderFor(5, 3, 0), [2, 0, 1]);
});

test("Ansagen der Reihe nach: niemand überspringt", () => {
  const order = [1, 2, 0];
  assert.deepEqual(checkBid([null, null, null], order, 3, 0, 1), { reason: "order", blocker: 1 });
  assert.equal(checkBid([null, null, null], order, 3, 1, 1), null);
  assert.deepEqual(checkBid([null, 1, null], order, 3, 0, 0), { reason: "order", blocker: 2 });
  assert.equal(checkBid([null, 1, null], order, 3, 2, 0), null);
});

test("Summe darf nicht der Kartenzahl entsprechen (Runde 2: ≠ 2, Runde 3: ≠ 3 …)", () => {
  // Runde 3 (3 Karten), Reihenfolge 1, 2, 0: Spieler 1 sagt 1, Spieler 2 sagt 1 -> Spieler 0 darf nicht 1
  const order = [1, 2, 0];
  assert.equal(forbiddenBid([null, 1, 1], 0, 3), 1);
  assert.deepEqual(checkBid([null, 1, 1], order, 3, 0, 1), { reason: "sum", forbidden: 1 });
  assert.equal(checkBid([null, 1, 1], order, 3, 0, 0), null);
  assert.equal(checkBid([null, 1, 1], order, 3, 0, 2), null);
  // Runde 2: zusammen schon 3 -> nichts mehr verboten (2 − 3 < 0)
  assert.equal(forbiddenBid([null, 2, 1], 0, 2), null);
  // Korrektur einer früheren Ansage darf die Summe auch nicht auf die Kartenzahl bringen
  assert.deepEqual(checkBid([0, 2, 0], order, 3, 1, 3), { reason: "sum", forbidden: 3 });
  assert.equal(checkBid([0, 2, 0], order, 3, 1, 1), null);
});

test("Status: wer dran ist, Summe, Verstoß", () => {
  assert.deepEqual(bidStatus([null, null, null], [1, 2, 0], 3), { next: 1, first: 1, last: 0, count: 0, sum: 0, allIn: false, violation: false });
  assert.equal(bidStatus([1, 1, 0], [1, 2, 0], 2).violation, true);
  assert.equal(bidStatus([1, 1, 0], [1, 2, 0], 3).violation, false);
});

const assert = require("assert");
const { calculateForecast } = require("./forecast");

function nearlyEqual(a, b, eps = 0.01) {
  return Math.abs(a - b) < eps;
}

function testBasicForecast() {
  const res = calculateForecast(100, 1000, 10);
  // calculations: avgDaily = 100/10 = 10; daysRemaining=20 -> projectedAdditional=200 -> projectedTotal=300
  assert.strictEqual(res.currentSpend, 100);
  assert.strictEqual(res.budget, 1000);
  assert.ok(nearlyEqual(res.averageDailySpend, 10));
  assert.ok(nearlyEqual(res.projectedSpend, 300));
  assert.strictEqual(res.willOverspend, false);
  console.log("testBasicForecast passed");
}

function testZeroDaysIntoMonth() {
  const res = calculateForecast(0, 500, 0);
  // Now returns an object
  assert.strictEqual(res.currentSpend, 0);
  assert.strictEqual(res.projectedSpend, 500);
  assert.strictEqual(res.budget, 500);
  assert.strictEqual(res.daysIntoMonth, 0);
  assert.strictEqual(res.averageDailySpend, 0);
  assert.strictEqual(res.willOverspend, false);
  assert.strictEqual(res.overspendAmount, 0);
  assert.strictEqual(res.percentOfBudget, 0);
  console.log("testZeroDaysIntoMonth passed");
}

function testOverspend() {
  const res = calculateForecast(900, 1000, 15);
  // avg = 60, daysRemaining = 15 -> projectedAdditional = 900 -> projectedTotal = 1800
  assert.strictEqual(res.currentSpend, 900);
  assert.ok(nearlyEqual(res.projectedSpend, 1800));
  assert.strictEqual(res.willOverspend, true);
  assert.ok(nearlyEqual(res.overspendAmount, 800));
  console.log("testOverspend passed");
}

function runTests() {
  console.log("Running forecast utility tests...");
  testBasicForecast();
  testZeroDaysIntoMonth();
  testOverspend();
  console.log("All forecast tests passed.");
}

runTests();

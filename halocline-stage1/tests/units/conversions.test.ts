import test from "node:test";
import assert from "node:assert/strict";

import {
  cubicMetersPerDayToMgd,
  feetToMeters,
  metersPerDayToMillimetersPerYear,
  metersToFeet,
  mgdToCubicMetersPerDay,
  millimetersPerYearToMetersPerDay,
} from "../../src/lib/units/conversions.ts";

test("length conversions round-trip between meters and feet", () => {
  const meters = 12.5;
  assert.equal(feetToMeters(metersToFeet(meters)), meters);
});

test("flow conversions round-trip between MGD and cubic meters per day", () => {
  const mgd = 2.25;
  assert.ok(Math.abs(cubicMetersPerDayToMgd(mgdToCubicMetersPerDay(mgd)) - mgd) < 1e-12);
});

test("recharge conversions round-trip between millimeters per year and meters per day", () => {
  const millimetersPerYear = 1300;
  assert.equal(
    metersPerDayToMillimetersPerYear(millimetersPerYearToMetersPerDay(millimetersPerYear)),
    millimetersPerYear,
  );
});

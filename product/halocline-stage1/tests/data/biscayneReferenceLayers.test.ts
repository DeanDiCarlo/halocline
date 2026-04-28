import test from "node:test";
import assert from "node:assert/strict";

import {
  biscayneDataProvenance,
  biscayneReferenceBounds,
  biscayneReferenceLayers,
  type GeoJsonFeatureCollection,
} from "../../src/lib/data/biscayneReferenceLayers.ts";

function flattenCoordinates(coordinates: unknown): number[] {
  if (typeof coordinates === "number") return [coordinates];
  if (!Array.isArray(coordinates)) return [];
  return coordinates.flatMap((value) => flattenCoordinates(value));
}

function assertFiniteGeoJson(collection: GeoJsonFeatureCollection): void {
  assert.equal(collection.type, "FeatureCollection");
  assert.ok(collection.features.length > 0);

  for (const feature of collection.features) {
    assert.equal(feature.type, "Feature");
    assert.ok(feature.properties.id);
    const values = flattenCoordinates(feature.geometry.coordinates);
    assert.ok(values.length > 0);
    assert.ok(values.every((value) => Number.isFinite(value)));
  }
}

test("Biscayne reference bounds are finite and cover the expected South Florida range", () => {
  assert.ok(Number.isFinite(biscayneReferenceBounds.west));
  assert.ok(Number.isFinite(biscayneReferenceBounds.south));
  assert.ok(Number.isFinite(biscayneReferenceBounds.east));
  assert.ok(Number.isFinite(biscayneReferenceBounds.north));
  assert.ok(biscayneReferenceBounds.west < biscayneReferenceBounds.east);
  assert.ok(biscayneReferenceBounds.south < biscayneReferenceBounds.north);
  assert.ok(biscayneReferenceBounds.west > -81);
  assert.ok(biscayneReferenceBounds.east < -80);
  assert.ok(biscayneReferenceBounds.south > 25);
  assert.ok(biscayneReferenceBounds.north < 26.5);
});

test("Biscayne reference layers expose non-empty GeoJSON", () => {
  assertFiniteGeoJson(biscayneReferenceLayers.domain.data);
  assertFiniteGeoJson(biscayneReferenceLayers.canals.data);
  assertFiniteGeoJson(biscayneReferenceLayers.isochlor2018.data);
  assertFiniteGeoJson(biscayneReferenceLayers.isochlor2022.data);

  assert.equal(biscayneReferenceLayers.domain.kind, "domain");
  assert.equal(biscayneReferenceLayers.canals.kind, "canals");
  assert.equal(biscayneReferenceLayers.isochlor2018.kind, "isochlor");
  assert.equal(biscayneReferenceLayers.isochlor2022.kind, "isochlor");
});

test("Biscayne reference provenance covers every processed layer", () => {
  const provenanceById = new Map(biscayneDataProvenance.map((entry) => [entry.id, entry]));

  for (const layer of Object.values(biscayneReferenceLayers)) {
    const provenance = provenanceById.get(layer.id);
    assert.ok(provenance, `missing provenance for ${layer.id}`);
    assert.equal(provenance.sourceAgency.length > 0, true);
    assert.equal(provenance.sourceUrl.length > 0, true);
    assert.equal(provenance.accessedDate, "2026-04-24");
    assert.equal(provenance.transformation.length > 0, true);
    assert.equal(provenance.stage1Limitation.length > 0, true);
  }
});

test("Biscayne reference data serializes and parses cleanly", () => {
  const parsed = JSON.parse(
    JSON.stringify({
      bounds: biscayneReferenceBounds,
      layers: biscayneReferenceLayers,
      provenance: biscayneDataProvenance,
    }),
  );

  assert.equal(parsed.layers.canals.data.features.length, biscayneReferenceLayers.canals.data.features.length);
  assert.equal(
    parsed.layers.isochlor2022.data.features.length,
    biscayneReferenceLayers.isochlor2022.data.features.length,
  );
  assert.equal(parsed.provenance.length, biscayneDataProvenance.length);
});

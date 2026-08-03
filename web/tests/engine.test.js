import { describe, expect, it } from "vitest";
import { CUSTOMER_ARCHETYPES, getInitialDeveloperPool, getInitialProjectData } from "../src/engine.js";

describe("Web Engine Logic Tests", () => {
  it("should load CUSTOMER_ARCHETYPES correctly without hoisting errors", () => {
    expect(CUSTOMER_ARCHETYPES).toBeDefined();
    expect(CUSTOMER_ARCHETYPES.PARTNER).toBeDefined();
    expect(CUSTOMER_ARCHETYPES.PARTNER.name).toContain("こだわり伴走型");
  });

  it("should initialize Developer pool correctly", () => {
    const pool = getInitialDeveloperPool();
    expect(pool.length).toBeGreaterThan(0);
    expect(pool[0].name).toBe("ケン");
  });

  it("should initialize Project Data with archetype set", () => {
    const { project, tasks } = getInitialProjectData(1);
    expect(project).toBeDefined();
    expect(project.customerArchetype).toBeDefined();
    expect(tasks.length).toBe(10);
  });
});

import { describe, expect, it } from "vitest";
import { Customer, Developer, PM, Project, Task, Team } from "../src/entities.js";

describe("Web Entities Tests", () => {
  it("should initialize Developer correctly", () => {
    const dev = new Developer("dev_1", "テスト太郎", { age: 30, techSkill: 4 });
    expect(dev.name).toBe("テスト太郎");
    expect(dev.age).toBe(30);
    expect(dev.techSkill).toBe(4);
    expect(dev.assignedRole).toBe("DEV");
    expect(dev.isPlQualified).toBe(false);
  });

  it("should qualify Developer as PL if leadershipSkill >= 3", () => {
    const pl = new Developer("pl_1", "PL花子", { leadershipSkill: 4 });
    expect(pl.isPlQualified).toBe(true);
  });

  it("should initialize Project and Team correctly", () => {
    const customer = new Customer("c1", "テスト顧客", "QUALITY_ORIENTED");
    const project = new Project("決済システム改修", 12, customer);
    const team = new Team("t1", "開発チームA");
    const dev = new Developer("dev_1", "開発者A", { leadershipSkill: 4 });

    team.setLeader(dev);
    project.registerTeam(team);

    expect(project.name).toBe("決済システム改修");
    expect(project.deadlineWeeks).toBe(12);
    expect(project.mainTeam).toBe(team);
    expect(project.mainTeam.leader.name).toBe("開発者A");
    expect(dev.assignedRole).toBe("PL");
  });

  it("should reset PM AP correctly", () => {
    const pm = new PM(3);
    pm.ap = 0;
    pm.resetAp();
    expect(pm.ap).toBe(3);
  });
});

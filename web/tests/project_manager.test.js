import { describe, it, expect } from "vitest";
import { ProjectManager } from "../src/project_manager.js";

describe("ProjectManager", () => {
  it("初期値で正常にインスタンス化されること", () => {
    const pm = new ProjectManager({ name: "テストPM", ap: 3 });
    expect(pm.name).toBe("テストPM");
    expect(pm.ap).toBe(3);
    expect(pm.maxAp).toBe(3);
  });

  it("KICKOFFフェーズに応じたコマンド一覧が正しく取得できること", () => {
    const pm = new ProjectManager({ ap: 3 });
    const commands = pm.getAvailableCommands({ phase: "KICKOFF" });

    expect(commands.length).toBeGreaterThan(0);
    const scopeCmd = commands.find((c) => c.id === "SCOPE_NEGOTIATION");
    expect(scopeCmd).toBeDefined();
    expect(scopeCmd.enabled).toBe(true);
  });

  it("AP不足時にコマンドが disabled になること", () => {
    const pm = new ProjectManager({ ap: 0 });
    const commands = pm.getAvailableCommands({ phase: "KICKOFF", ap: 0 });

    const scopeCmd = commands.find((c) => c.id === "SCOPE_NEGOTIATION");
    expect(scopeCmd.enabled).toBe(false);
    expect(scopeCmd.disabledReason).toContain("APが不足");
  });

  it("SPRINTフェーズでチーム疲労度条件を満たさないと1on1コマンドが disabled になること", () => {
    const pm = new ProjectManager({ ap: 3 });
    // 疲労度 10 (要求条件は 30)
    const commands = pm.getAvailableCommands({ phase: "SPRINT", teamFatigue: 10 });

    const oneOnOneCmd = commands.find((c) => c.id === "ONE_ON_ONE");
    expect(oneOnOneCmd.enabled).toBe(false);
    expect(oneOnOneCmd.disabledReason).toContain("チーム疲労度");
  });

  it("SPRINTフェーズで疲労度が30以上になると1on1コマンドが enabled になること", () => {
    const pm = new ProjectManager({ ap: 3 });
    const commands = pm.getAvailableCommands({ phase: "SPRINT", teamFatigue: 40 });

    const oneOnOneCmd = commands.find((c) => c.id === "ONE_ON_ONE");
    expect(oneOnOneCmd.enabled).toBe(true);
  });

  it("consumeAp および restoreAp が正常に機能すること", () => {
    const pm = new ProjectManager({ ap: 3, maxAp: 3 });
    expect(pm.consumeAp(1)).toBe(true);
    expect(pm.ap).toBe(2);

    pm.restoreAp();
    expect(pm.ap).toBe(3);
  });
});

import { describe, it, expect } from "vitest";
import { ProjectManager } from "../src/project_manager.js";

describe("ProjectManager", () => {
  it("初期値で正常にインスタンス化されること", () => {
    const pm = new ProjectManager({ name: "テストPM", ap: 3 });
    expect(pm.name).toBe("テストPM");
    expect(pm.ap).toBe(3);
    expect(pm.maxAp).toBe(3);
  });

  it("キックオフ前（未実施）のコマンド一覧が正しく取得できること", () => {
    const pm = new ProjectManager({ ap: 3 });
    const commands = pm.getAvailableCommands({ kickoffHistory: [] });

    expect(commands.length).toBeGreaterThan(0);
    const wsCmd = commands.find((c) => c.id === "req_def_ws");
    expect(wsCmd).toBeDefined();
    expect(wsCmd.enabled).toBe(true);

    const kickoffCmd = commands.find((c) => c.id === "team_kickoff_rally");
    expect(kickoffCmd).toBeDefined();
    expect(kickoffCmd.enabled).toBe(true);

    const holidayCmd = commands.find((c) => c.id === "holiday_work_request");
    expect(holidayCmd).toBeUndefined(); // キックオフ前は休日出勤不可
  });

  it("キックオフ実施後のコマンド一覧が正しく切り替わること", () => {
    const pm = new ProjectManager({ ap: 3 });
    const commands = pm.getAvailableCommands({ kickoffHistory: ["team_kickoff_rally"] });

    const kickoffCmd = commands.find((c) => c.id === "team_kickoff_rally");
    expect(kickoffCmd).toBeUndefined(); // 実施後は決起集会非表示

    const holidayCmd = commands.find((c) => c.id === "holiday_work_request");
    expect(holidayCmd).toBeDefined();
    expect(holidayCmd.enabled).toBe(true);
  });

  it("AP不足時にコスト1以上のコマンドが disabled になること", () => {
    const pm = new ProjectManager({ ap: 0 });
    const commands = pm.getAvailableCommands({ ap: 0 });

    const wsCmd = commands.find((c) => c.id === "req_def_ws");
    expect(wsCmd.enabled).toBe(false);
    expect(wsCmd.disabledReason).toContain("APが不足");

    const freeCmd = commands.find((c) => c.id === "boss_risk_check");
    expect(freeCmd.enabled).toBe(true); // 無料コマンドは実行可能
  });

  it("consumeAp および restoreAp が正常に機能すること", () => {
    const pm = new ProjectManager({ ap: 3, maxAp: 3 });
    expect(pm.consumeAp(1)).toBe(true);
    expect(pm.ap).toBe(2);

    pm.restoreAp();
    expect(pm.ap).toBe(3);
  });
});


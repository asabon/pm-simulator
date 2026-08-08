import { describe, expect, it } from "vitest";
import { evaluateKickoffAction, evaluateKickoffReadiness, getPMOAdvice } from "../src/engine.js";

describe("PMO Advisor & Kickoff Prep Logic", () => {
  it("should generate initial advice for kickoff prep in Day 1-2 with agenda guidance", () => {
    const project = { day: 1 };
    const advice = getPMOAdvice(project, [], 1);
    expect(advice.type).toBe("GUIDE");
    expect(advice.badge).toContain("アジェンダセオリー");
    expect(advice.text).toContain("アジェンダ・質問内容");
  });

  it("should trigger combo hint when tech risk check is done without phased release", () => {
    const project = { day: 2 };
    const history = ["tech_risk_check"];
    const advice = getPMOAdvice(project, history, 2);
    expect(advice.type).toBe("COMBO_HINT");
    expect(advice.badge).toContain("順序コンボ発動可");
    expect(advice.text).toContain("段階リリース提案");
  });

  it("should trigger alert warning when kickoff is not done by Day 3", () => {
    const project = { day: 3 };
    const advice = getPMOAdvice(project, ["tech_risk_check"], 3);
    expect(advice.type).toBe("ALERT");
    expect(advice.badge).toContain("緊急警告");
    expect(advice.text).toContain("準備に時間をかけすぎています");
  });

  it("should penalize client meeting when CARD_AGENDA is missing (appointment without agenda)", () => {
    const project = { customerArchetype: { favors: [], dislikes: [] } };
    const res = evaluateKickoffAction([], "CLIENT_WS", project, { assessmentCards: [] });
    expect(res.customerSatisfactionBonus).toBeLessThan(0);
    expect(res.comment).toContain("アジェンダ（議題）がないと");
    expect(res.comment).toContain("誰を呼べばいいか分からない");
  });

  it("should reward client meeting when CARD_AGENDA is checked", () => {
    const project = { customerArchetype: { favors: [], dislikes: [] } };
    const res = evaluateKickoffAction([], "CLIENT_WS", project, { assessmentCards: ["CARD_AGENDA"] });
    expect(res.customerSatisfactionBonus).toBeGreaterThan(0);
    expect(res.synergyName).toContain("キーマン同席成功");
  });

  it("should evaluate kickoff readiness rank S for 3 or more prep actions", () => {
    const history = ["tech_risk_check", "retrospective_share", "one_on_one"];
    const res = evaluateKickoffReadiness(history);
    expect(res.rank).toBe("S");
    expect(res.teamHealthBonus).toBe(20);
    expect(res.title).toContain("Sランク");
  });

  it("should evaluate kickoff readiness rank C for 0 prep actions", () => {
    const history = [];
    const res = evaluateKickoffReadiness(history);
    expect(res.rank).toBe("C");
    expect(res.teamHealthBonus).toBe(-10);
    expect(res.title).toContain("Cランク");
  });
});

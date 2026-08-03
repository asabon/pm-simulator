import { beforeEach, describe, expect, it } from "vitest";

describe("Web App Integration & Syntax Tests", () => {
  beforeEach(() => {
    // DOM の初期化セットアップ
    document.body.innerHTML = `
      <header>
        <span id="pm-career-years">1</span>
        <span id="pm-completed-pjs">0</span>
        <span id="pm-ap">3</span>
        <div id="step-kickoff"></div>
        <div id="step-dashboard"></div>
        <div id="step-result"></div>
      </header>
      <main id="app-container"></main>
    `;
  });

  it("should dynamically import app.js without SyntaxError or Module errors", async () => {
    // スクリプト全体の構文解析・パース・評価テスト
    const appModule = await import("../src/app.js?test=" + Date.now());
    expect(appModule).toBeDefined();

    const container = document.getElementById("app-container");
    expect(container.innerHTML).toContain("フェーズ1: キックオフ");
  });

  it("should execute all interview actions (PL, CLIENT, BOSS) without ReferenceError or runtime crashes", async () => {
    // アプリのロード
    await import("../src/app.js?test=" + Date.now());

    // Step 1-1 ➔ Step 1-2 へ進む
    const btnToStep12 = document.getElementById("btn-to-step1-2");
    if (btnToStep12) btnToStep12.click();

    // セッティング画面で全ターゲットを予定に追加
    const addClient = document.getElementById("add-client");
    const addPl = document.getElementById("add-pl");
    const addBoss = document.getElementById("add-boss");

    if (addClient) addClient.click();
    if (addPl) addPl.click();
    if (addBoss) addBoss.click();

    const btnStart = document.getElementById("btn-start-meetings");
    if (btnStart) btnStart.click();

    // 面談画面（Step 2）へ遷移していることを確認
    const container = document.getElementById("app-container");
    expect(container.innerHTML).toContain("面談画面");

    // 全アクションボタンのクリック検証（全分岐で ReferenceError や例外が投げられないかチェック）
    const actionBtns = Array.from(document.querySelectorAll(".btn-action-item"));
    expect(actionBtns.length).toBeGreaterThan(0);

    actionBtns.forEach((btn) => {
      expect(() => {
        btn.click();
      }).not.toThrow();
    });
  });
});

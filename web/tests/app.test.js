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
});

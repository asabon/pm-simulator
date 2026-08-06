import { beforeEach, describe, expect, it } from "vitest";

describe("ADV Web App Integration & Scene Transition Tests", () => {
  beforeEach(() => {
    // DOM の初期化セットアップ (index.html と同構造)
    document.body.innerHTML = `
      <header id="global-header">
        <span id="pm-career-years">1</span>
        <span id="pm-completed-pjs">0</span>
        <span id="pm-ap">3</span>
        <span id="status-week-info">Week 1/4</span>
        <span id="status-cust-sat">70%</span>
        <span id="status-boss-trust">60%</span>
        <span id="status-team-safety">良好</span>
      </header>

      <main id="app-container" class="adv-app-container">
        <div id="scene-location-bar">
          <span id="location-icon">🎮</span>
          <span id="location-title">タイトル画面</span>
        </div>

        <div id="main-view">
          <div id="scene-bg" class="scene-bg bg-title">
            <div id="character-sprite">
              <div id="sprite-avatar">💼</div>
              <div id="sprite-name">PM Simulator</div>
            </div>
          </div>
        </div>

        <div id="message-box">
          <div id="speaker-name">ナレーション</div>
          <div id="dialog-text">PM Simulator へようこそ！</div>
          <div id="action-log-container"></div>
        </div>

        <div id="action-panel"></div>
      </main>

      <div id="event-modal-overlay" class="event-modal-overlay hidden">
        <div id="event-modal-title"></div>
        <div id="event-modal-speaker"></div>
        <div id="event-modal-speech"></div>
        <div id="event-modal-choices"></div>
      </div>
    `;
  });

  it("should initialize app and render Title Screen first with '🚀 新規プロジェクトを開始する' button", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const startBtn = document.getElementById("btn-start-new-project");
    expect(startBtn).not.toBeNull();
    expect(document.getElementById("location-title").textContent).toContain("タイトル画面");
  });

  it("should transit to PROLOGUE scene on '🚀 新規プロジェクトを開始する' click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const startBtn = document.getElementById("btn-start-new-project");
    startBtn.click();

    expect(document.getElementById("location-title").textContent).toContain("上司執務室");
    expect(document.getElementById("dialog-text").textContent).toContain("今期の大事な案件");

    const acceptBtn = document.getElementById("btn-accept-assignment");
    expect(acceptBtn).not.toBeNull();
  });

  it("should transit to DASHBOARD scene on '💼 了解しました！' click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-accept-assignment").click();

    expect(document.getElementById("location-title").textContent).toContain("PM自席");
    expect(document.getElementById("nav-customer")).not.toBeNull();
    expect(document.getElementById("nav-manager")).not.toBeNull();
    expect(document.getElementById("nav-team")).not.toBeNull();
    expect(document.getElementById("nav-next-week")).not.toBeNull();
  });

  it("should transit to SCENE_CUSTOMER on '💬 顧客と話す' button click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    // タイトル ➔ プロローグ ➔ ダッシュボード ➔ 顧客室
    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-customer").click();

    expect(document.getElementById("location-title").textContent).toContain("顧客のオフィス");
    expect(document.getElementById("btn-act-req_def_ws")).not.toBeNull();
  });

  it("should consume AP and add log on specific action execution", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-customer").click();

    // アクション実行
    document.getElementById("btn-act-req_def_ws").click();

    const apEl = document.getElementById("pm-ap");
    expect(apEl.textContent).toBe("2");

    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("要件定義WS");
  });

  it("should advance week and open weekly meeting event modal on '⏱️ 週を進める' click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-next-week").click();

    const modalOverlay = document.getElementById("event-modal-overlay");
    expect(modalOverlay.classList.contains("hidden")).toBe(false);
  });
});

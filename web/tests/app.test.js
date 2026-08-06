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
          <span id="location-icon">🖥️</span>
          <span id="location-title">PM自席</span>
        </div>

        <div id="main-view">
          <div id="scene-bg" class="scene-bg bg-dashboard">
            <div id="character-sprite">
              <div id="sprite-avatar">💻</div>
              <div id="sprite-name">PMのデスク</div>
            </div>
          </div>
        </div>

        <div id="message-box">
          <div id="speaker-name">ナレーション</div>
          <div id="dialog-text">今週の活動方針を決定してください。</div>
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

  it("should initialize app and render 4 primary category buttons in DASHBOARD mode", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const navCustomer = document.getElementById("nav-customer");
    const navManager = document.getElementById("nav-manager");
    const navTeam = document.getElementById("nav-team");
    const navNextWeek = document.getElementById("nav-next-week");

    expect(navCustomer).not.toBeNull();
    expect(navManager).not.toBeNull();
    expect(navTeam).not.toBeNull();
    expect(navNextWeek).not.toBeNull();
  });

  it("should transit to SCENE_CUSTOMER on '💬 顧客と話す' button click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const navCustomer = document.getElementById("nav-customer");
    navCustomer.click();

    // 顧客オフィスシーンへの遷移チェック
    const locationTitle = document.getElementById("location-title");
    expect(locationTitle.textContent).toContain("顧客のオフィス");

    // 具体アクションボタンの存在チェック
    const actReqWs = document.getElementById("btn-act-req_def_ws");
    const btnBack = document.getElementById("btn-back-dashboard");

    expect(actReqWs).not.toBeNull();
    expect(btnBack).not.toBeNull();
  });

  it("should consume AP and add log on specific action execution", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    // 顧客室シーンへ遷移
    document.getElementById("nav-customer").click();

    // アクション実行
    const actReqWs = document.getElementById("btn-act-req_def_ws");
    actReqWs.click();

    // AP消費 (3 ➔ 2) の確認
    const apEl = document.getElementById("pm-ap");
    expect(apEl.textContent).toBe("2");

    // ログ書き込みの確認
    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("要件定義WS");
  });

  it("should return to DASHBOARD on '↩ 自席に戻る' button click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    // シーン移動 ➔ 戻る
    document.getElementById("nav-customer").click();
    document.getElementById("btn-back-dashboard").click();

    const locationTitle = document.getElementById("location-title");
    expect(locationTitle.textContent).toContain("PM自席");
  });

  it("should advance week and open weekly meeting event modal on '⏱️ 週を進める' click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const navNextWeek = document.getElementById("nav-next-week");
    navNextWeek.click();

    // モーダルが開いていることの検証
    const modalOverlay = document.getElementById("event-modal-overlay");
    expect(modalOverlay.classList.contains("hidden")).toBe(false);

    const modalTitle = document.getElementById("event-modal-title");
    expect(modalTitle.textContent).toContain("定例ミーティング");
  });
});

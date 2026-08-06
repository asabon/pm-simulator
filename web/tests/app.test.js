import { beforeEach, describe, expect, it } from "vitest";

describe("ADV Web App Integration & Scene Transition Tests", () => {
  beforeEach(() => {
    // DOM の初期化セットアップ (index.html と同構造)
    document.body.innerHTML = `
      <header id="global-header">
        <span id="pm-career-years">1</span>
        <span id="pm-completed-pjs">0</span>
        <span id="pm-ap">3</span>
        <div id="project-status-bar" class="project-status-bar">
          <div class="status-bar-row status-bar-date-row">
            <span id="status-week-info">-</span>
          </div>
          <div class="status-bar-row status-bar-params-row">
            <span id="status-cust-sat">70%</span>
            <span id="status-boss-trust">60%</span>
            <span id="status-team-safety">良好</span>
          </div>
        </div>
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

  it("should initialize app and render Title Screen first with '🚀 新規プロジェクトを開始する' button and hide location bar, status bar, and log container", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const startBtn = document.getElementById("btn-start-new-project");
    expect(startBtn).not.toBeNull();

    // タイトル画面ではロケーションバー・ステータスバー・ログ枠が非表示になっていること
    const locationBar = document.getElementById("scene-location-bar");
    if (locationBar) {
      expect(locationBar.style.display).toBe("none");
    }
    const logContainer = document.getElementById("action-log-container");
    if (logContainer) {
      expect(logContainer.style.display).toBe("none");
    }
  });

  it("should transit to PROLOGUE_INTRO narrative scene on '🚀 新規プロジェクトを開始する' click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const startBtn = document.getElementById("btn-start-new-project");
    startBtn.click();

    expect(document.getElementById("dialog-text").textContent).toContain("呼び出された");

    const enterBtn = document.getElementById("btn-enter-room");
    expect(enterBtn).not.toBeNull();
  });

  it("should transit to PROLOGUE assignment speech on '🚪 執務室に入り、話を聞く' click", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();

    expect(document.getElementById("location-title").textContent).toContain("上司執務室");
    expect(document.getElementById("dialog-text").textContent).toContain("待っていたよ");

    const acceptBtn = document.getElementById("btn-accept-assignment");
    expect(acceptBtn).not.toBeNull();
  });

  it("should transit to DASHBOARD scene, automatically check mail, disclose status bar, and show main navigation buttons", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();

    expect(document.getElementById("location-title").textContent).toContain("PM自席");
    expect(document.getElementById("btn-check-pc-mail")).toBeNull();
    expect(document.getElementById("nav-customer")).not.toBeNull();
    expect(document.getElementById("nav-manager")).not.toBeNull();
    expect(document.getElementById("nav-team")).not.toBeNull();
    expect(document.getElementById("nav-next-day")).not.toBeNull();

    // デスク着席直後に自動的にステータスバーが表示され、メール本文がセットされること
    const statusBar = document.getElementById("project-status-bar");
    if (statusBar) {
      expect(statusBar.style.display).toBe("flex");
    }
    expect(document.getElementById("dialog-text").textContent).toContain("【件名】");
  });

  it("should execute team kickoff and holiday work request actions in TEAM scene", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-team").click();

    const kickoffBtn = document.getElementById("btn-act-team_kickoff");
    expect(kickoffBtn).not.toBeNull();
    kickoffBtn.click();

    const holidayBtn = document.getElementById("btn-act-holiday_work_request");
    expect(holidayBtn).not.toBeNull();
    holidayBtn.click();

    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("休日出勤依頼");
  });

  it("should schedule meeting on appointment action execution and show in log", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-customer").click();

    // アポ予約アクション実行 (要件定義WS)
    document.getElementById("btn-act-req_def_ws").click();

    const apEl = document.getElementById("pm-ap");
    expect(apEl.textContent).toBe("2");

    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("アポ予約");
  });

  it("should advance day on '⏱️ 1日を進める' click and trigger event on scheduled day", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-customer").click();

    // 翌日(Day 2)のアポ予約 (qcd_align)
    document.getElementById("btn-act-qcd_align").click();
    document.getElementById("btn-back-dashboard").click();

    // 1日進める (Day 1 ➔ Day 2へ)
    const navNextDay = document.getElementById("nav-next-day");
    navNextDay.click();

    // 予約当日に到達し、モーダルが開いていることの検証
    const modalOverlay = document.getElementById("event-modal-overlay");
    expect(modalOverlay.classList.contains("hidden")).toBe(false);

    const modalTitle = document.getElementById("event-modal-title");
    expect(modalTitle.textContent).toContain("予定会議");
  });
});

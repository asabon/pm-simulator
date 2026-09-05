import { beforeEach, describe, expect, it } from "vitest";

describe("ADV Web App Integration & Scene Transition Tests", () => {
  beforeEach(() => {
    // DOM の初期化セットアップ (index.html と同構造)
    document.body.innerHTML = `
      <header id="global-header">
        <span id="pm-ap">3</span>
        <div id="project-status-bar" class="project-status-bar">
          <div class="status-bar-row status-bar-date-row">
            <span id="status-week-info">-</span>
            <span id="status-next-schedule" class="status-next-schedule">📌 次の予定: なし</span>
          </div>
          <div class="status-bar-row status-bar-params-row">
            <span id="status-cust-sat">70%</span>
            <span id="status-boss-trust">60%</span>
            <span id="status-team-safety">良好</span>
          </div>
        </div>
      </header>

      <div id="schedule-modal-overlay" class="event-modal-overlay hidden">
        <div class="event-modal-card schedule-modal-card">
          <div class="event-modal-header">📅 予約中の会議・アポ一覧</div>
          <div id="schedule-list-container"></div>
          <button id="btn-close-schedule-modal">閉じる</button>
        </div>
      </div>

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

        <div id="pmo-advice-container">
          <div id="pmo-advice-badge"></div>
          <div id="pmo-advice-text"></div>
        </div>

        <div id="message-box">
          <div id="speaker-name">ナレーション</div>
          <div id="dialog-text">PM Simulator へようこそ！</div>
          <div id="action-log-container"></div>
        </div>

        <div id="action-panel"></div>
      </main>

      <section id="debug-info-panel" class="debug-info-panel">
        <span id="debug-version-tag">Version: 6be1e63</span>
        <span id="debug-screen-id">Screen ID: TITLE</span>
        <div id="debug-commands-list"></div>
        <div id="debug-status-details"></div>
      </section>

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

  it("should transit to DASHBOARD scene, automatically check mail, disclose status bar, and show PM decision commands", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();

    expect(document.getElementById("location-title").textContent).toContain("自席");
    expect(document.getElementById("btn-check-pc-mail")).toBeNull();

    // DASHBOARD画面に直接PMの意思決定コマンドがレンダリングされていることの検証
    expect(document.getElementById("btn-act-req_def_ws")).not.toBeNull();
    expect(document.getElementById("btn-act-team_kickoff_rally")).not.toBeNull();
    expect(document.getElementById("btn-act-advance_day")).not.toBeNull();

    // デスク着席直後に自動的にステータスバーが表示され、メール本文がセットされること
    const statusBar = document.getElementById("project-status-bar");
    if (statusBar) {
      expect(statusBar.style.display).toBe("flex");
    }
    expect(document.getElementById("dialog-text").textContent).toContain("【件名】");
  });

  it("should execute team kickoff and switch dialog messages and speaker names correctly before and after kickoff", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();

    // 【1. キックオフ前】の確認 (DASHBOARDから直接実行可能)
    const kickoffBtn = document.getElementById("btn-act-team_kickoff_rally");
    expect(kickoffBtn).not.toBeNull();
    kickoffBtn.click();

    // 【2. キックオフ実行直後】の即時会話応答確認
    expect(document.getElementById("speaker-name").textContent).toBe("開発リーダー (PL)");
    expect(document.getElementById("dialog-text").textContent).toContain("キックオフ決起の宣言ありがとうございます");

    // 休日出勤依頼の実行 (キックオフ後に解禁される)
    const holidayBtn = document.getElementById("btn-act-holiday_work_request");
    expect(holidayBtn).not.toBeNull();
    holidayBtn.click();
    expect(document.getElementById("dialog-text").textContent).toContain("休日出勤の件、承知しました");

    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("休日出勤依頼");
  });

  it("should schedule meeting on appointment action execution and show in log", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();

    // アポ予約アクション実行 (要件定義WS)
    document.getElementById("btn-act-req_def_ws").click();

    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("アポ予約");

    // 直近予定バッジにアポ内容が表示されることの検証
    const nextScheduleBadge = document.getElementById("status-next-schedule");
    expect(nextScheduleBadge.textContent).toContain("📌 次:");

    // バッジクリックで全予約一覧モーダルが開くことの検証
    nextScheduleBadge.click();
    const scheduleModal = document.getElementById("schedule-modal-overlay");
    expect(scheduleModal.classList.contains("hidden")).toBe(false);

    const listContainer = document.getElementById("schedule-list-container");
    expect(listContainer.innerHTML).toContain("要件定義");

    // 閉じるボタンでモーダルが閉じることの検証
    document.getElementById("btn-close-schedule-modal").click();
    expect(scheduleModal.classList.contains("hidden")).toBe(true);
  });

  it("should advance day on '⏱️ 1日を進める' click and trigger event on scheduled day", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();

    // 翌日(Day 2)のアポ予約 (qcd_align)
    document.getElementById("btn-act-qcd_align").click();

    // 1日進める (Day 1 ➔ Day 2へ)
    const advanceDayBtn = document.getElementById("btn-act-advance_day");
    advanceDayBtn.click();

    // 予約当日に到達し、モーダルが開いていることの検証
    const modalOverlay = document.getElementById("event-modal-overlay");
    expect(modalOverlay.classList.contains("hidden")).toBe(false);

    const modalTitle = document.getElementById("event-modal-title");
    expect(modalTitle.textContent).toContain("予定会議");
  });

  it("should render debug info panel with version, screen ID, available commands, and project status matching UI", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    const versionTag = document.getElementById("debug-version-tag");
    const screenId = document.getElementById("debug-screen-id");
    const commandsList = document.getElementById("debug-commands-list");
    const statusDetails = document.getElementById("debug-status-details");

    expect(versionTag.textContent).toContain("Version:");
    expect(screenId.textContent).toBe("Screen ID: TITLE");
    expect(commandsList.textContent).toContain("要件定義WS予約");
    expect(statusDetails.textContent).toContain("[プロジェクト概要]");

    // シーン遷移で Screen ID が更新されることの検証
    document.getElementById("btn-start-new-project").click();
    expect(screenId.textContent).toBe("Screen ID: PROLOGUE_INTRO");

    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();

    // DASHBOARD画面で、意思決定ボタンとインスペクターの一致を確認
    const actionPanel = document.getElementById("action-panel");
    const actionButtons = actionPanel.querySelectorAll("button");
    expect(actionButtons.length).toBeGreaterThan(5);

    // インスペクター内にも同じコマンドが記載されていることの検証
    expect(commandsList.textContent).toContain("要件定義WS予約");
    expect(commandsList.textContent).toContain("チームキックオフ決起");
  });
});

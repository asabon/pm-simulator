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

  it("should execute team kickoff and switch dialog messages and speaker names correctly before and after kickoff", async () => {
    const appModule = await import("../src/app.js?test=" + Date.now());
    appModule.initGame();

    document.getElementById("btn-start-new-project").click();
    document.getElementById("btn-enter-room").click();
    document.getElementById("btn-accept-assignment").click();
    document.getElementById("nav-team").click();

    // 【1. キックオフ前】の確認
    expect(document.getElementById("sprite-name").textContent).toBe("開発チーム (体制構築中)");
    expect(document.getElementById("speaker-name").textContent).toBe("開発メンバー候補");
    expect(document.getElementById("dialog-text").textContent).toContain("開発チームフロアへようこそ");

    // キックオフ実行
    const kickoffBtn = document.getElementById("btn-act-team_kickoff_rally") || document.getElementById("btn-act-team_kickoff");
    expect(kickoffBtn).not.toBeNull();
    kickoffBtn.click();

    // 【2. キックオフ実行直後】の即時会話応答確認
    expect(document.getElementById("sprite-name").textContent).toBe("開発リーダー(PL) & チーム");
    expect(document.getElementById("speaker-name").textContent).toBe("開発リーダー (PL)");
    expect(document.getElementById("dialog-text").textContent).toContain("キックオフ決起の宣言ありがとうございます");

    // 休日出勤依頼の実行
    const holidayBtn = document.getElementById("btn-act-holiday_work_request");
    expect(holidayBtn).not.toBeNull();
    holidayBtn.click();
    expect(document.getElementById("dialog-text").textContent).toContain("休日出勤の件、承知しました");

    const logContainer = document.getElementById("action-log-container");
    expect(logContainer.innerHTML).toContain("休日出勤依頼");

    // 【3. 自席に戻り、再度フロア訪問時】の通常セリフ確認
    document.getElementById("btn-back-dashboard").click();
    document.getElementById("nav-team").click();

    expect(document.getElementById("sprite-name").textContent).toBe("開発リーダー(PL) & チーム");
    expect(document.getElementById("speaker-name").textContent).toBe("開発リーダー (PL)");
    expect(document.getElementById("dialog-text").textContent).toContain("現場の技術リスク精査や1on1なら今日すぐに動けますよ");
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

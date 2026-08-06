// Web ADV Edition App Controller (app.js)

import {
  ADV_ACTIONS,
  PM,
  UIMode
} from "./entities.js";
import {
  calculateFinalScore,
  checkRandomEventTrigger,
  generateScheduledMeetingEvent,
  generateWeeklyMeetingEvent,
  getInitialDeveloperPool,
  getInitialProjectData,
  runDailyProgress
} from "./engine.js";

// =========================================================================
// 状態変数 (State Management)
// =========================================================================
export let currentUIMode = UIMode.TITLE;
export let projectState = null;
export let developerPool = [];
export let pmState = new PM(3);
export let kickoffHistory = [];
export let logs = [];
export let activeModalEvent = null;

// =========================================================================
// 初期化 (Initialization)
// =========================================================================
export function initGame() {
  currentUIMode = UIMode.TITLE;
  pmState.resetAp();
  kickoffHistory = [];
  logs = ["ゲームを開始しました。新規プロジェクトをスタートしてください。"];

  // プロジェクト・メンバー初期データ生成
  developerPool = getInitialDeveloperPool();
  const { project } = getInitialProjectData(pmState.completedProjects + 1);
  projectState = project;
  projectState.day = 1;
  projectState.maxDays = 20;
  projectState.scheduledMeetings = [];

  // チーム結成 (仮のメインチーム)
  const team = {
    name: "開発メインチーム",
    leader: developerPool[0],
    members: developerPool.slice(1, 4),
    allMembers: developerPool.slice(0, 4)
  };
  projectState.registerTeam(team);

  renderAll();
}

// 全体レンダリング関数
export function renderAll() {
  renderHeaderStatus();
  renderSceneView();
  renderMessageBox();
  renderActionPanel();
}

// 1. ヘッダー / ステータスバーの更新
export function renderHeaderStatus() {
  const yearsEl = document.getElementById("pm-career-years");
  const completedEl = document.getElementById("pm-completed-pjs");
  const apEl = document.getElementById("pm-ap");
  const statusBarEl = document.getElementById("project-status-bar");
  const weekInfoEl = document.getElementById("status-week-info");
  const custSatEl = document.getElementById("status-cust-sat");
  const bossTrustEl = document.getElementById("status-boss-trust");
  const teamSafetyEl = document.getElementById("status-team-safety");

  if (yearsEl) yearsEl.textContent = pmState.careerYears;
  if (completedEl) completedEl.textContent = pmState.completedProjects;
  if (apEl) apEl.textContent = pmState.ap;

  // タイトル画面およびプロローグ画面ではプロジェクト未開始のためステータスバーを非表示/ハイフンに設定
  if (currentUIMode === UIMode.TITLE || currentUIMode === UIMode.PROLOGUE) {
    if (statusBarEl) statusBarEl.style.display = "none";
    if (weekInfoEl) weekInfoEl.textContent = "-";
    if (custSatEl) custSatEl.textContent = "-";
    if (bossTrustEl) bossTrustEl.textContent = "-";
    if (teamSafetyEl) teamSafetyEl.textContent = "-";
    return;
  }

  // メインダッシュボード移行後は表示
  if (statusBarEl) statusBarEl.style.display = "flex";

  if (projectState) {
    if (weekInfoEl) weekInfoEl.textContent = `Day ${projectState.day}/${projectState.maxDays || 20} (Week ${projectState.week})`;
    if (custSatEl) custSatEl.textContent = `${projectState.customer.satisfaction.toFixed(0)}%`;
    if (bossTrustEl) bossTrustEl.textContent = `${(projectState.managerSatisfaction || 60).toFixed(0)}%`;
    if (teamSafetyEl) {
      const devs = projectState.getAllDevelopers();
      const avgFatigue = devs.length > 0 ? devs.reduce((sum, d) => sum + d.fatigue, 0) / devs.length : 0;
      teamSafetyEl.textContent = avgFatigue >= 70 ? "危険 (高疲労)" : (avgFatigue >= 40 ? "注意" : "良好");
    }
  }
}

// 2. シーン・背景・キャラクターの更新
export function renderSceneView() {
  const locationBarEl = document.getElementById("scene-location-bar");
  const iconEl = document.getElementById("location-icon");
  const titleEl = document.getElementById("location-title");
  const sceneBgEl = document.getElementById("scene-bg");
  const avatarEl = document.getElementById("sprite-avatar");
  const nameEl = document.getElementById("sprite-name");

  if (!sceneBgEl) return;

  // 背景クラスのリセット
  sceneBgEl.className = "scene-bg";

  // タイトル画面ではロケーションバーを非表示にする
  if (locationBarEl) {
    locationBarEl.style.display = currentUIMode === UIMode.TITLE ? "none" : "flex";
  }

  switch (currentUIMode) {
    case UIMode.TITLE:
      sceneBgEl.classList.add("bg-title");
      if (avatarEl) avatarEl.textContent = "💼";
      if (nameEl) nameEl.textContent = "PM Simulator";
      break;

    case UIMode.PROLOGUE_INTRO:
      if (iconEl) iconEl.textContent = "🏢";
      if (titleEl) titleEl.textContent = "上司執務室前 (呼び出し)";
      sceneBgEl.classList.add("bg-manager");
      if (avatarEl) avatarEl.textContent = "🚪";
      if (nameEl) nameEl.textContent = "執務室のドア";
      break;

    case UIMode.PROLOGUE:
      if (iconEl) iconEl.textContent = "🏢";
      if (titleEl) titleEl.textContent = "上司執務室 (アサイン面談)";
      sceneBgEl.classList.add("bg-manager");
      if (avatarEl) avatarEl.textContent = "👔";
      if (nameEl) nameEl.textContent = "高橋事業部長";
      break;

    case UIMode.DASHBOARD:
      if (iconEl) iconEl.textContent = "🖥️";
      if (titleEl) titleEl.textContent = `PM自席 [Day ${projectState ? projectState.day : 1}]`;
      sceneBgEl.classList.add("bg-dashboard");
      if (avatarEl) avatarEl.textContent = "💻";
      if (nameEl) nameEl.textContent = "PMのデスク";
      break;

    case UIMode.SCENE_CUSTOMER:
      if (iconEl) iconEl.textContent = "🤝";
      if (titleEl) titleEl.textContent = "顧客のオフィス / 会議室";
      sceneBgEl.classList.add("bg-customer");
      if (avatarEl) avatarEl.textContent = "👤";
      if (nameEl) nameEl.textContent = `渡辺部長 (${projectState.customer.type || "クライアント"})`;
      break;

    case UIMode.SCENE_MANAGER:
      if (iconEl) iconEl.textContent = "🏢";
      if (titleEl) titleEl.textContent = "上司の執務室";
      sceneBgEl.classList.add("bg-manager");
      if (avatarEl) avatarEl.textContent = "👔";
      if (nameEl) nameEl.textContent = "高橋事業部長";
      break;

    case UIMode.SCENE_TEAM:
      if (iconEl) iconEl.textContent = "🛠️";
      if (titleEl) titleEl.textContent = "開発チームフロア";
      sceneBgEl.classList.add("bg-team");
      if (avatarEl) avatarEl.textContent = "👨‍💻";
      if (nameEl) nameEl.textContent = "PL タツヤ & チーム";
      break;
  }
}

// 3. メッセージ / セリフダイアログの更新
export function renderMessageBox() {
  const speakerEl = document.getElementById("speaker-name");
  const dialogEl = document.getElementById("dialog-text");
  const logContainerEl = document.getElementById("action-log-container");

  if (!dialogEl) return;

  let speaker = "ナレーション";
  let text = "";

  switch (currentUIMode) {
    case UIMode.TITLE:
      speaker = "ナレーション";
      text = "PM Simulator へようこそ！ プロジェクトマネージャーとして意思決定とステークホルダーマネジメントの試練に挑みましょう。";
      break;
    case UIMode.PROLOGUE_INTRO:
      speaker = "ナレーション";
      text = "「あなたは高橋事業部長から執務室へ呼び出された。今期のプロジェクトについての重要な話があるようだ…」";
      break;
    case UIMode.PROLOGUE:
      speaker = "上司 (高橋事業部長)";
      text = "「おお、PMくん！ ちょうど君を呼ぼうと思っていたところだ。今期の大事な案件『第1期 基幹決済システム改修』のプロジェクトマネージャーとして、君をアサインする！ 予算は80%、納期は4週間だ。まずは君のデスクで方針を決め、顧客や現場とすり合わせをしてくれ。頼んだぞ！」";
      break;
    case UIMode.DASHBOARD:
      speaker = "PMの思考";
      text = pmState.ap > 0 
        ? `「本日(Day ${projectState.day})のAP残量は ${pmState.ap} だ。どこへ移動して誰と話すか、あるいはアポを入れるか決めよう。」`
        : "「本日のAPを使い切りました。⏱️ 1日を進める ボタンで次の日へ進行させてください。」";
      break;
    case UIMode.SCENE_CUSTOMER:
      speaker = "顧客 (渡辺部長)";
      text = "「やあPMさん！ 今日の用件は？ 重要な会議ならアポを取ってカレンダーにセットしてくれよ。」";
      break;
    case UIMode.SCENE_MANAGER:
      speaker = "上司 (高橋事業部長)";
      text = "「おお、PMくんか。直訴や重大相談なら日程を調整して面談を入れよう。」";
      break;
    case UIMode.SCENE_TEAM:
      speaker = "PL タツヤ";
      text = "「PMさん！ 現場の技術リスク精査や1on1なら今日すぐに動けますよ！」";
      break;
  }

  if (speakerEl) speakerEl.textContent = speaker;
  dialogEl.textContent = text;

  // ログおよびカレンダー予定表示
  if (logContainerEl) {
    let scheduleInfo = "";
    if (projectState && projectState.scheduledMeetings.length > 0) {
      scheduleInfo = `<div style="color:#fbbf24; font-weight:bold; margin-bottom:0.4rem;">📅 予約カレンダー: ${projectState.scheduledMeetings.map(m => `[Day ${m.day}: ${m.title}]`).join(", ")}</div>`;
    }
    logContainerEl.innerHTML = scheduleInfo + logs.map(l => `<div class="log-item">${l}</div>`).join("");
    logContainerEl.scrollTop = logContainerEl.scrollHeight;
  }
}

// 4. アクションパネル (第一階層 ↔ シーン別具体アクション) の描画
export function renderActionPanel() {
  const panelEl = document.getElementById("action-panel");
  if (!panelEl) return;

  panelEl.innerHTML = "";

  if (currentUIMode === UIMode.TITLE) {
    // 【タイトル画面】新規スタートボタン
    const startBtn = document.createElement("button");
    startBtn.id = "btn-start-new-project";
    startBtn.className = "btn-adv btn-primary-category";
    startBtn.style.gridColumn = "span 2";
    startBtn.style.padding = "1.2rem";
    startBtn.style.alignItems = "center";
    startBtn.innerHTML = "<span>🚀 新規プロジェクトを開始する</span><span class='btn-sub-desc'>アサイン面談へ向かう</span>";
    startBtn.addEventListener("click", () => {
      currentUIMode = UIMode.PROLOGUE_INTRO;
      renderAll();
    });
    panelEl.appendChild(startBtn);

  } else if (currentUIMode === UIMode.PROLOGUE_INTRO) {
    // 【プロローグ導入画面】室に入るボタン
    const enterBtn = document.createElement("button");
    enterBtn.id = "btn-enter-room";
    enterBtn.className = "btn-adv btn-primary-category";
    enterBtn.style.gridColumn = "span 2";
    enterBtn.style.padding = "1.2rem";
    enterBtn.style.alignItems = "center";
    enterBtn.innerHTML = "<span>🚪 執務室に入り、話を聞く</span><span class='btn-sub-desc'>事業部長のデスクへ進む</span>";
    enterBtn.addEventListener("click", () => {
      currentUIMode = UIMode.PROLOGUE;
      renderAll();
    });
    panelEl.appendChild(enterBtn);

  } else if (currentUIMode === UIMode.PROLOGUE) {
    // 【プロローグ画面】アサイン了解ボタン
    const acceptBtn = document.createElement("button");
    acceptBtn.id = "btn-accept-assignment";
    acceptBtn.className = "btn-adv btn-primary-category";
    acceptBtn.style.gridColumn = "span 2";
    acceptBtn.style.padding = "1.2rem";
    acceptBtn.style.alignItems = "center";
    acceptBtn.innerHTML = "<span>💼 了解しました！ PMのデスクへ向かう</span><span class='btn-sub-desc'>本日の活動方針を決定する</span>";
    acceptBtn.addEventListener("click", () => {
      currentUIMode = UIMode.DASHBOARD;
      logs.push("上司から案件がアサインされました！ 本日のアクションを決定してください。");
      renderAll();
    });
    panelEl.appendChild(acceptBtn);

  } else if (currentUIMode === UIMode.DASHBOARD) {
    // 【第一階層コマンド】メイン画面での4大ボタン
    const navButtons = [
      {
        id: "nav-customer",
        label: "💬 顧客と話す",
        desc: "要件・デモ・アポ予約（WS/交渉）",
        mode: UIMode.SCENE_CUSTOMER
      },
      {
        id: "nav-manager",
        label: "🏢 上司に相談",
        desc: "状況確認・面談アポ予約（直訴/助っ人）",
        mode: UIMode.SCENE_MANAGER
      },
      {
        id: "nav-team",
        label: "🛠️ 現場と調整",
        desc: "【即時】技術リスク精査・教訓共有・1on1",
        mode: UIMode.SCENE_TEAM
      },
      {
        id: "nav-next-day",
        label: "⏱️ 1日を進める",
        desc: "本日を終了し次の日へ。予約会議・イベント判定",
        isSpecial: true
      }
    ];

    navButtons.forEach(b => {
      const btn = document.createElement("button");
      btn.id = b.id;
      btn.className = "btn-adv btn-primary-category";
      btn.innerHTML = `<span>${b.label}</span><span class="btn-sub-desc">${b.desc}</span>`;
      
      if (b.isSpecial) {
        btn.addEventListener("click", handleAdvanceDay);
      } else {
        btn.addEventListener("click", () => {
          currentUIMode = b.mode;
          renderAll();
        });
      }
      panelEl.appendChild(btn);
    });

  } else {
    // 【具体アクション】シーン遷移後のボタン群
    let actionsList = [];
    if (currentUIMode === UIMode.SCENE_CUSTOMER) actionsList = ADV_ACTIONS.CUSTOMER;
    if (currentUIMode === UIMode.SCENE_MANAGER) actionsList = ADV_ACTIONS.MANAGER;
    if (currentUIMode === UIMode.SCENE_TEAM) actionsList = ADV_ACTIONS.TEAM;

    actionsList.forEach(act => {
      const btn = document.createElement("button");
      btn.id = `btn-act-${act.id}`;
      btn.className = "btn-adv";
      const isDisabled = pmState.ap < act.costAp;
      btn.disabled = isDisabled;
      
      btn.innerHTML = `
        <span>${act.name} ${act.costAp > 0 ? `(AP ${act.costAp})` : "(AP 0/無料)"}</span>
        <span class="btn-sub-desc">${act.desc}</span>
      `;
      btn.addEventListener("click", () => handleExecuteAction(act));
      panelEl.appendChild(btn);
    });

    // ↩ 自席に戻るボタン
    const backBtn = document.createElement("button");
    backBtn.id = "btn-back-dashboard";
    backBtn.className = "btn-adv btn-back";
    backBtn.innerHTML = "<span>↩ 自席に戻る</span>";
    backBtn.addEventListener("click", () => {
      currentUIMode = UIMode.DASHBOARD;
      renderAll();
    });
    panelEl.appendChild(backBtn);
  }
}

// =========================================================================
// アクション実行ハンドラ (即時 vs アポ予約)
// =========================================================================
export function handleExecuteAction(action) {
  if (pmState.ap < action.costAp) return;

  pmState.ap -= action.costAp;
  kickoffHistory.push(action.id);

  if (action.isAppointment) {
    // 📅 アポ予約アクション処理
    const scheduledDay = projectState.day + action.delayDays;
    projectState.scheduledMeetings.push({
      day: scheduledDay,
      actionId: action.id,
      title: action.name
    });
    logs.push(`📅 【アポ予約完了】 『${action.name}』 を ${scheduledDay} 日目 (Day ${scheduledDay}) の予定表にセットしました！`);
  } else {
    // ⚡ 即時アクション処理
    let effectLog = `▶ 『${action.name}』 を現場で即時実行しました。`;

    if (action.id === "prototype_demo") {
      projectState.customer.satisfaction = Math.min(100, projectState.customer.satisfaction + 5);
      effectLog += " (モック提示で認識統一！ 満足度+5%)";
    } else if (action.id === "boss_risk_check") {
      effectLog += ` (上司の期待ライン確認: 上司信頼度 ${projectState.managerSatisfaction.toFixed(0)}%)`;
    } else if (action.id === "tech_risk_check") {
      effectLog += " (技術リスク・見積精査完了！ 今後の交渉の『明確な根拠』を獲得)";
    } else if (action.id === "retrospective_share") {
      effectLog += " (過去教訓を共有！ 事故率低減)";
    } else if (action.id === "one_on_one") {
      effectLog += " (チーム1on1実施！ 隠れた不安を看破)";
    }
    logs.push(effectLog);
  }

  renderAll();
}

// =========================================================================
// ⏱️ 日進行 ＆ イベント・アポ会議判定ハンドラ
// =========================================================================
export function handleAdvanceDay() {
  const dailyLogs = runDailyProgress(projectState, [], pmState);
  logs.push(`--- Day ${projectState.day} 開始 (Week ${projectState.week}) ---`);
  logs.push(...dailyLogs);

  // 日数上限オーバー判定
  if (projectState.day > projectState.maxDays) {
    showResultScreen();
    return;
  }

  // 1. 【アポ予約会議】の判定 (本日予約されている会議があれば自動起動)
  const scheduledIndex = projectState.scheduledMeetings.findIndex(m => m.day === projectState.day);
  if (scheduledIndex !== -1) {
    const meetingData = projectState.scheduledMeetings.splice(scheduledIndex, 1)[0];
    const meetingEvent = generateScheduledMeetingEvent(projectState, meetingData, kickoffHistory);
    if (meetingEvent) {
      triggerEventModal(meetingEvent);
    }
  }

  // 2. 【定期イベント（週末定例会議）】 (Day 5, 10, 15, 20 の朝に起動)
  if (!activeModalEvent && projectState.day % 5 === 0) {
    const meetingEvent = generateWeeklyMeetingEvent(projectState, projectState.week);
    if (meetingEvent) {
      triggerEventModal(meetingEvent);
    }
  }

  // 3. 突発トラブルの判定（モーダル未発生時のみ）
  if (!activeModalEvent) {
    const randomEvent = checkRandomEventTrigger(projectState);
    if (randomEvent) {
      triggerEventModal(randomEvent);
    }
  }

  renderAll();
}

// レガシー互換用のエイリアス
export const handleAdvanceWeek = handleAdvanceDay;

// イベントモーダルの起動
export function triggerEventModal(eventData) {
  activeModalEvent = eventData;
  const overlayEl = document.getElementById("event-modal-overlay");
  const titleEl = document.getElementById("event-modal-title");
  const speakerEl = document.getElementById("event-modal-speaker");
  const speechEl = document.getElementById("event-modal-speech");
  const choicesEl = document.getElementById("event-modal-choices");

  if (!overlayEl) return;

  if (titleEl) titleEl.textContent = eventData.title;
  if (speakerEl) speakerEl.textContent = eventData.speaker;
  if (speechEl) speechEl.textContent = eventData.speech;

  if (choicesEl) {
    choicesEl.innerHTML = "";
    eventData.choices.forEach(c => {
      const btn = document.createElement("button");
      btn.className = "btn-event-choice";
      btn.textContent = c.text;
      btn.addEventListener("click", () => {
        if (c.effect) c.effect(projectState);
        if (c.log) logs.push(`[イベント対応] ${c.log}`);
        closeEventModal();
      });
      choicesEl.appendChild(btn);
    });
  }

  overlayEl.classList.remove("hidden");
}

export function closeEventModal() {
  activeModalEvent = null;
  const overlayEl = document.getElementById("event-modal-overlay");
  if (overlayEl) overlayEl.classList.add("hidden");
  renderAll();
}

// リザルト画面
export function showResultScreen() {
  const finalRes = calculateFinalScore(projectState, pmState);
  logs.push(`=== 🏆 プロジェクト終了! 最終評価: ランク ${finalRes.rank} (総合スコア ${finalRes.totalScore}) ===`);
  logs.push(`  ・顧客満足度: ${finalRes.customerScore}% | 上司信頼度: ${finalRes.managerScore}% | チーム健全性: ${finalRes.teamScore}%`);
  
  currentUIMode = UIMode.DASHBOARD;
  renderAll();
}

// DOMロード時のオートイニシャライズ
if (typeof window !== "undefined" && typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    initGame();
  });
}

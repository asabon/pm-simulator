// Web ADV Edition App Controller (app.js)

import {
  ADV_ACTIONS,
  PM,
  UIMode
} from "./entities.js";
import {
  calculateFinalScore,
  checkRandomEventTrigger,
  generateWeeklyMeetingEvent,
  getInitialDeveloperPool,
  getInitialProjectData,
  runWeeklySprint
} from "./engine.js";

// =========================================================================
// 状態変数 (State Management)
// =========================================================================
export let currentUIMode = UIMode.DASHBOARD;
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
    if (weekInfoEl) weekInfoEl.textContent = `Week ${projectState.week}/${projectState.deadlineWeeks + projectState.week - 1}`;
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
  const iconEl = document.getElementById("location-icon");
  const titleEl = document.getElementById("location-title");
  const sceneBgEl = document.getElementById("scene-bg");
  const avatarEl = document.getElementById("sprite-avatar");
  const nameEl = document.getElementById("sprite-name");

  if (!sceneBgEl) return;

  // 背景クラスのリセット
  sceneBgEl.className = "scene-bg";

  switch (currentUIMode) {
    case UIMode.TITLE:
      if (iconEl) iconEl.textContent = "🎮";
      if (titleEl) titleEl.textContent = "タイトル画面";
      sceneBgEl.classList.add("bg-title");
      if (avatarEl) avatarEl.textContent = "💼";
      if (nameEl) nameEl.textContent = "PM Simulator";
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
      if (titleEl) titleEl.textContent = "PM自席 (ダッシュボード)";
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
    case UIMode.PROLOGUE:
      speaker = "上司 (高橋事業部長)";
      text = "「おお、PMくん！ ちょうど君を呼ぼうと思っていたところだ。今期の大事な案件『第1期 基幹決済システム改修』のプロジェクトマネージャーとして、君をアサインする！ 予算は80%、納期は4週間だ。まずは君のデスクで方針を決め、顧客や現場とすり合わせをしてくれ。頼んだぞ！」";
      break;
    case UIMode.DASHBOARD:
      speaker = "PMの思考";
      text = pmState.ap > 0 
        ? `「今週のAP残量は ${pmState.ap} だ。どこへ移動して誰と話すか決めよう。」`
        : "「今週のAPを使い切りました。⏱️ 週を進める ボタンで開発ターンを進行させてください。」";
      break;
    case UIMode.SCENE_CUSTOMER:
      speaker = "顧客 (渡辺部長)";
      text = "「やあPMさん！ 今週の進捗はどうですか？ 何かご相談やご提案でも？」";
      break;
    case UIMode.SCENE_MANAGER:
      speaker = "上司 (高橋部長)";
      text = "「おお、PMくんか。プロジェクトの進捗やリソースで懸念はあるか？」";
      break;
    case UIMode.SCENE_TEAM:
      speaker = "PL タツヤ";
      text = "「PMさん、お疲れ様です！ 現場の見積もり精査や1on1サポートですか？」";
      break;
  }

  if (speakerEl) speakerEl.textContent = speaker;
  dialogEl.textContent = text;

  // ログ表示
  if (logContainerEl) {
    logContainerEl.innerHTML = logs.map(l => `<div class="log-item">${l}</div>`).join("");
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
      currentUIMode = UIMode.PROLOGUE;
      renderAll();
    });
    panelEl.appendChild(startBtn);

  } else if (currentUIMode === UIMode.PROLOGUE) {
    // 【プロローグ画面】アサイン了解ボタン
    const acceptBtn = document.createElement("button");
    acceptBtn.id = "btn-accept-assignment";
    acceptBtn.className = "btn-adv btn-primary-category";
    acceptBtn.style.gridColumn = "span 2";
    acceptBtn.style.padding = "1.2rem";
    acceptBtn.style.alignItems = "center";
    acceptBtn.innerHTML = "<span>💼 了解しました！ PMのデスクへ向かう</span><span class='btn-sub-desc'>今週の活動方針を決定する</span>";
    acceptBtn.addEventListener("click", () => {
      currentUIMode = UIMode.DASHBOARD;
      logs.push("上司から案件がアサインされました！ 今週のアクションを決定してください。");
      renderAll();
    });
    panelEl.appendChild(acceptBtn);

  } else if (currentUIMode === UIMode.DASHBOARD) {
    // 【第一階層コマンド】メイン画面での4大ボタン
    const navButtons = [
      {
        id: "nav-customer",
        label: "💬 顧客と話す",
        desc: "要件確認、デモ提示、スコープ・納期交渉",
        mode: UIMode.SCENE_CUSTOMER
      },
      {
        id: "nav-manager",
        label: "🏢 上司に相談",
        desc: "状況報告、バッファ直訴、助っ人要請",
        mode: UIMode.SCENE_MANAGER
      },
      {
        id: "nav-team",
        label: "🛠️ 現場と調整",
        desc: "技術リスク精査、過去教訓共有、1on1",
        mode: UIMode.SCENE_TEAM
      },
      {
        id: "nav-next-week",
        label: "⏱️ 週を進める",
        desc: "今週の作業を進め、週次定例会議・ターン経過へ",
        isSpecial: true
      }
    ];

    navButtons.forEach(b => {
      const btn = document.createElement("button");
      btn.id = b.id;
      btn.className = "btn-adv btn-primary-category";
      btn.innerHTML = `<span>${b.label}</span><span class="btn-sub-desc">${b.desc}</span>`;
      
      if (b.isSpecial) {
        btn.addEventListener("click", handleAdvanceWeek);
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
// アクション実行ハンドラ
// =========================================================================
export function handleExecuteAction(action) {
  if (pmState.ap < action.costAp) return;

  pmState.ap -= action.costAp;
  kickoffHistory.push(action.id);

  let effectLog = `▶ 『${action.name}』 を実行しました。`;

  // アクション効果の適用
  if (action.id === "req_def_ws") {
    projectState.clarityLevel = Math.min(5, projectState.clarityLevel + 1);
    effectLog += " (要件明確度+1)";
  } else if (action.id === "phased_release") {
    projectState.customer.satisfaction = Math.max(0, projectState.customer.satisfaction - 3);
    effectLog += " (初期スコープ調整 / 顧客満足度-3%)";
  } else if (action.id === "prototype_demo") {
    projectState.customer.satisfaction = Math.min(100, projectState.customer.satisfaction + 5);
    effectLog += " (モック提示で認識統一！ 満足度+5%)";
  } else if (action.id === "qcd_align") {
    projectState.customer.satisfaction = Math.min(100, projectState.customer.satisfaction + 4);
    effectLog += " (期待値調整完了！ 満足度+4%)";
  } else if (action.id === "buffer_request") {
    projectState.deadlineWeeks += 1;
    projectState.managerSatisfaction = Math.max(0, projectState.managerSatisfaction - 5);
    effectLog += " (納期バッファ+1週獲得！ 上司評価-5%)";
  } else if (action.id === "helper_request") {
    effectLog += " (助っ人エンジニアを追加依頼！ 現場開発速度UP)";
  } else if (action.id === "boss_risk_check") {
    effectLog += ` (上司の期待ライン確認: 上司信頼度 ${projectState.managerSatisfaction.toFixed(0)}%)`;
  } else if (action.id === "tech_risk_check") {
    effectLog += " (技術リスク精査完了！ 安全度上昇)";
  } else if (action.id === "retrospective_share") {
    effectLog += " (過去教訓を共有！ 事故率低減)";
  } else if (action.id === "one_on_one") {
    effectLog += " (チーム1on1実施！ 隠れた不安を看破)";
  }

  logs.push(effectLog);
  renderAll();
}

// =========================================================================
// ⏱️ 週進捗 ＆ イベント発生ハンドラ
// =========================================================================
export function handleAdvanceWeek() {
  // 週の進行計算
  const sprintLogs = runWeeklySprint(projectState, [], new Set(), pmState);
  logs.push(`--- Week ${projectState.week - 1} 進行完了 ---`);
  logs.push(...sprintLogs);

  // プロジェクト完了・失敗判定
  if (projectState.week > projectState.deadlineWeeks + 1) {
    showResultScreen();
    return;
  }

  // 1. 【定期イベント（定例会議）】の発生
  const meetingEvent = generateWeeklyMeetingEvent(projectState, projectState.week);
  if (meetingEvent) {
    triggerEventModal(meetingEvent);
  }

  // 2. 突発トラブルの判定（モーダル未発生時のみ）
  if (!activeModalEvent) {
    const randomEvent = checkRandomEventTrigger(projectState);
    if (randomEvent) {
      triggerEventModal(randomEvent);
    }
  }

  renderAll();
}

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

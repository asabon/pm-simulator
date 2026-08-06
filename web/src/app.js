// Web ADV Edition App Controller (app.js)

import {
  ADV_ACTIONS,
  PM,
  UIMode
} from "./entities.js";
import {
  calculateFinalScore,
  checkRandomEventTrigger,
  evaluateKickoffReadiness,
  generateScheduledMeetingEvent,
  generateWeeklyMeetingEvent,
  getInitialDeveloperPool,
  getInitialProjectData,
  getPMOAdvice,
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
export let activeSceneMessage = null;

// =========================================================================
// 初期化 (Initialization)
// =========================================================================
export function initGame() {
  currentUIMode = UIMode.TITLE;
  pmState.resetAp();
  kickoffHistory = [];
  logs = [];
  activeSceneMessage = null;

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

  // タイトル画面、プロローグ画面、およびPCメール未確認時はステータスバーを非表示に設定
  if (currentUIMode === UIMode.TITLE || currentUIMode === UIMode.PROLOGUE_INTRO || currentUIMode === UIMode.PROLOGUE || (projectState && !projectState.isStatusDisclosed)) {
    if (statusBarEl) statusBarEl.style.display = "none";
    if (weekInfoEl) weekInfoEl.textContent = "-";
    if (custSatEl) custSatEl.textContent = "-";
    if (bossTrustEl) bossTrustEl.textContent = "-";
    if (teamSafetyEl) teamSafetyEl.textContent = "-";
    return;
  }

  // メインダッシュボードかつメール確認完了後は表示
  if (statusBarEl) statusBarEl.style.display = "flex";

  if (projectState) {
    const currentDateStr = projectState.getDateString ? projectState.getDateString(projectState.day) : `Day ${projectState.day}`;
    const deadlineDateStr = projectState.getDateString ? projectState.getDateString(projectState.maxDays) : "Day 20";
    const remainingDays = projectState.maxDays - projectState.day;
    const remainingText = remainingDays > 0 ? `残り ${remainingDays}営業日` : "本日最終日！";

    if (weekInfoEl) {
      weekInfoEl.textContent = `📅 ${currentDateStr} (Day ${projectState.day}/${projectState.maxDays}) | 納期: ${deadlineDateStr} (${remainingText})`;
    }
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
      if (titleEl) titleEl.textContent = "上司執務室前";
      sceneBgEl.classList.add("bg-manager");
      if (avatarEl) avatarEl.textContent = "🚪";
      if (nameEl) nameEl.textContent = "執務室のドア";
      break;

    case UIMode.PROLOGUE:
      if (iconEl) iconEl.textContent = "🏢";
      if (titleEl) titleEl.textContent = "上司執務室";
      sceneBgEl.classList.add("bg-manager");
      if (avatarEl) avatarEl.textContent = "👔";
      if (nameEl) nameEl.textContent = "事業部長";
      break;

    case UIMode.DASHBOARD:
      if (iconEl) iconEl.textContent = "🖥️";
      if (titleEl) titleEl.textContent = "PM自席";
      sceneBgEl.classList.add("bg-dashboard");
      if (avatarEl) avatarEl.textContent = "💻";
      if (nameEl) nameEl.textContent = "PMのデスク";
      break;

    case UIMode.SCENE_CUSTOMER:
      if (iconEl) iconEl.textContent = "🤝";
      if (titleEl) titleEl.textContent = "顧客のオフィス / 会議室";
      sceneBgEl.classList.add("bg-customer");
      if (avatarEl) avatarEl.textContent = "👤";
      if (nameEl) nameEl.textContent = `顧客 (部長)`;
      break;

    case UIMode.SCENE_MANAGER:
      if (iconEl) iconEl.textContent = "🏢";
      if (titleEl) titleEl.textContent = "上司の執務室";
      sceneBgEl.classList.add("bg-manager");
      if (avatarEl) avatarEl.textContent = "👔";
      if (nameEl) nameEl.textContent = "事業部長";
      break;

    case UIMode.SCENE_TEAM:
      if (iconEl) iconEl.textContent = "🛠️";
      if (titleEl) titleEl.textContent = "開発チームフロア";
      sceneBgEl.classList.add("bg-team");
      if (avatarEl) avatarEl.textContent = "👨‍💻";
      if (nameEl) {
        nameEl.textContent = (kickoffHistory.includes("team_kickoff") || kickoffHistory.includes("team_kickoff_rally")) ? "開発リーダー(PL) & チーム" : "開発チーム (体制構築中)";
      }
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
      text = "「あなたは事業部長から執務室へ呼び出された。今期のプロジェクトについての重要な話があるようだ…」";
      break;
    case UIMode.PROLOGUE:
      speaker = "上司 (事業部長)";
      text = "「おお、PMくん！ 待っていたよ。今期の大事な案件『第1期 基幹決済システム改修』のプロジェクトマネージャーとして君をアサインする！ 納期は4週間(全20営業日)。開発メンバーの選定やチーム体制の構築も含めて、君にマネジメントを任せる。詳しい案件資料はメールで送っておいたので、自席のPCで確認して活動方針を決めてくれ。頼んだぞ！」";
      break;
    case UIMode.DASHBOARD:
      if (activeMailContent) {
        speaker = activeMailContent.speaker;
        text = activeMailContent.text;
      } else {
        speaker = "PMの思考";
        text = pmState.ap > 0 
          ? `「本日(Day ${projectState.day})のAP残量は ${pmState.ap} だ。どこへ移動して誰と話すか、あるいはアポを入れるか決めよう。」`
          : "「本日のAPを使い切りました。⏱️ 1日を進める ボタンで次の日へ進行させてください。」";
      }
      break;
    case UIMode.SCENE_CUSTOMER:
      speaker = "顧客 (部長)";
      text = "「やあPMさん！ 今日の用件は？ 重要な会議ならアポを取ってカレンダーにセットしてくれよ。」";
      break;
    case UIMode.SCENE_MANAGER:
      speaker = "上司 (事業部長)";
      text = "「おお、PMくんか。直訴や重大相談なら日程を調整して面談を入れよう。」";
      break;
    case UIMode.SCENE_TEAM:
      if (kickoffHistory.includes("team_kickoff") || kickoffHistory.includes("team_kickoff_rally")) {
        speaker = "開発リーダー (PL)";
        text = "「PMさん！ 現場の技術リスク精査や1on1なら今日すぐに動けますよ！」";
      } else {
        speaker = "開発メンバー候補";
        text = "「PMさん、開発チームフロアへようこそ！ 事前調整で根拠を集めたら、いつでも『🚀 チームキックオフ決起』を執り行いましょう！」";
      }
      break;
  }

  if (activeSceneMessage) {
    speaker = activeSceneMessage.speaker;
    text = activeSceneMessage.text;
  }

  // 🦉 PMO軍師アドバイスの更新
  const pmoAdvice = getPMOAdvice(projectState, kickoffHistory, projectState ? projectState.day : 1);
  if (currentUIMode !== UIMode.TITLE && currentUIMode !== UIMode.PROLOGUE_INTRO && currentUIMode !== UIMode.PROLOGUE) {
    text = `【${pmoAdvice.badge}】\n${pmoAdvice.text}\n\n${text}`;
  }

  if (speakerEl) speakerEl.textContent = speaker;
  dialogEl.textContent = text;

  // タイトル〜プロローグ中はアクションログ枠を非表示にする
  if (logContainerEl) {
    if (currentUIMode === UIMode.TITLE || currentUIMode === UIMode.PROLOGUE_INTRO || currentUIMode === UIMode.PROLOGUE) {
      logContainerEl.style.display = "none";
    } else {
      logContainerEl.style.display = "flex";
      let scheduleInfo = "";
      if (projectState && projectState.scheduledMeetings.length > 0) {
        scheduleInfo = `<div style="color:#fbbf24; font-weight:bold; margin-bottom:0.4rem;">📅 予約カレンダー: ${projectState.scheduledMeetings.map(m => `[Day ${m.day}: ${m.title}]`).join(", ")}</div>`;
      }
      logContainerEl.innerHTML = scheduleInfo + logs.map(l => `<div class="log-item">${l}</div>`).join("");
      logContainerEl.scrollTop = logContainerEl.scrollHeight;
    }
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
      if (projectState) {
        projectState.isStatusDisclosed = true;
      }
      activeMailContent = {
        speaker: "自席PC (引き継ぎメール確認)",
        text: "【件名】 第1期 基幹決済システム改修 プロジェクト概要＆方針\n\n「顧客(部長)より『既存決済基盤の安定化と新決済手段追加の両立』が強く要求されています。納期はDay 20(4週間)。\nまずは開発リーダー(PL)をはじめとするメンバーとの調整やチームビルディングを行い、顧客との要件定義WS予約や現場の技術リスク精査を進めてください。」"
      };
      logs.push("📧 自席PCで引き継ぎメールを確認し、プロジェクトステータスが開示されました。");
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
        desc: "【即時】体制構築・技術リスク・1on1",
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
          activeMailContent = null;
          activeSceneMessage = null;
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
    if (currentUIMode === UIMode.SCENE_TEAM) {
      const isKickoffDone = kickoffHistory.includes("team_kickoff") || kickoffHistory.includes("team_kickoff_rally");
      if (isKickoffDone) {
        actionsList = ADV_ACTIONS.TEAM.filter(act => act.id !== "team_kickoff" && act.id !== "team_kickoff_rally");
      } else {
        actionsList = ADV_ACTIONS.TEAM.filter(act => act.id !== "holiday_work_request");
      }
    }

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
      activeSceneMessage = null;
      currentUIMode = UIMode.DASHBOARD;
      renderAll();
    });
    panelEl.appendChild(backBtn);
  }
}

// PCメール確認ハンドラ (ステータス解禁)
export let activeMailContent = null;

export function handleCheckPcMail() {
  if (projectState) {
    const isFirstTime = !projectState.isStatusDisclosed;
    projectState.isStatusDisclosed = true;

    if (isFirstTime) {
      logs.push("✨ 【ステータス開示】 自席PCのメールを確認しました！ 画面上部のプロジェクトステータス（顧客満足度・上司信頼度・チーム健全性）が開示されました。");
    } else {
      logs.push("📧 自席PCで案件概要メールとチーム構成を再確認しました。");
    }
  }

  activeMailContent = {
    speaker: "自席PC (メール受信トレイ)",
    text: "【件名】 第1期 基幹決済システム改修 プロジェクト概要＆方針\n\n「顧客(部長)より『既存決済基盤の安定化と新決済手段追加の両立』が強く要求されています。納期はDay 20(4週間)。\nまずは開発リーダー(PL)をはじめとするメンバーとの調整やチームビルディングを行い、顧客との要件定義WS予約や現場の技術リスク精査を進めてください。」"
  };

  renderAll();
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
    activeSceneMessage = {
      speaker: "PMの思考",
      text: `「『${action.name}』のアポをセットした。指定の日に備えてしっかり準備を進めよう。」`
    };
    logs.push(`📅 【アポ予約完了】 『${action.name}』 を ${scheduledDay} 日目 (Day ${scheduledDay}) の予定表にセットしました！`);
  } else {
    // ⚡ 即時アクション処理
    let effectLog = `▶ 『${action.name}』 を現場で即時実行しました。`;

    if (action.id === "holiday_work_request") {
      const devs = projectState.getAllDevelopers();
      devs.forEach(d => { d.fatigue = Math.min(100, d.fatigue + 25); });
      effectLog += " (🚨 休日出勤依頼！ 開発進捗を大きく回復。ただし開発陣の疲労度+25%急上昇！)";
      activeSceneMessage = {
        speaker: "開発メンバー",
        text: "「休日出勤の件、承知しました…！ 納期に間に合わせるため踏ん張り時ですね。みんなでラストスパートをかけます！」"
      };
    } else if (action.id === "team_kickoff" || action.id === "team_kickoff_rally") {
      const evalRes = evaluateKickoffReadiness(kickoffHistory);
      const devs = projectState.getAllDevelopers();
      devs.forEach(d => { d.fatigue = Math.max(0, d.fatigue - Math.max(0, evalRes.teamHealthBonus)); });
      
      effectLog += ` (🚀 チームキックオフ決起完了！ 【${evalRes.title}】 ${evalRes.desc})`;
      activeSceneMessage = {
        speaker: "開発リーダー (PL)",
        text: `「PMさん、キックオフ決起の宣言ありがとうございます！ 【キックオフ診断: ${evalRes.title}】 ${evalRes.desc} 私を中心にチーム一丸となって開発本番をやり抜きます！」`
      };
    } else if (action.id === "prototype_demo") {
      projectState.customer.satisfaction = Math.min(100, projectState.customer.satisfaction + 5);
      effectLog += " (モック提示で認識統一！ 満足度+5%)";
      activeSceneMessage = {
        speaker: "顧客 (部長)",
        text: "「おお、動くプロトタイプを見せてくれるのか！ 実際の画面があると完成イメージが湧きやすくて助かるよ。」"
      };
    } else if (action.id === "boss_risk_check") {
      effectLog += ` (上司の期待ライン確認: 上司信頼度 ${projectState.managerSatisfaction.toFixed(0)}%)`;
      activeSceneMessage = {
        speaker: "上司 (事業部長)",
        text: "「我が部門としてのラインは『稼働後の致命障害ゼロ』だ。無理な納期で品質を落とすことだけは避けてくれたまえ。」"
      };
    } else if (action.id === "tech_risk_check") {
      effectLog += " (技術リスク・見積精査完了！ 今後の交渉の『明確な根拠』を獲得)";
      activeSceneMessage = {
        speaker: "開発リーダー (PL)",
        text: "「現場のソースコードと見積精度を再チェックしました。これで顧客や上司との交渉に必要な『明確な技術根拠』が揃いましたよ！」"
      };
    } else if (action.id === "retrospective_share") {
      effectLog += " (過去教訓を共有！ 事故率低減)";
      activeSceneMessage = {
        speaker: "開発リーダー (PL)",
        text: "「過去の類似プロジェクトでの失敗ケースですね。事前にハマりやすい罠を共有してもらえたので、チームで対策を打っておきます！」"
      };
    } else if (action.id === "one_on_one") {
      effectLog += " (チーム1on1実施！ 隠れた不安を看破)";
      activeSceneMessage = {
        speaker: "開発メンバー",
        text: "「PMさん、個別の相談に乗っていただきありがとうございます！ 懸念していた仕様の疑問点がすっきり解消しました。」"
      };
    }
    logs.push(effectLog);
  }

  renderAll();
}

// =========================================================================
// ⏱️ 日進行 ＆ イベント・アポ会議判定ハンドラ
// =========================================================================
export function handleAdvanceDay() {
  activeMailContent = null;
  activeSceneMessage = null;
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

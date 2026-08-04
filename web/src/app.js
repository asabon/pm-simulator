import { PM, Team } from "./entities.js?v=999";
import {
  getInitialDeveloperPool,
  getInitialProjectData
} from "./engine.js?v=999";

// エラーハンドラー（万が一エラーが発生した場合に画面に赤字で原因を表示）
window.addEventListener("error", (event) => {
  showErrorOnScreen(event.error || event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showErrorOnScreen(event.reason);
});

function showErrorOnScreen(err) {
  const c = document.getElementById("app-container");
  if (c) {
    c.innerHTML = `
      <div style="background:rgba(239,68,68,0.15); border:2px solid #ef4444; color:#ef4444; padding:20px; border-radius:12px; margin:20px; text-align:left; font-family:monospace;">
        <h3 style="margin-top:0;">🚨 JavaScript 実行エラーが検知されました</h3>
        <pre style="white-space:pre-wrap; word-break:break-all;">${err ? (err.stack || err.toString()) : "不明なエラー"}</pre>
      </div>
    `;
  }
}

// アプリケーション状態管理
const state = {
  pm: new PM(3),
  developerPool: [],
  currentProject: null,
  tasks: [],
  projectCounter: 1,
  logs: [],
  kickoffState: {
    step: 1.1,
    interviewSequence: [],
    currentMeetingIndex: 0,
    obtainedKnowledge: [],
    interviewApInvested: { PL: 0, CLIENT: 0, BOSS: 0 },
    kickoffAp: 3,
    kickoffWeeksSpent: 0,
    selectedMethod: "WATERFALL"
  }
};

function getContainer() {
  return document.getElementById("app-container");
}

function updateHeader() {
  const elCareerYears = document.getElementById("pm-career-years");
  const elCompletedPjs = document.getElementById("pm-completed-pjs");
  const elPmAp = document.getElementById("pm-ap");

  if (elCareerYears) elCareerYears.textContent = state.pm.careerYears;
  if (elCompletedPjs) elCompletedPjs.textContent = state.pm.completedProjects;
  if (elPmAp) elPmAp.textContent = state.pm.ap;
}

function updatePhaseStepper(phase) {
  const kickoff = document.getElementById("step-kickoff");
  const dashboard = document.getElementById("step-dashboard");
  const result = document.getElementById("step-result");

  if (kickoff) kickoff.classList.toggle("active", phase === "kickoff");
  if (dashboard) dashboard.classList.toggle("active", phase === "dashboard");
  if (result) result.classList.toggle("active", phase === "result");
}

// 初期化
function init() {
  try {
    state.developerPool = getInitialDeveloperPool();
    startNewProject();
  } catch (err) {
    showErrorOnScreen(err);
  }
}

// 1. キックオフフェーズの開始
function startNewProject() {
  const { project, tasks } = getInitialProjectData(state.projectCounter);
  state.currentProject = project;
  state.tasks = tasks;
  state.logs = [];
  state.kickoffState = {
    step: 1.1,
    interviewSequence: [],
    currentMeetingIndex: 0,
    obtainedKnowledge: [],
    interviewApInvested: { PL: 0, CLIENT: 0, BOSS: 0 },
    kickoffAp: 3,
    kickoffWeeksSpent: 0,
    selectedMethod: "WATERFALL"
  };

  // チーム編成
  const team = new Team("main_team", "メイン開発チーム");
  const plCandidate = state.developerPool.find(d => d.isPlQualified && !d.isRetired) || state.developerPool[0];
  team.setLeader(plCandidate);

  state.developerPool.forEach(dev => {
    if (dev !== plCandidate && !dev.isRetired) {
      team.assignMember(dev);
    }
  });

  project.registerTeam(team);
  renderKickoffView();
}

function renderKickoffView() {
  updateHeader();
  updatePhaseStepper("kickoff");
  const container = getContainer();
  if (!container) return;

  const proj = state.currentProject;
  const ks = state.kickoffState;
  const pl = (proj && proj.mainTeam) ? proj.mainTeam.leader : null;

  // Step 1-1: 上司からの業務アサイン
  if (ks.step === 1.1) {
    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🚀 フェーズ1: キックオフ</h2>
            <span class="step-badge">Step 1-1: 上司アサイン ＆ 状況確認</span>
          </div>
          <span style="background:rgba(245,158,11,0.15); padding:2px 8px; border-radius:6px; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; font-weight:600; font-size:12px;">
            第 ${state.projectCounter} 期 案件
          </span>
        </div>

        <div class="metric-box" style="border-left:4px solid #60a5fa; background:rgba(96,165,250,0.08); margin-bottom:16px;">
          <div style="font-size:14px; font-weight:700; color:#60a5fa; margin-bottom:6px;">🏢 上司 (部長) からのブリーフィング:</div>
          <div class="speech-bubble" style="margin:0; font-size:13px;">
            💬 <strong>上司:</strong> 「今回の案件は【<strong>${proj.name}</strong>】だ。<br>
            顧客の <strong>${proj.customer.name}</strong> 様からの期待は『<strong>${proj.priorityExpectation}</strong>』となっている。<br>
            担当PLは <strong>${pl ? pl.name : '未定'}</strong> だ。しっかり関係者と事前会議を重ねて防衛線を構築してくれたまえ。」
          </div>
        </div>

        <div class="metric-box" style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:700; color:var(--text-main); margin-bottom:8px;">📊 初期案件パラメーター ＆ 条件:</div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:10px; font-size:12px;">
            <div style="background:var(--card-bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color);">
              ⏱️ 契約納期: <strong>あと ${proj.deadlineWeeks} 週間</strong>
            </div>
            <div style="background:var(--card-bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color);">
              🌟 要求具体度: <strong>${'★'.repeat(proj.clarityLevel || 3)} (${proj.clarityLevel || 3}/5)</strong>
              <button id="btn-help-clarity" style="background:none; border:none; color:#60a5fa; cursor:pointer; font-size:13px; margin-left:4px; padding:0;" title="要求具体度の説明を見る">
                ❓
              </button>
            </div>
            <div style="background:var(--card-bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color);">
              👥 担当PL: <strong>${pl ? pl.name : 'アサイン調整中'}</strong> ${pl ? `(初期モチベーション: ${pl.morale}%)` : ''}
            </div>
          </div>

          <div id="clarity-help-box" style="display:none; background:rgba(15,23,42,0.95); border:1px solid #60a5fa; padding:12px; border-radius:8px; margin-top:10px; font-size:12px; line-height:1.5; color:var(--text-main);">
            <div style="font-weight:700; color:#60a5fa; margin-bottom:4px;">💡 【要求具体度（★1〜★5）についての解説】</div>
            ・要求の具体化レベル・解像度を 5 段階で表現しています。<br>
            ・<strong>★5つ:</strong> 顧客と現場の間で要件・優先順位が「完全かつ明確に把握できている状態」を意味します。<br>
            ・事前会議などのアクションで上昇しますが、<strong>開発初期段階ではどれだけネゴしても★5にはならないことが多い</strong>です。（開発スプリントの進行に伴って深まっていくパラメータとなります）
          </div>

          <div class="speech-bubble" style="margin-top:10px; font-size:12px; color:var(--accent-warning);">
            💬 <strong>顧客の第一声:</strong> 「${proj.customer.speak()}」
          </div>
        </div>

        <button id="btn-to-step1-2" class="btn-cmd btn-primary" style="margin-top:12px; padding:14px; font-size:15px; width:100%; justify-content:center;">
          次へ: 「Step 1-2: 事前会議のセッティング」へ進む ▶
        </button>
      </div>
    `;

    const helpBtn = document.getElementById("btn-help-clarity");
    const helpBox = document.getElementById("clarity-help-box");
    if (helpBtn && helpBox) {
      helpBtn.addEventListener("click", () => {
        const isHidden = helpBox.style.display === "none";
        helpBox.style.display = isHidden ? "block" : "none";
      });
    }

    const btnNext = document.getElementById("btn-to-step1-2");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        ks.step = 1.2;
        renderKickoffView();
      });
    }
    return;
  }

  // Step 1-2: 事前会議の自由セッティング
  if (ks.step === 1.2) {
    const seq = ks.interviewSequence || [];

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">📅 今週の事前会議を自由にセッティング</h2>
            <h2 style="font-size:18px; font-weight:700; margin:0;">📅 事前調整フェーズ</h2>
            <span class="step-badge">第 ${ks.kickoffWeeksSpent + 1} ターン目 (残り納期: ${proj.deadlineWeeks} 週間)</span>
          </div>
        </div>

        <h3 style="font-size:16px; margin:0 0 12px 0;">📅 Step 1-2: 今週の個別会議スケジュールを設定 (最大3枠)</h3>
        <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">
          ［顧客］［PL］［上司］のボタンを押し、今週開催する個別会議の順番を予約します。<br>
          前の会議で手に入れた本音・要望を、次の会議の相手に直接インプットとして持ち込んで交渉できます！
        </p>

        <div style="display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
          <button id="add-client" class="btn-cmd" style="flex:1; padding:10px; font-size:13px;">➕ 👥 顧客との会議を追加</button>
          <button id="add-pl" class="btn-cmd" style="flex:1; padding:10px; font-size:13px;">➕ 🛠️ PLとの会議を追加</button>
          <button id="add-boss" class="btn-cmd" style="flex:1; padding:10px; font-size:13px;">➕ 🏢 上司との会議を追加</button>
        </div>

        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:12px; border-radius:8px; margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:13px; font-weight:700;">📋 予約済みの会議スケジュール (最大3枠)</span>
            <button id="btn-clear-queue" class="btn-cmd" style="font-size:11px; padding:4px 8px;">クリア</button>
          </div>
          ${seq.length === 0 ? `
            <div style="font-size:12px; color:var(--text-muted); padding:10px 0; text-align:center;">
              上のボタンを押して、今週巡る個別会議のスケジュールを組んでください。
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${seq.map((item, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color); font-size:13px;">
                  <span><strong>第${idx + 1}会議:</strong> ${item.title}</span>
                  <span class="step-badge" style="font-size:11px;">${item.target}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="display:flex; gap:10px;">
          <button id="btn-start-meetings" class="btn-cmd btn-primary" style="flex:2; padding:14px; font-size:15px; justify-content:center;" ${seq.length === 0 ? 'disabled' : ''}>
            🚀 予約したスケジュールで個別会議を開始！ ▶
          </button>
          <button id="btn-skip-to-kickoff" class="btn-cmd" style="flex:1; padding:14px; font-size:13px; justify-content:center; border-color:#f59e0b; color:#f59e0b;">
            🎉 事前調整を終了しキックオフへ
          </button>
        </div>
      </div>
    `;

    const addClient = document.getElementById("add-client");
    if (addClient) addClient.addEventListener("click", () => { if (seq.length < 3) { seq.push({ target: "CLIENT", title: "対 顧客との会議" }); renderKickoffView(); } });
    const addPl = document.getElementById("add-pl");
    if (addPl) addPl.addEventListener("click", () => { if (seq.length < 3) { seq.push({ target: "PL", title: "対 PLとの会議" }); renderKickoffView(); } });
    const addBoss = document.getElementById("add-boss");
    if (addBoss) addBoss.addEventListener("click", () => { if (seq.length < 3) { seq.push({ target: "BOSS", title: "対 上司との会議" }); renderKickoffView(); } });

    const btnClear = document.getElementById("btn-clear-queue");
    if (btnClear) btnClear.addEventListener("click", () => { ks.interviewSequence = []; renderKickoffView(); });

    const btnStart = document.getElementById("btn-start-meetings");
    if (btnStart) btnStart.addEventListener("click", () => { if (seq.length > 0) { ks.currentMeetingIndex = 0; ks.kickoffAp = 3; ks.step = 2; renderKickoffView(); } });

    const btnSkip = document.getElementById("btn-skip-to-kickoff");
    if (btnSkip) btnSkip.addEventListener("click", () => { ks.step = 3; renderKickoffView(); });
    return;
  }

  // Step 2: 個別事前会議の開催
  if (ks.step === 2) {
    const currentMeeting = ks.interviewSequence[ks.currentMeetingIndex];

    if (!currentMeeting) {
      ks.step = 2.9;
      renderKickoffView();
      return;
    }

    const target = currentMeeting.target;
    const invested = ks.interviewApInvested[target] || 0;
    const targetName = target === "PL" ? (pl ? `PL ${pl.name}` : "PL") : (target === "CLIENT" ? `顧客 ${proj.customer.name}` : "上司 (部長)");

    const getOptions = () => {
      const opts = [];
      if (target === "PL") {
        opts.push({ id: "PL_1", text: "現場の本音・技術懸念のヒアリング" });
        opts.push({ id: "PL_2", text: "開発負荷の軽減・残業抑制方針の共有" });
        opts.push({ id: "PL_PUSH", text: "⚠️ 「何とか気合で頑張ってくれ」と現場を押し切る (※トレードオフ)" });
        if (ks.obtainedKnowledge.includes("CLIENT_REQUIREMENT")) {
          opts.push({ id: "PL_SPECIAL", text: "★【顧客インプット共有】持ち帰った顧客要望を伝え、現場代替案を相談", special: true });
        }
      } else if (target === "CLIENT") {
        opts.push({ id: "C_1", text: "顧客の真の要求・優先度 (QCD) のヒアリング" });
        opts.push({ id: "C_2", text: "納期・スコープ調整の事前打診" });
        opts.push({ id: "C_YES", text: "⚠️ 「全ての要望に笑顔で対応します」と安易に引き受ける (※トレードオフ)" });
        opts.push({ id: "C_REFUSE", text: "⚠️ 「スコープを削らないと絶対無理です」と突っぱねる (※トレードオフ)" });
        if (ks.obtainedKnowledge.includes("SOLUTION_STAGED_RELEASE")) {
          opts.push({ id: "C_SPECIAL_STAGED", text: "★【現場対案インプット】現場で策定した『段階リリース案』を提案・交渉", special: true });
        }
        if (ks.obtainedKnowledge.includes("BOSS_BACKUP")) {
          opts.push({ id: "C_SPECIAL_BOSS", text: "★【上司方針インプット】『会社（上司）公認の品質担保ライン』を提示して説得", special: true });
        }
      } else if (target === "BOSS") {
        opts.push({ id: "B_REQ_INFO", text: "顧客の要求についての詳細・背景事情を確認する" });
        opts.push({ id: "B_CLIENT_TYPE", text: "顧客のタイプ・パーソナリティ傾向と注意点を確認する" });
        opts.push({ id: "B_BACKUP", text: "炎上時の会社バックアップラインの合意" });
        if (ks.obtainedKnowledge.includes("PL_TECH_ANXIETY") || ks.obtainedKnowledge.includes("CLIENT_REQUIREMENT")) {
          opts.push({ id: "B_SPECIAL_RESOURCE", text: "★【現場インプット共有】現場のリスク・課題を提示し、追加予算・予備リソースを申請", special: true });
        }
      }
      return opts;
    };

    const options = getOptions();

    // 持ち込み可能なインプット情報のテキスト化
    const getKnowledgeBadges = () => {
      if (!ks.obtainedKnowledge || ks.obtainedKnowledge.length === 0) return `<span style="color:var(--text-muted);">なし (まずは個別ヒアリングから始めましょう)</span>`;
      const map = {
        CLIENT_REQUIREMENT: "🗣️ 顧客: 納期厳守が第一",
        CLIENT_BACKGROUND_INFO: "🏢 上司: 親会社DX要件・見栄え重視",
        CLIENT_TYPE_KNOWN: "🏢 上司: 顧客は仕様変更多めタイプ",
        PL_TECH_ANXIETY: "🔥 PL: 未経験スタックへの不安",
        SOLUTION_STAGED_RELEASE: "💡 現場対案: 段階リリース方針",
        BOSS_BACKUP: "🛡️ 上司合意: 会社公認品質ライン",
        BOSS_RESOURCE_GRANTED: "💰 上司承認: 予備リソース枠確保"
      };
      return ks.obtainedKnowledge.map(k => `<span style="background:rgba(96,165,250,0.15); border:1px solid #60a5fa; color:#60a5fa; padding:2px 8px; border-radius:10px; font-size:11px;">${map[k] || k}</span>`).join(' ');
    };

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🗣️ 会議画面: ${targetName}</h2>
            <span class="step-badge">第 ${ks.currentMeetingIndex + 1} 会議 / 全 ${ks.interviewSequence.length} 会議</span>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:4px;">
            💬 個別会議中 (行動ポイント制限なし)
          </div>
        </div>

        <div style="font-size:13px; font-weight:600; color:#60a5fa; margin-bottom:10px;">
          📅 ミーティング ${ks.currentMeetingIndex + 1}: ${currentMeeting.title}
        </div>

        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:8px 12px; border-radius:6px; margin-bottom:12px; font-size:12px;">
          <div style="font-weight:700; color:#f59e0b; margin-bottom:4px;">💡 過去の会議で獲得した持ち込みインプット情報 (次の相手に伝達可能):</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${getKnowledgeBadges()}
          </div>
        </div>

        <div style="display:flex; gap:10px; margin-bottom:14px; flex-wrap:wrap; font-size:12px;">
          <span style="background:var(--card-bg); padding:6px 12px; border-radius:6px; border:1px solid var(--border-color);">
            👥 顧客満足度: <strong>${proj.customer.satisfaction.toFixed(0)}%</strong>
          </span>
          <span style="background:var(--card-bg); padding:6px 12px; border-radius:6px; border:1px solid var(--border-color);">
            🔥 チーム健全性: <strong>${pl ? pl.morale : 50}%</strong>
          </span>
          <span style="background:var(--card-bg); padding:6px 12px; border-radius:6px; border:1px solid var(--border-color);">
            🏢 上司信頼度: <strong>${(proj.managerTrust || 60).toFixed(0)}%</strong>
          </span>
        </div>

        ${invested >= 2 ? `
          <div style="background:rgba(245,158,11,0.15); border:1px solid #f59e0b; padding:10px 14px; border-radius:8px; color:#f59e0b; font-size:12px; font-weight:600; margin-bottom:14px;">
            💡 この相手とは十分に議論を行いました。必要に応じて「次の会議へ移動する」を押してください。
          </div>
        ` : ""}

        <div id="dialog-log" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:12px; border-radius:8px; min-height:70px; margin-bottom:16px; font-size:13px;">
          ${ks.lastDialogLog || '💬 会議での対話・意思決定アクションを選択してください。'}
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${options.map(opt => `
            <button class="btn-cmd btn-action-item" data-id="${opt.id}" style="padding:10px 14px; font-size:13px; text-align:left; justify-content:flex-start; ${opt.special ? 'border-color:#f59e0b; background:rgba(245,158,11,0.1); color:#f59e0b; font-weight:700;' : ''}">
              ${opt.text}
            </button>
          `).join('')}

          <button id="btn-next-meeting" class="btn-cmd" style="padding:10px 14px; font-size:13px; margin-top:8px; justify-content:center; background:rgba(255,255,255,0.05);">
            ▶ この会議を終了し、次の会議へ移動する
          </button>
        </div>
      </div>
    `;

    const executeAction = (actionId) => {
      const currentInvested = (ks.interviewApInvested[target] || 0) + 1;
      ks.interviewApInvested[target] = currentInvested;

      let resultHtml = "";

      const mult = currentInvested === 1 ? 1.0 : (currentInvested === 2 ? 0.5 : 0.2);

      if (actionId === "PL_1") {
        const gain = 20 * mult;
        if (pl) pl.morale = Math.min(100, pl.morale + gain);
        if (!ks.obtainedKnowledge.includes("PL_TECH_ANXIETY")) ks.obtainedKnowledge.push("PL_TECH_ANXIETY");
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【対PLヒアリング成功】 (効果: チーム健全性 +${gain.toFixed(0)}%)</div><div>PLから「実はこの技術スタックは経験が浅く不安がある」という本音リスクを感知しました！</div>`;
      } else if (actionId === "PL_2") {
        const gain = 15 * mult;
        if (pl) pl.morale = Math.min(100, pl.morale + gain);
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【負荷軽減の合意】 (効果: チーム健全性 +${gain.toFixed(0)}%)</div><div>無理な残業を抑える方針でPLと意気投合しました！</div>`;
      } else if (actionId === "PL_PUSH") {
        if (pl) pl.morale = Math.max(0, pl.morale - 25);
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + 10);
        resultHtml = `<div style="color:#ef4444; font-weight:700;">⚠️ 【トレードオフ発生: 現場へ押し切り】 (チーム健全性 -25%, 顧客満足度 +10%)</div><div>PLに無理を言って押し切りました……。「そんな無茶な……」とPLの士気が著しく低下しました！</div>`;
      } else if (actionId === "PL_SPECIAL") {
        const gain = 25 * mult;
        if (pl) pl.morale = Math.min(100, pl.morale + gain);
        if (!ks.obtainedKnowledge.includes("SOLUTION_STAGED_RELEASE")) ks.obtainedKnowledge.push("SOLUTION_STAGED_RELEASE");
        resultHtml = `<div style="color:#f59e0b; font-weight:700;">🌟 【インプット共有: 現場代替案の策定】 (効果: チーム健全性 +${gain.toFixed(0)}%)</div><div>顧客要望を持ち込んで相談し、現場から「段階リリースなら実現可能」という対案を引き出しました！</div>`;
      } else if (actionId === "C_1") {
        const gain = 20 * mult;
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        if (!ks.obtainedKnowledge.includes("CLIENT_REQUIREMENT")) ks.obtainedKnowledge.push("CLIENT_REQUIREMENT");
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【顧客ヒアリング成功】 (効果: 顧客満足度 +${gain.toFixed(0)}%)</div><div>顧客から「まずは主要機能の納期厳守が第一」という真のニーズを聞き出しました！</div>`;
      } else if (actionId === "C_2") {
        const gain = 15 * mult;
        proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【スコープ事前打診】 (効果: 顧客満足度 +${gain.toFixed(0)}%, 要求具体度 +1)</div><div>要件の優先順位付けについて理解を得て、要求具体度がアップしました！</div>`;
      } else if (actionId === "C_YES") {
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + 30);
        if (pl) pl.morale = Math.max(0, pl.morale - 30);
        resultHtml = `<div style="color:#ef4444; font-weight:700;">⚠️ 【トレードオフ発生: 安易な引き受け】 (顧客満足度 +30%, チーム健全性 -30%)</div><div>顧客は大喜びですが、無理な要求のしわ寄せで現場PLの士気が暴落し炎上リスクが急増しました！</div>`;
      } else if (actionId === "C_REFUSE") {
        proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
        proj.customer.satisfaction = Math.max(0, proj.customer.satisfaction - 20);
        resultHtml = `<div style="color:#ef4444; font-weight:700;">⚠️ 【トレードオフ発生: 正論での拒絶】 (要求具体度 +1, 顧客満足度 -20%)</div><div>無理なスコープを突っぱねて要件は固まり始めましたが、顧客から「冷たい対応だ」と強い不満を買いました！</div>`;
      } else if (actionId === "C_SPECIAL_STAGED") {
        const gain = 30 * mult;
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
        if (!ks.obtainedKnowledge.includes("CLIENT_AGREED_STAGED")) ks.obtainedKnowledge.push("CLIENT_AGREED_STAGED");
        resultHtml = `<div style="color:#f59e0b; font-weight:700;">🌟 【インプット提示: 段階リリース最終合意】 (効果: 顧客満足度 +${gain.toFixed(0)}%, 要求具体度 +1)</div><div>「段階リリース案」を提示し、顧客から「そこまで真剣に考えてくれたなら合意しよう」と絶賛されました！</div>`;
      } else if (actionId === "C_SPECIAL_BOSS") {
        const gain = 25 * mult;
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        resultHtml = `<div style="color:#f59e0b; font-weight:700;">🌟 【インプット提示: 社内公認ライン提示】 (効果: 顧客満足度 +${gain.toFixed(0)}%)</div><div>上司からの品質担保ラインを毅然と提示し、無理な無茶振り要求をシャットアウトしました！</div>`;
      } else if (actionId === "B_REQ_INFO") {
        const gain = 20 * mult;
        proj.managerTrust = Math.min(100, (proj.managerTrust || 60) + gain);
        proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
        if (!ks.obtainedKnowledge.includes("CLIENT_BACKGROUND_INFO")) ks.obtainedKnowledge.push("CLIENT_BACKGROUND_INFO");
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【顧客要求の詳細確認】 (効果: 上司信頼度 +${gain.toFixed(0)}%, 要求具体度 +1)</div><div>上司から「親会社のDX方針で今期中稼働が絶対命題。納期と主要UIの見栄えを重要視している」と裏事情を聞き出しました！</div>`;
      } else if (actionId === "B_CLIENT_TYPE") {
        const gain = 15 * mult;
        proj.managerTrust = Math.min(100, (proj.managerTrust || 60) + gain);
        if (!ks.obtainedKnowledge.includes("CLIENT_TYPE_KNOWN")) ks.obtainedKnowledge.push("CLIENT_TYPE_KNOWN");
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【顧客タイプの確認】 (効果: 上司信頼度 +${gain.toFixed(0)}%)</div><div>上司から「あの顧客はアイデアマンで仕様変更を後から言い出すタイプだ。防衛ラインを敷くんだぞ」と助言を受けました！</div>`;
      } else if (actionId === "B_BACKUP") {
        const gain = 15 * mult;
        proj.managerTrust = Math.min(100, (proj.managerTrust || 60) + gain);
        if (!ks.obtainedKnowledge.includes("BOSS_BACKUP")) ks.obtainedKnowledge.push("BOSS_BACKUP");
        resultHtml = `<div style="color:#10b981; font-weight:700;">🟢 【会社バックアップライン確保】 (効果: 上司信頼度 +${gain.toFixed(0)}%)</div><div>上司から「万が一炎上した際は、会社の品質担保基準を理由に防衛線に立つ」と強力な合意を得ました！</div>`;
      } else if (actionId === "B_SPECIAL_RESOURCE") {
        const gain = 30 * mult;
        proj.managerTrust = Math.min(100, (proj.managerTrust || 60) + gain);
        if (pl) pl.morale = Math.min(100, pl.morale + 20 * mult);
        if (!ks.obtainedKnowledge.includes("BOSS_RESOURCE_GRANTED")) ks.obtainedKnowledge.push("BOSS_RESOURCE_GRANTED");
        resultHtml = `<div style="color:#f59e0b; font-weight:700;">🌟 【インプット共有: 追加予算・リソース申請】 (効果: 上司信頼度 +${gain.toFixed(0)}%, チーム健全性 +20%)</div><div>掴んだ現場リスク・要求ギャップを提示し、上司から「明確な根拠だ！予備バッファ予算とシニアフォロー枠を承認する」と支援を獲得！</div>`;
      }

      ks.lastDialogLog = resultHtml;
      renderKickoffView();
    };

    document.querySelectorAll(".btn-action-item").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const actId = e.currentTarget.getAttribute("data-id");
        executeAction(actId);
      });
    });

    const btnNextMeeting = document.getElementById("btn-next-meeting");
    if (btnNextMeeting) {
      btnNextMeeting.addEventListener("click", () => {
        ks.lastDialogLog = null;
        ks.currentMeetingIndex += 1;
        if (ks.currentMeetingIndex >= ks.interviewSequence.length) {
          ks.step = 2.9;
        }
        renderKickoffView();
      });
    }
    return;
  }

  // Step 2.9: 今週の事前会議終了
  if (ks.step === 2.9) {
    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <h2 style="font-size:18px; font-weight:700; margin-bottom:12px;">✅ 今週の事前会議がすべて終了しました</h2>

        <div class="metric-box" style="margin-bottom:16px;">
          <div style="font-size:13px; margin-bottom:8px;">
            ・事前調整に費やした週数: <strong>${ks.kickoffWeeksSpent + 1} 週間目完了</strong><br>
            ・現在の契約納期: <strong>残り ${proj.deadlineWeeks} 週間</strong>
          </div>
          <div style="font-size:12px; color:var(--text-muted);">
            さらに来週も事前調整を行う場合、契約納期が1週間短くなります (納期 -1週)。<br>
            防衛ラインが十分取れている場合は、事前調整を切り上げてチームキックオフ (Step 3) へお進みください。
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button id="btn-continue-next-week" class="btn-cmd" style="padding:14px; font-size:14px; justify-content:center; border-color:#60a5fa; color:#60a5fa;">
            📅 来週も事前調整を継続する (契約納期が 1 週間減少します)
          </button>
          <button id="btn-finish-kickoff" class="btn-cmd btn-primary" style="padding:14px; font-size:15px; justify-content:center;">
            🎉 事前調整を終了し、チームキックオフ (Step 3) へ進む ▶
          </button>
        </div>
      </div>
    `;

    const btnCont = document.getElementById("btn-continue-next-week");
    if (btnCont) {
      btnCont.addEventListener("click", () => {
        ks.kickoffWeeksSpent += 1;
        proj.deadlineWeeks = Math.max(1, proj.deadlineWeeks - 1);
        ks.interviewSequence = [];
        ks.currentMeetingIndex = 0;
        ks.kickoffAp = 3;
        ks.step = 1.2;
        renderKickoffView();
      });
    }

    const btnFinish = document.getElementById("btn-finish-kickoff");
    if (btnFinish) {
      btnFinish.addEventListener("click", () => {
        ks.step = 3;
        renderKickoffView();
      });
    }
    return;
  }

  // Step 3: キックオフ決起
  if (ks.step === 3) {
    const scopeStars = Math.min(5, proj.clarityLevel + (ks.obtainedKnowledge.includes("CLIENT_AGREED_STAGED") ? 1 : 0));
    const expectationGap = Math.min(100, proj.customer.satisfaction);
    const teamSafety = Math.min(100, pl ? pl.morale : 50);

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🎉 Step 3: キックオフ決起 ＆ 防衛★診断</h2>
          </div>
        </div>

        <div class="metric-box" style="margin-bottom:16px;">
          <div style="font-size:13px; font-weight:700; color:#60a5fa; margin-bottom:6px;">🌊 🔄 デリバリー開発戦略を選択してください:</div>
          <div style="display:flex; gap:10px; margin-top:8px;">
            <button id="btn-wf" class="btn-cmd ${ks.selectedMethod === 'WATERFALL' ? 'btn-primary' : ''}" style="flex:1; justify-content:center; padding:10px;">
              🌊 ウォーターフォール型
            </button>
            <button id="btn-agile" class="btn-cmd ${ks.selectedMethod === 'AGILE' ? 'btn-primary' : ''}" style="flex:1; justify-content:center; padding:10px;">
              🔄 アジャイル型
            </button>
          </div>
        </div>

        <div class="metric-box" style="border-left:4px solid #10b981; background:rgba(16,185,129,0.08); margin-bottom:16px;">
          <div style="font-size:14px; font-weight:700; color:#10b981; margin-bottom:8px;">📊 【キックオフ防衛★診断結果】</div>
          <div style="display:flex; flex-direction:column; gap:6px; font-size:13px;">
            <div>1. 要件確定度 / スコープ防衛度: <strong>${'★'.repeat(scopeStars)} (${scopeStars}/5)</strong></div>
            <div>2. 顧客期待値ギャップ適正度: <strong>${expectationGap.toFixed(0)}%</strong></div>
            <div>3. チーム心理的安全性: <strong>${teamSafety.toFixed(0)}%</strong></div>
            <div>4. 上司信頼度: <strong>${(proj.managerTrust || 60).toFixed(0)}%</strong></div>
            <div>5. 開発本番へ引き継ぐ残り納期: <strong>${proj.deadlineWeeks} 週間</strong></div>
          </div>
        </div>

        <div class="speech-bubble" style="margin-bottom:16px; font-size:13px;">
          💬 <strong>PL ${pl ? pl.name : 'リーダー'}:</strong> 「事前調整ありがとうございます！この体制ならチーム一丸で頑張れます！」<br>
          💬 <strong>顧客 ${proj.customer.name}:</strong> 「キックオフでの方針合意、心強いよ。頼んだよ！」
        </div>

        <button id="btn-start-phase2" class="btn-cmd btn-primary" style="padding:14px; font-size:16px; width:100%; justify-content:center;">
          🚀 開発スプリント (Phase 2) へ突入！ ▶
        </button>
      </div>
    `;

    const btnWf = document.getElementById("btn-wf");
    if (btnWf) btnWf.addEventListener("click", () => { ks.selectedMethod = "WATERFALL"; renderKickoffView(); });
    const btnAgile = document.getElementById("btn-agile");
    if (btnAgile) btnAgile.addEventListener("click", () => { ks.selectedMethod = "AGILE"; renderKickoffView(); });
    const btnP2 = document.getElementById("btn-start-phase2");
    if (btnP2) btnP2.addEventListener("click", () => { proj.methodology = ks.selectedMethod; renderDashboardView(); });
    return;
  }
}

// Phase 2: ダッシュボードビュー (既存)
function renderDashboardView() {
  updateHeader();
  updatePhaseStepper("dashboard");
  const container = getContainer();
  if (!container) return;
  const proj = state.currentProject;

  container.innerHTML = `
    <div class="card" style="text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h2 style="font-size:18px; margin:0;">📊 Phase 2: 開発スプリント (WEEK ${proj.week})</h2>
        <span class="step-badge">納期: あと ${proj.deadlineWeeks} 週間</span>
      </div>

      <div style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
        開発スプリントが開始されました！ PMとして週次推進指示を出し、プロジェクトを成功に導いてください。
      </div>

      <div class="metric-box" style="margin-bottom:16px;">
        <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:13px;">
          <span>👥 顧客満足度: <strong>${proj.customer.satisfaction.toFixed(0)}%</strong></span>
          <span>🏢 上司信頼度: <strong>${(proj.managerTrust || 60).toFixed(0)}%</strong></span>
          <span>開発手法: <strong>${proj.methodology === 'WATERFALL' ? '🌊 ウォーターフォール' : '🔄 アジャイル'}</strong></span>
        </div>
      </div>

      <button id="btn-next-week" class="btn-cmd btn-primary" style="padding:12px; width:100%; justify-content:center;">
        ▶ 1週間進める (スプリント実行)
      </button>
    </div>
  `;

  const btnNext = document.getElementById("btn-next-week");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      proj.week += 1;
      proj.deadlineWeeks = Math.max(0, proj.deadlineWeeks - 1);
      if (proj.deadlineWeeks <= 0) {
        renderResultView();
      } else {
        renderDashboardView();
      }
    });
  }
}

// Phase 3: 結果発表ビュー (既存)
function renderResultView() {
  updateHeader();
  updatePhaseStepper("result");
  const container = getContainer();
  if (!container) return;
  const proj = state.currentProject;

  container.innerHTML = `
    <div class="card" style="text-align:center;">
      <h2 style="font-size:22px; color:#10b981; margin-bottom:12px;">🎉 プロジェクト完了！</h2>
      <div style="font-size:14px; margin-bottom:20px;">
        【最終結果】<br>
        ・👥 最終顧客満足度: <strong>${proj.customer.satisfaction.toFixed(0)}%</strong><br>
        ・🏢 最終上司信頼度: <strong>${(proj.managerTrust || 60).toFixed(0)}%</strong>
      </div>
      <button id="btn-restart" class="btn-cmd btn-primary" style="padding:12px 24px; font-size:15px; margin:0 auto;">
        🔄 次のプロジェクトを開始する
      </button>
    </div>
  `;

  const btnRestart = document.getElementById("btn-restart");
  if (btnRestart) {
    btnRestart.addEventListener("click", () => {
      state.projectCounter += 1;
      startNewProject();
    });
  }
}

// アプリケーション起動
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

import { PM, Team } from "./entities.js";
import {
  calculateFinalScore,
  evaluateProjectStatus,
  getInitialDeveloperPool,
  getInitialProjectData,
  processYearlyClosing,
  runWeeklySprint
} from "./engine.js";

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
  const pl = proj.team ? proj.team.leader : null;

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
            <span class="step-badge">第 ${ks.kickoffWeeksSpent + 1} ターン目 (残り納期: ${proj.deadlineWeeks} 週間)</span>
          </div>
        </div>

        <div style="background:rgba(96,165,250,0.08); border:1px solid rgba(96,165,250,0.2); padding:12px; border-radius:8px; margin-bottom:16px; font-size:13px; color:var(--text-muted);">
          ボタンを順番にクリックして、今週行う事前会議のアジェンダを組み立ててください。<br>
          ※ 1週間分（最大3つの会議）を実行するごとに<strong>契約納期が1週間減少 (`納期 -1週`)</strong>します。
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
          <button id="add-client" class="btn-cmd" style="flex:1; padding:10px; font-size:13px; justify-content:center; border-color:#60a5fa; color:#60a5fa; background:rgba(96,165,250,0.1);" ${seq.length >= 3 ? 'disabled' : ''}>
            ➕ 👥 顧客とのすり合わせ会議
          </button>
          <button id="add-pl" class="btn-cmd" style="flex:1; padding:10px; font-size:13px; justify-content:center; border-color:#10b981; color:#10b981; background:rgba(16,185,129,0.1);" ${seq.length >= 3 ? 'disabled' : ''}>
            ➕ 🛠️ PLとの打ち合わせ会議
          </button>
          <button id="add-boss" class="btn-cmd" style="flex:1; padding:10px; font-size:13px; justify-content:center; border-color:#a855f7; color:#a855f7; background:rgba(168,85,247,0.1);" ${seq.length >= 3 ? 'disabled' : ''}>
            ➕ 🏢 上司との相談会議
          </button>
        </div>

        <div class="metric-box" style="margin-bottom:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:13px; font-weight:700; color:var(--text-main);">📋 今週の予定アジェンダ:</span>
            ${seq.length > 0 ? `<button id="btn-clear-queue" style="background:none; border:none; color:#ef4444; font-size:12px; cursor:pointer;">🗑️ リセット</button>` : ''}
          </div>

          ${seq.length === 0 ? `
            <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:14px; border:1px dashed var(--border-color); border-radius:6px;">
              上のボタンを押して、今週実施する会議を順番に追加してください (最大3つ)
            </div>
          ` : `
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${seq.map((item, idx) => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color); font-size:13px;">
                  <span><strong>${idx + 1}.</strong> ${item.title}</span>
                  <span class="step-badge" style="font-size:11px;">${item.target}</span>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div style="display:flex; gap:10px;">
          <button id="btn-start-meetings" class="btn-cmd btn-primary" style="flex:2; padding:14px; font-size:15px; justify-content:center;" ${seq.length === 0 ? 'disabled' : ''}>
            🚀 設定したアジェンダで事前会議を開始！ ▶
          </button>
          <button id="btn-skip-to-kickoff" class="btn-cmd" style="flex:1; padding:14px; font-size:13px; justify-content:center; border-color:#f59e0b; color:#f59e0b;">
            🎉 事前調整を終了しキックオフへ
          </button>
        </div>
      </div>
    `;

    const addClient = document.getElementById("add-client");
    if (addClient) addClient.addEventListener("click", () => { if (seq.length < 3) { seq.push({ target: "CLIENT", title: "対 顧客との要求すり合わせ会議" }); renderKickoffView(); } });
    const addPl = document.getElementById("add-pl");
    if (addPl) addPl.addEventListener("click", () => { if (seq.length < 3) { seq.push({ target: "PL", title: "対 PLとの現場技術・負荷打ち合わせ会議" }); renderKickoffView(); } });
    const addBoss = document.getElementById("add-boss");
    if (addBoss) addBoss.addEventListener("click", () => { if (seq.length < 3) { seq.push({ target: "BOSS", title: "対 上司との防衛ライン・リソース相談会議" }); renderKickoffView(); } });

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
        opts.push({ id: "PL_1", text: "現場の本音・技術懸念のヒアリング (AP 1)" });
        opts.push({ id: "PL_2", text: "開発負荷の軽減方針について議論 (AP 1)" });
        if (ks.obtainedKnowledge.includes("CLIENT_REQUIREMENT")) {
          opts.push({ id: "PL_SPECIAL", text: "★【切り札】持ち帰った顧客要望を提示し、現場代替案を相談 (AP 1)", special: true });
        }
      } else if (target === "CLIENT") {
        opts.push({ id: "C_1", text: "顧客の真の要求・優先度 (QCD) のヒアリング (AP 1)" });
        opts.push({ id: "C_2", text: "納期・スコープ調整の事前打診 (AP 1)" });
        if (ks.obtainedKnowledge.includes("SOLUTION_STAGED_RELEASE")) {
          opts.push({ id: "C_SPECIAL_STAGED", text: "★【切り札】現場で策定した『段階リリース案』を提案・交渉 (AP 1)", special: true });
        }
        if (ks.obtainedKnowledge.includes("BOSS_BACKUP")) {
          opts.push({ id: "C_SPECIAL_BOSS", text: "★【切り札】『会社（上司）公認の品質担保ライン』を提示して説得 (AP 1)", special: true });
        }
      } else if (target === "BOSS") {
        opts.push({ id: "B_1", text: "追加予算・予備リソースの事前申請 (AP 1)" });
        opts.push({ id: "B_2", text: "炎上時の会社バックアップラインの合意 (AP 1)" });
      }
      return opts;
    };

    const options = getOptions();

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🗣️ 面談画面: ${targetName}</h2>
            <span class="step-badge">アジェンダ ${ks.currentMeetingIndex + 1} / ${ks.interviewSequence.length}</span>
          </div>
          <div style="font-size:13px; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.15); padding:4px 10px; border-radius:12px;">
            ⭐ 今週の残り AP: ${ks.kickoffAp} / 3
          </div>
        </div>

        <div style="font-size:13px; font-weight:600; color:#60a5fa; margin-bottom:8px;">
          📌 議題: ${currentMeeting.title}
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
          <div style="background:rgba(239,68,68,0.15); border:1px solid #ef4444; padding:10px 14px; border-radius:8px; color:#ef4444; font-size:12px; font-weight:600; margin-bottom:14px;">
            ⚠️ 【時間の無駄使い注意】 この相手とは既に2回議論しています。これ以上のAP投入は【効果ゼロ (+0%)】となります！
          </div>
        ` : ""}

        <div id="dialog-log" style="background:rgba(0,0,0,0.3); border:1px solid var(--border-color); padding:12px; border-radius:8px; min-height:70px; margin-bottom:16px; font-size:13px;">
          💬 会議での対話アクションを選択してください。
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${options.map(opt => `
            <button class="btn-cmd btn-action-item" data-id="${opt.id}" style="padding:10px 14px; font-size:13px; text-align:left; justify-content:flex-start; ${opt.special ? 'border-color:#f59e0b; background:rgba(245,158,11,0.1); color:#f59e0b; font-weight:700;' : ''}">
              ${opt.text}
            </button>
          `).join('')}

          <button id="btn-next-meeting" class="btn-cmd" style="padding:10px 14px; font-size:13px; margin-top:8px; justify-content:center; background:rgba(255,255,255,0.05);">
            ▶ 次のアジェンダへ進む (AP消費なし)
          </button>
        </div>
      </div>
    `;

    const executeAction = (actionId) => {
      if (ks.kickoffAp <= 0) return;

      ks.kickoffAp -= 1;
      const currentInvested = (ks.interviewApInvested[target] || 0) + 1;
      ks.interviewApInvested[target] = currentInvested;

      const logBox = document.getElementById("dialog-log");

      if (currentInvested >= 3) {
        if (logBox) {
          logBox.innerHTML = `
            <div style="color:#ef4444; font-weight:700;">🚨 【時間の浪費】</div>
            <div>議論は完全に平行線です……。時間（AP）だけが無駄に消費され、パラメータは一切伸びませんでした (+0%)！</div>
          `;
        }
        renderKickoffView();
        return;
      }

      const mult = currentInvested === 1 ? 1.0 : 0.5;

      if (actionId === "PL_1") {
        const gain = 20 * mult;
        if (pl) pl.morale = Math.min(100, pl.morale + gain);
        if (!ks.obtainedKnowledge.includes("PL_TECH_ANXIETY")) ks.obtainedKnowledge.push("PL_TECH_ANXIETY");
        if (logBox) logBox.innerHTML = `<div style="color:#10b981; font-weight:700;">🟢 【対PLヒアリング成功】 (効果: +${gain.toFixed(0)}%)</div><div>PLから「実はこの技術スタックは経験が浅く不安がある」という本音リスクを感知しました！</div>`;
      } else if (actionId === "PL_2") {
        const gain = 15 * mult;
        if (pl) pl.morale = Math.min(100, pl.morale + gain);
        if (logBox) logBox.innerHTML = `<div style="color:#10b981; font-weight:700;">🟢 【負荷軽減の合意】 (効果: +${gain.toFixed(0)}%)</div><div>無理な残業を抑える方針でPLと意気投合しました！</div>`;
      } else if (actionId === "PL_SPECIAL") {
        const gain = 25 * mult;
        if (pl) pl.morale = Math.min(100, pl.morale + gain);
        if (!ks.obtainedKnowledge.includes("SOLUTION_STAGED_RELEASE")) ks.obtainedKnowledge.push("SOLUTION_STAGED_RELEASE");
        if (logBox) logBox.innerHTML = `<div style="color:#f59e0b; font-weight:700;">🌟 【切り札発動: 現場代替案の策定】 (効果: +${gain.toFixed(0)}%)</div><div>顧客要望を持ち込んで相談し、現場から「段階リリースなら実現可能」という対案を引き出しました！</div>`;
      } else if (actionId === "C_1") {
        const gain = 20 * mult;
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        if (!ks.obtainedKnowledge.includes("CLIENT_REQUIREMENT")) ks.obtainedKnowledge.push("CLIENT_REQUIREMENT");
        if (logBox) logBox.innerHTML = `<div style="color:#10b981; font-weight:700;">🟢 【顧客ヒアリング成功】 (効果: +${gain.toFixed(0)}%)</div><div>顧客から「まずは主要機能の納期厳守が第一」という真のニーズを聞き出しました！</div>`;
      } else if (actionId === "C_2") {
        const gain = 15 * mult;
        proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        if (logBox) logBox.innerHTML = `<div style="color:#10b981; font-weight:700;">🟢 【スコープ事前打診】 (効果: +${gain.toFixed(0)}%)</div><div>要件の優先順位付けについて理解を得て、要求具体度がアップしました！</div>`;
      } else if (actionId === "C_SPECIAL_STAGED") {
        const gain = 30 * mult;
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
        if (!ks.obtainedKnowledge.includes("CLIENT_AGREED_STAGED")) ks.obtainedKnowledge.push("CLIENT_AGREED_STAGED");
        if (logBox) logBox.innerHTML = `<div style="color:#f59e0b; font-weight:700;">🌟 【切り札発動: 段階リリース最終合意】 (効果: +${gain.toFixed(0)}%)</div><div>「段階リリース案」を提示し、顧客から「そこまで真剣に考えてくれたなら合意しよう」と絶賛されました！</div>`;
      } else if (actionId === "C_SPECIAL_BOSS") {
        const gain = 25 * mult;
        proj.customer.satisfaction = Math.min(100, proj.customer.satisfaction + gain);
        if (logBox) logBox.innerHTML = `<div style="color:#f59e0b; font-weight:700;">🌟 【切り札発動: 社内公認ライン提示】 (効果: +${gain.toFixed(0)}%)</div><div>上司からの品質担保ラインを毅然と提示し、無理な無茶振り要求をシャットアウトしました！</div>`;
      } else if (actionId === "B_1" || actionId === "B_2") {
        const gain = 20 * mult;
        proj.managerTrust = Math.min(100, (proj.managerTrust || 60) + gain);
        if (!ks.obtainedKnowledge.includes("BOSS_BACKUP")) ks.obtainedKnowledge.push("BOSS_BACKUP");
        if (logBox) logBox.innerHTML = `<div style="color:#10b981; font-weight:700;">🟢 【上司防衛線ライン確保】 (効果: +${gain.toFixed(0)}%)</div><div>上司との合意を取りつけ、社内評価・防衛バックアップラインが強化されました！</div>`;
      }

      setTimeout(() => {
        renderKickoffView();
      }, 1000);
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

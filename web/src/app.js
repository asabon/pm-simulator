import { PM, Team } from "./entities.js";
import {
  calculateFinalScore,
  calculateKickoffDiagnosis,
  evaluateKickoffAction,
  evaluateProjectStatus,
  getInitialDeveloperPool,
  getInitialProjectData,
  KICKOFF_ACTIONS,
  processYearlyClosing,
  runWeeklySprint,
  STEP1_ASSESSMENT_CARDS
} from "./engine.js?v=2";

// アプリケーション状態管理
const state = {
  pm: new PM(3),
  developerPool: [],
  currentProject: null,
  tasks: [],
  projectCounter: 1,
  logs: [],
  kickoffState: {
    step: 1, // 1: ヒアリング, 2: アクションネゴ, 3: 手法選定, 4: チーム決起＆診断
    heardCustomer: false,
    heardPl: false,
    assessmentCards: [], // Step 1 選択済み初期確認カード
    actionHistory: [],
    kickoffAp: 3,
    selectedMethod: null,
    diagnosis: null
  }
};

// DOM 要素
const container = document.getElementById("app-container");
const elCareerYears = document.getElementById("pm-career-years");
const elCompletedPjs = document.getElementById("pm-completed-pjs");
const elPmAp = document.getElementById("pm-ap");

// 初期化
function init() {
  state.developerPool = getInitialDeveloperPool();
  startNewProject();
}

function updateHeader() {
  elCareerYears.textContent = state.pm.careerYears;
  elCompletedPjs.textContent = state.pm.completedProjects;
  elPmAp.textContent = state.pm.ap;
}

function updatePhaseStepper(phase) {
  const kickoff = document.getElementById("step-kickoff");
  const dashboard = document.getElementById("step-dashboard");
  const result = document.getElementById("step-result");

  if (kickoff) kickoff.classList.toggle("active", phase === "kickoff");
  if (dashboard) dashboard.classList.toggle("active", phase === "dashboard");
  if (result) result.classList.toggle("active", phase === "result");
}

// 1. キックオフフェーズの表示
function startNewProject() {
  const { project, tasks } = getInitialProjectData(state.projectCounter);
  state.currentProject = project;
  state.tasks = tasks;
  state.logs = [];
  state.kickoffState = {
    step: 1,
    heardCustomer: false,
    heardPl: false,
    assessmentCards: [],
    actionHistory: [],
    kickoffAp: 3,
    selectedMethod: null,
    diagnosis: null
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
  const proj = state.currentProject;
  const ks = state.kickoffState;

  if (ks.step === 1) {
    // Step 1: 情報収集（無料ヒアリング & 初期アセスメントカード）
    const allHeard = ks.heardCustomer && ks.heardPl;
    const cardsChecked = ks.assessmentCards || [];
    const arch = proj.customerArchetype;

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🚀 キックオフフェーズ</h2>
            <span class="step-badge">Step 1/3: 初期アセスメント ＆ ヒアリング</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);">
            <span style="background:rgba(245,158,11,0.15); padding:2px 8px; border-radius:6px; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; font-weight:600;">📅 第 ${state.projectCounter} 期</span>
            <span>案件: <strong>${proj.name}</strong></span>
          </div>
        </div>

        <!-- 1. 前提インプット: 上司のアサイン指示 -->
        <div class="metric-box" style="margin-bottom:16px; border-left:3px solid #60a5fa;">
          <div style="font-size:13px; font-weight:700; color:#60a5fa; margin-bottom:4px;">🏢 上司からのミッション指示 (前提条件):</div>
          <div style="font-size:13px;">
            💬 <strong>上司:</strong> 「今回のプロジェクトは社内の注力案件だ。トラブルを起こさず【<strong>${proj.priorityExpectation} 重視（障害・過労の防止）</strong>】で頼むぞ！」
          </div>
        </div>

        <!-- 🛠️ デバッグ表示: 隠しパラメータのリアルタイム可視化 -->
        <div class="metric-box" style="background:rgba(239, 68, 68, 0.08); border:1px dashed rgba(239, 68, 68, 0.4); margin-bottom:16px; padding:10px 14px;">
          <div style="font-size:12px; font-weight:700; color:#ef4444; margin-bottom:4px; display:flex; justify-content:space-between;">
            <span>🛠️ 【デバッグ表示】 隠しパラメータリアルタイム可視化</span>
            <span style="font-size:11px; opacity:0.8;">※検証用</span>
          </div>
          <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:12px; color:var(--text-muted);">
            <span>👤 隠れ顧客タイプ: <strong style="color:var(--text-main);">${arch ? arch.name : "未判定"}</strong></span>
            <span>🏢 上司信頼度: <strong style="color:var(--text-main);">${proj.managerTrust || 60}%</strong></span>
            <span>❓ 初期確認カード: <strong style="color:var(--text-main);">${cardsChecked.length} / 2 枚選択済</strong></span>
          </div>
        </div>

        <p style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
          顧客・PLへの無料ヒアリングを行い相手のタイプを調査してください。ウェルカム期の今なら<strong>初期確認カード（最大2枚）</strong>でリスクを完全看破できます！
        </p>

        <div style="display:flex; flex-direction:column; gap:16px;">
          <!-- 顧客 -->
          <div class="metric-box">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>👤 顧客の要求スタンス</strong>
              <button class="btn-cmd" id="btn-hear-customer" style="padding:6px 14px; font-size:13px; min-height:36px;">
                ${ks.heardCustomer ? "✓ ヒアリング済み" : "👂 ヒアリングする"}
              </button>
            </div>
            ${ks.heardCustomer ? `
              <div class="speech-bubble">
                💬 <strong>顧客:</strong> 「${proj.customerArchetype ? proj.customerArchetype.hint : "しっかり頼むよ！"}」
                <div style="margin-top:6px; font-size:12px; color:var(--accent-warning); font-weight:600;">
                  ⚠️ 【プロファイリング察知】 顧客の口調から隠れタイプ（こだわり型/丸投げ型/納期死守型）を推測しよう！
                </div>
              </div>
            ` : ""}
          </div>

          <!-- PL -->
          <div class="metric-box">
            <div style="display:flex; justify-content:space-between; align-items:center;">
              <strong>🛠️ 担当PLの見通し</strong>
              <button class="btn-cmd" id="btn-hear-pl" style="padding:6px 14px; font-size:13px; min-height:36px;">
                ${ks.heardPl ? "✓ ヒアリング済み" : "👂 ヒアリングする"}
              </button>
            </div>
            ${ks.heardPl ? `
              <div class="speech-bubble">
                💬 <strong>PL:</strong> 「要件がふわふわな上に品質も納期も完璧なんて絶対無理です！ このまま開発に入ったら確実に終盤で大炎上しますよ……！」
              </div>
            ` : ""}
          </div>

          <!-- 初期アセスメントカード群 (ウェルカム期・最大2枚) -->
          ${allHeard ? `
            <div class="metric-box" style="border:1px solid rgba(96,165,250,0.4); background:rgba(96,165,250,0.05);">
              <div style="font-weight:700; font-size:13px; color:#60a5fa; margin-bottom:8px; display:flex; justify-content:space-between;">
                <span>❓ 初期深掘り確認カード (選択済み: ${cardsChecked.length} / 2枚)</span>
                <span style="font-size:12px; color:var(--accent-success); font-weight:600;">✨ 完全無料・ウェルカム期特別枠</span>
              </div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${Object.values(STEP1_ASSESSMENT_CARDS).map(card => {
                  const isChecked = cardsChecked.includes(card.id);
                  const isMax = cardsChecked.length >= 2 && !isChecked;
                  return `
                    <div style="background:var(--card-bg); border:1px solid var(--border-color); padding:10px; border-radius:8px;">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                          <strong style="font-size:13px;">${card.name}</strong> (${card.target})
                          <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${card.desc}</div>
                        </div>
                        <button class="btn-cmd" id="btn-card-${card.id}" ${isChecked || isMax ? "disabled" : ""} style="padding:4px 12px; font-size:12px; min-height:30px;">
                          ${isChecked ? "✓ 確認済み" : "❓ 質問する"}
                        </button>
                      </div>
                      ${isChecked ? `
                        <div class="speech-bubble" style="margin-top:8px; font-size:12px; color:#60a5fa;">
                          ${card.getSpeech(proj)}
                        </div>
                      ` : ""}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ""}
        </div>

        <button id="btn-to-step2" class="btn-cmd btn-primary" style="margin-top:20px; padding:14px; font-size:16px; width:100%; justify-content:center;" ${allHeard ? "" : "disabled"}>
          ${allHeard ? "初期アセスメント完了！ 事前調整 ＆ ネゴシエーション(Step 2)へ進む ▶" : "顧客とPLへヒアリングしてください"}
        </button>
      </div>
    `;

    const btnCust = document.getElementById("btn-hear-customer");
    if (btnCust) btnCust.addEventListener("click", () => { ks.heardCustomer = true; renderKickoffView(); });
    const btnPl = document.getElementById("btn-hear-pl");
    if (btnPl) btnPl.addEventListener("click", () => { ks.heardPl = true; renderKickoffView(); });
    const btnTo2 = document.getElementById("btn-to-step2");
    if (btnTo2 && allHeard) {
      btnTo2.addEventListener("click", () => { ks.step = 2; renderKickoffView(); });
    }

    Object.values(STEP1_ASSESSMENT_CARDS).forEach(card => {
      const btn = document.getElementById(`btn-card-${card.id}`);
      if (btn) {
        btn.addEventListener("click", () => {
          if (ks.assessmentCards.length < 2 && !ks.assessmentCards.includes(card.id)) {
            ks.assessmentCards.push(card.id);
            if (card.id === "CARD_BOSS") {
              proj.managerTrust = Math.min(100, (proj.managerTrust || 60) + 5);
            }
            renderKickoffView();
          }
        });
      }
    });

  } else if (ks.step === 2) {
    // Step 2: 事前調整 ＆ ネゴシエーション (AP 3消費)
    const history = ks.actionHistory;
    const apLeft = ks.kickoffAp;
    const arch = proj.customerArchetype;

    const categories = [
      { key: "CLIENT", name: "🤝 対顧客交渉 (CLIENT)", color: "#60a5fa" },
      { key: "BOSS", name: "🏢 対上司交渉 (BOSS)", color: "#a78bfa" },
      { key: "TEAM", name: "🛠️ 対現場調整 (TEAM)", color: "#34d399" }
    ];

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🚀 キックオフフェーズ</h2>
            <span class="step-badge">Step 2/3: 事前調整 ＆ ネゴ</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);">
            <span style="background:rgba(245,158,11,0.15); padding:2px 8px; border-radius:6px; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; font-weight:600;">📅 第 ${state.projectCounter} 期</span>
            <span class="ap-tag">AP: ${apLeft} / 3</span>
          </div>
        </div>
        <p style="font-size:14px; color:var(--text-muted); margin-bottom:16px;">
          有限な AP（残り ${apLeft}）を使い交渉を選択してください。<strong>※顧客タイプや上司信頼度、実行順序によって反応が動的に分岐します！ Step 1で確認せずに前提質問を行うと「今さら感ペナルティ」が発生します。</strong>
        </p>

        <!-- 🛠️ デバッグ表示: 隠しパラメータのリアルタイム可視化 -->
        <div class="metric-box" style="background:rgba(239, 68, 68, 0.08); border:1px dashed rgba(239, 68, 68, 0.4); margin-bottom:16px; padding:10px 14px;">
          <div style="font-size:12px; font-weight:700; color:#ef4444; margin-bottom:4px; display:flex; justify-content:space-between;">
            <span>🛠️ 【デバッグ表示】 隠しパラメータリアルタイム可視化</span>
            <span style="font-size:11px; opacity:0.8;">※検証用</span>
          </div>
          <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:12px; color:var(--text-muted);">
            <span>👤 隠れ顧客タイプ: <strong style="color:var(--text-main);">${arch ? arch.name : "未判定"}</strong></span>
            <span>🏢 上司信頼度: <strong style="color:var(--text-main);">${proj.managerTrust || 60}%</strong></span>
            <span>❓ 確認カード選択数: <strong style="color:var(--text-main);">${(ks.assessmentCards || []).length} / 2 枚選択済</strong></span>
          </div>
        </div>

        <!-- 選択された履歴とログ -->
        <div class="metric-box" style="margin-bottom:16px; min-height:70px;">
          <div style="font-weight:600; font-size:13px; color:#60a5fa; margin-bottom:6px;">実行アクション履歴 (最大3つ):</div>
          ${history.length === 0 ? '<p style="font-size:13px; color:var(--text-dim);">まだアクションを選択していません。</p>' : ''}
          ${history.map((actId, idx) => {
            const evalRes = evaluateKickoffAction(history.slice(0, idx), actId, state.currentProject, state.kickoffState);
            const actInfo = KICKOFF_ACTIONS[actId];
            return `
              <div style="margin-bottom:8px; border-bottom:1px dashed var(--border-color); padding-bottom:6px;">
                <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:600;">
                  <span>${idx + 1}手目: ${actInfo.name}</span>
                  ${evalRes.synergyName ? `<span class="synergy-badge">${evalRes.synergyName}</span>` : ''}
                </div>
                <div class="speech-bubble" style="margin-top:4px; font-size:13px;">
                  💬 <strong>${evalRes.speaker}:</strong> 「${evalRes.comment}」
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- カテゴリ分けされたコマンドボタン群 -->
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${categories.map(cat => {
            const actions = Object.values(KICKOFF_ACTIONS).filter(a => a.category === cat.key);
            return `
              <div class="category-group">
                <div class="category-title" style="color:${cat.color};">${cat.name}</div>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:10px;">
                  ${actions.map(act => {
                    const isDisabled = apLeft < 1 || history.includes(act.id);
                    const tagHtml = (act.tags || []).map(t => {
                      const isDanger = t.includes("-") || t.includes("リスク") || t.includes("疲労") || t.includes("微減");
                      const isSuccess = t.includes("UP") || t.includes("確度") || t.includes("強化") || t.includes("減") || t.includes("防止") || t.includes("確保") || t.includes("低減");
                      const cls = isDanger ? "tag-badge-danger" : (isSuccess ? "tag-badge-success" : "");
                      return `<span class="tag-badge ${cls}">${t}</span>`;
                    }).join(" ");

                    return `
                      <button class="btn-cmd" id="act-${act.id}" ${isDisabled ? "disabled" : ""} style="flex-direction:column; align-items:flex-start; gap:6px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; width:100%; align-items:center;">
                          <span style="font-weight:600; font-size:14px;">${act.name}</span>
                        </div>
                        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
                          ${tagHtml}
                        </div>
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <button id="btn-to-step3" class="btn-cmd btn-primary" style="margin-top:20px; padding:14px; font-size:16px; width:100%; justify-content:center;" ${apLeft === 0 || history.length >= 3 ? "" : ""}>
          ${apLeft === 0 ? "AP使い切り！ デリバリー戦略(推進方針)の宣言(Step 3)へ ▶" : "デリバリー戦略(推進方針)の宣言(Step 3)へ進む ▶"}
        </button>
      </div>
    `;

    Object.keys(KICKOFF_ACTIONS).forEach(actId => {
      const btn = document.getElementById(`act-${actId}`);
      if (btn) {
        btn.addEventListener("click", () => {
          if (ks.kickoffAp >= 1 && !ks.actionHistory.includes(actId)) {
            ks.kickoffAp -= 1;
            ks.actionHistory.push(actId);
            renderKickoffView();
          }
        });
      }
    });

    document.getElementById("btn-to-step3").addEventListener("click", () => {
      ks.step = 3;
      renderKickoffView();
    });

  } else if (ks.step === 3) {
    // Step 3: デリバリー戦略宣言 (開発手法選択)
    const selectedMethod = ks.selectedMethod || "WATERFALL";

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🚀 キックオフフェーズ</h2>
            <span class="step-badge">Step 3/3: 戦略宣言</span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);">
            <span style="background:rgba(245,158,11,0.15); padding:2px 8px; border-radius:6px; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; font-weight:600;">📅 第 ${state.projectCounter} 期</span>
            <span>案件: <strong>${proj.name}</strong></span>
          </div>
        </div>
        <p style="font-size:14px; color:var(--text-muted); margin-bottom:16px;">
          関係者とのヒアリング・事前交渉結果を踏まえ、PMとして本プロジェクトのデリバリー戦略（推進方針）を宣言・選定してください。
        </p>

        <!-- 開発手法カード選定 -->
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:20px;">
          <div class="method-card ${selectedMethod === 'WATERFALL' ? 'selected' : ''}" id="card-wf">
            <div style="font-size:18px; font-weight:700;">🌊 ウォーターフォール開発</div>
            <div style="font-size:13px; color:var(--text-muted);">
              事前計画と一括テストを徹底。開発消化スピード <strong>+30% (爆速)</strong> ＆ 社内評価が高い。<br>
              <span style="color:#60a5fa;">💡 特徴: 要件が固まった案件で真価を発揮。(※途中の仕様変更手戻り注意)</span>
            </div>
          </div>

          <div class="method-card ${selectedMethod === 'AGILE' ? 'selected' : ''}" id="card-agile">
            <div style="font-size:18px; font-weight:700;">🔄 アジャイル開発</div>
            <div style="font-size:13px; color:var(--text-muted);">
              プロトタイプ試作で対話し、<strong>途中の仕様変更・手戻りに極めて強い</strong>。<br>
              <span style="color:#60a5fa;">💡 特徴: 顧客要件が不鮮明な案件で真価を発揮。(※消化スピード -15%)</span>
            </div>
          </div>
        </div>

        <button id="btn-to-rally" class="btn-cmd btn-primary" style="margin-top:20px; padding:16px; font-size:18px; width:100%; justify-content:center;">
          🔥 チームキックオフ決起 ＆ 防衛★診断へ進む ▶
        </button>
      </div>
    `;

    document.getElementById("card-wf").addEventListener("click", () => {
      ks.selectedMethod = "WATERFALL";
      renderKickoffView();
    });
    document.getElementById("card-agile").addEventListener("click", () => {
      ks.selectedMethod = "AGILE";
      renderKickoffView();
    });

    document.getElementById("btn-to-rally").addEventListener("click", () => {
      ks.step = 4;
      renderKickoffView();
    });

  } else if (ks.step === 4) {
    // Step 4 (最終クライマックス): 🔥 チームキックオフ決起 ＆ 防衛★診断
    const selectedMethod = ks.selectedMethod || "WATERFALL";
    const diagnosis = calculateKickoffDiagnosis(proj, ks.actionHistory, selectedMethod);
    ks.diagnosis = diagnosis;

    const renderStars = (count) => "★".repeat(count) + "☆".repeat(5 - count);

    container.innerHTML = `
      <div class="card" style="text-align:left;">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <h2 style="font-size:18px; font-weight:700; margin:0;">🚀 キックオフフェーズ</h2>
            <span class="step-badge" style="background:rgba(239, 68, 68, 0.2); color:#fca5a5; border-color:rgba(239, 68, 68, 0.4);">
              🔥 チーム決起 ＆ キックオフ完了
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);">
            <span style="background:rgba(245,158,11,0.15); padding:2px 8px; border-radius:6px; border:1px solid rgba(245,158,11,0.4); color:#f59e0b; font-weight:600;">📅 第 ${state.projectCounter} 期</span>
            <span>案件: <strong>${proj.name}</strong></span>
          </div>
        </div>

        <p style="font-size:14px; color:var(--text-muted); margin-bottom:16px;">
          事前交渉と推進方針の宣言を終え、チーム全員でプロジェクトのキックオフ決起を行います！
        </p>

        <!-- チーム決起スピーチバルーン -->
        <div class="speech-bubble" style="margin-bottom:20px; padding:16px; background:linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%); border:1px solid #60a5fa;">
          <div style="font-size:15px; font-weight:700; color:#60a5fa; margin-bottom:6px;">
            🗣️ ${diagnosis.rallySpeech.speaker} からの決起宣言:
          </div>
          <div style="font-size:14px; line-height:1.6;">
            ${diagnosis.rallySpeech.speech}
          </div>
        </div>

        <!-- 診断サマリーカード -->
        <div class="diagnosis-card" style="margin-bottom:20px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:10px; margin-bottom:12px;">
            <span style="font-weight:700; font-size:16px; color:#60a5fa;">🛡️ キックオフ防衛ライン診断結果</span>
            <span style="font-size:24px; font-weight:900; color:#f59e0b;">ランク ${diagnosis.rank}</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px;">
            <div style="display:flex; justify-content:space-between; font-size:14px;">
              <span>${selectedMethod === 'WATERFALL' ? '📋 要件確定度・計画精度' : '🔄 スプリント適応・柔軟性'}</span>
              <span class="star-rating">${renderStars(diagnosis.planHealthStars)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:14px;">
              <span>🤝 期待値ギャップ (対顧客/上司)</span>
              <span class="star-rating">${renderStars(diagnosis.expectationGapStars)}</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:14px;">
              <span>🔥 チーム安全度 (キャパ/士気)</span>
              <span class="star-rating">${renderStars(diagnosis.teamSafetyStars)}</span>
            </div>
          </div>

          <div style="font-size:13px; background:rgba(0,0,0,0.3); padding:10px; border-radius:var(--radius-sm); border-left:3px solid #60a5fa;">
            💬 <strong>PM総評:</strong> ${diagnosis.summaryComment}
          </div>
        </div>

        <button id="btn-start-dashboard" class="btn-cmd btn-primary" style="padding:16px; font-size:18px; width:100%; justify-content:center;">
          🔥 全員一致団結！ 開発スプリント（第2フェーズ）を開始 ▶
        </button>
      </div>
    `;

    document.getElementById("btn-start-dashboard").addEventListener("click", () => {
      renderDashboardView();
    });
  }
}

// 2. メイン開発ダッシュボードの表示
function renderDashboardView() {
  updateHeader();
  updatePhaseStepper("dashboard");
  const proj = state.currentProject;
  const status = evaluateProjectStatus(proj, state.tasks);

  if (status !== "IN_PROGRESS") {
    renderResultView(status);
    return;
  }

  // 全体進捗率の計算
  const totalHours = state.tasks.filter(t => !t.id.startsWith("BUG_FIX_")).reduce((sum, t) => sum + t.estimatedHours, 0);
  const completedHours = state.tasks.filter(t => !t.id.startsWith("BUG_FIX_")).reduce((sum, t) => sum + (t.estimatedHours * (t.progress / 100.0)), 0);
  const overallProgress = totalHours > 0 ? (completedHours / totalHours * 100.0) : 0;

  const pl = proj.mainTeam.leader;
  const devs = proj.mainTeam.members;

  container.innerHTML = `
    <div class="grid-2col">
      <!-- 左カラム: プロジェクトステータス -->
      <div class="card">
        <h2 class="card-title">📊 WEEK ${proj.week} - プロジェクト進捗状況</h2>
        <div class="grid-metrics">
          <div class="metric-box">
            <div class="metric-label">契約納期</div>
            <div class="metric-value" style="color:${proj.deadlineWeeks <= 1 ? 'var(--accent-danger)' : 'var(--text-main)'}">
              あと ${proj.deadlineWeeks} 週間
            </div>
          </div>
          <div class="metric-box">
            <div class="metric-label">総バグ数</div>
            <div class="metric-value" style="color:${proj.reportedBugs > 0 ? 'var(--accent-warning)' : 'var(--accent-green)'}">
              ${proj.reportedBugs} 件
            </div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; font-size:14px;">
            <span>全体プロジェクト進捗率</span>
            <strong>${overallProgress.toFixed(1)}%</strong>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill fill-primary" style="width:${overallProgress}%;"></div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; font-size:14px;">
            <span>顧客満足度 (${proj.customer.name})</span>
            <strong>${proj.customer.satisfaction.toFixed(0)}%</strong>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill fill-success" style="width:${proj.customer.satisfaction}%;"></div>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; font-size:14px;">
            <span>上司信頼度</span>
            <strong>${proj.managerSatisfaction.toFixed(0)}%</strong>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill fill-warning" style="width:${proj.managerSatisfaction}%;"></div>
          </div>
        </div>
      </div>

      <!-- 右カラム: 現場報告 ＆ PMコマンド -->
      <div class="card">
        <h2 class="card-title">🗣️ 現場PLからの報告 ＆ 指示コマンド</h2>
        <div class="metric-box" style="margin-bottom:16px;">
          <p style="font-size:13px; color:var(--text-muted);">担当PL: ${pl ? pl.name : "なし"} | 現在の方針: <strong style="color:#60a5fa;">${proj.direction === 'SPEED' ? '進捗優先' : '標準'}</strong></p>
          <p style="margin-top:4px; font-style:italic;">「今週も現場のチームメンバーをしっかりサポートしていきましょう。」</p>
        </div>

        <div class="command-panel">
          <button class="btn-cmd" id="cmd-speed">
            <span>⚡ 1. 進捗優先スプリント指示</span>
            <span style="font-size:12px; color:var(--text-muted);">AP消費 0</span>
          </button>
          <button class="btn-cmd" id="cmd-req" ${state.pm.ap < 1 ? 'disabled' : ''}>
            <span>🗣️ 2. PLと要件・顧客対話の整理</span>
            <span style="font-size:12px; color:#60a5fa;">AP消費 1</span>
          </button>
          <button class="btn-cmd" id="cmd-1on1" ${state.pm.ap < 1 ? 'disabled' : ''}>
            <span>☕ 3. PLと1on1・メンタルケア実施</span>
            <span style="font-size:12px; color:#60a5fa;">AP消費 1</span>
          </button>
          <button class="btn-cmd btn-primary" id="cmd-next" style="margin-top:8px;">
            <span>⏩ 4. ターンを進める (次週へ) ▶</span>
          </button>
        </div>
      </div>
    </div>

    <!-- チームメンバー一覧 -->
    <div class="card">
      <h2 class="card-title">👥 現場チームメンバー稼働状況</h2>
      <div class="member-list">
        ${devs.map(dev => {
          const fColor = dev.fatigue >= 70 ? 'color:var(--accent-danger)' : (dev.fatigue >= 40 ? 'color:var(--accent-warning)' : 'color:var(--accent-green)');
          return `
            <div class="member-card">
              <div class="member-header">
                <span class="member-name">${dev.name}</span>
                <span class="role-badge role-dev">DEV</span>
              </div>
              <p style="font-size:13px; color:var(--text-muted);">${dev.statusDisplay}</p>
              <div style="font-size:13px; font-weight:600; ${fColor}">
                疲労度: ${dev.fatigue.toFixed(0)} / 100
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- 実行ログ -->
    <div class="card">
      <h2 class="card-title">📜 週次スプリント実行ログ</h2>
      <div class="log-box" id="log-box">
        ${state.logs.length === 0 ? '<div class="log-item" style="color:var(--text-dim);">ログはまだありません。コマンドを選択して週を進めてください。</div>' : ''}
        ${state.logs.map(l => `<div class="log-item">${l}</div>`).join('')}
      </div>
    </div>
  `;

  // イベントバインド
  document.getElementById("cmd-speed").addEventListener("click", () => {
    proj.direction = "SPEED";
    addLog(`➔ PLへ「進捗優先」のスプリント指示を出しました。`);
    renderDashboardView();
  });

  document.getElementById("cmd-req").addEventListener("click", () => {
    if (state.pm.ap >= 1) {
      state.pm.ap -= 1;
      proj.customer.satisfaction = Math.min(100.0, proj.customer.satisfaction + 10.0);
      proj.clarityLevel = Math.min(5, proj.clarityLevel + 1);
      addLog(`➔ PLと要件を整理し、顧客対話を強化しました！ (満足度 +10)`);
      renderDashboardView();
    }
  });

  document.getElementById("cmd-1on1").addEventListener("click", () => {
    if (state.pm.ap >= 1) {
      state.pm.ap -= 1;
      proj.getAllDevelopers().forEach(dev => {
        dev.fatigue = Math.max(0.0, dev.fatigue - 20.0);
        dev.morale = Math.min(100.0, dev.morale + 15.0);
      });
      addLog(`➔ PLと1on1を実施し、チーム全体の疲労を緩和しました！ (疲労 -20)`);
      renderDashboardView();
    }
  });

  document.getElementById("cmd-next").addEventListener("click", () => {
    const weeklyLogs = runWeeklySprint(proj, state.tasks, new Set(), state.pm);
    state.logs = weeklyLogs.concat(state.logs);
    renderDashboardView();
  });

  // ログスクロール
  const logBox = document.getElementById("log-box");
  if (logBox) logBox.scrollTop = 0;
}

function addLog(msg) {
  state.logs.unshift(msg);
}

// 3. リザルト ＆ クロージング画面
function renderResultView(status) {
  updateHeader();
  updatePhaseStepper("result");
  const proj = state.currentProject;
  const scoreInfo = calculateFinalScore(proj, state.pm);
  const closingLogs = processYearlyClosing(state.pm, state.developerPool);

  let title = "";
  let icon = "";
  let message = "";

  if (status === "SUCCESS") {
    icon = "🎉";
    title = "プロジェクト成功！";
    message = `納期内にすべての開発タスクを納品し、顧客 ${proj.customer.name} から感謝の言葉を受け取りました！`;
  } else if (status === "FAILED_DEADLINE") {
    icon = "🚨";
    title = "プロジェクト失敗: 納期超過";
    message = "契約納期までに開発が完了せず、炎上案件となってしまいました……。";
  } else if (status === "FAILED_OVERWORK") {
    icon = "💥";
    title = "プロジェクト失敗: 現場崩壊・過労";
    message = "過半数のメンバーが極度な過労・不満に陥り、開発体制が崩壊しました……。";
  } else {
    icon = "❌";
    title = "プロジェクト失敗: 契約解除";
    message = "顧客満足度が低下し、契約が打ち切られてしまいました……。";
  }

  container.innerHTML = `
    <div class="card overlay-screen">
      <div style="font-size:64px;">${icon}</div>
      <h2 style="font-size:28px; font-weight:700;">${title}</h2>
      <p style="color:var(--text-muted); max-width:500px;">${message}</p>

      <div style="margin:20px 0;">
        <div style="font-size:14px; color:var(--text-muted);">総合評価ランク</div>
        <div class="result-rank">${scoreInfo.rank}</div>
        <p style="font-size:18px; font-weight:700; margin-top:8px;">総合評価スコア: ${scoreInfo.totalScore} / 100 点</p>
      </div>

      <div class="metric-box" style="text-align:left; width:100%; max-width:500px;">
        <p style="font-weight:600; margin-bottom:8px;">📊 評価内訳サマリー:</p>
        <p>・顧客満足度スコア: <strong>${scoreInfo.customerScore} 点</strong></p>
        <p>・社内上司評価スコア: <strong>${scoreInfo.managerScore} 点</strong></p>
        <p>・チーム健全性スコア: <strong>${scoreInfo.teamScore} 点</strong> (平均疲労: ${scoreInfo.avgFatigue})</p>
      </div>

      <div class="metric-box" style="text-align:left; width:100%; max-width:500px;">
        <p style="font-weight:600; margin-bottom:8px; color:#a78bfa;">📅 人事・組織更新ログ:</p>
        ${closingLogs.map(l => `<p style="font-size:13px;">${l}</p>`).join('')}
      </div>

      <button id="btn-next-pj" class="btn-cmd btn-primary" style="padding:16px 32px; font-size:18px; width:100%; max-width:300px; justify-content:center;">
        次のプロジェクト (第 ${state.projectCounter + 1} 期) へ進む ▶
      </button>
    </div>
  `;

  document.getElementById("btn-next-pj").addEventListener("click", () => {
    state.projectCounter += 1;
    startNewProject();
  });
}

// 起動開始
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


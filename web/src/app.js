import { PM, Team } from "./entities.js";
import {
  calculateFinalScore,
  evaluateProjectStatus,
  getInitialDeveloperPool,
  getInitialProjectData,
  processYearlyClosing,
  runWeeklySprint
} from "./engine.js";

// アプリケーション状態管理
const state = {
  pm: new PM(3),
  developerPool: [],
  currentProject: null,
  tasks: [],
  projectCounter: 1,
  logs: []
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

function setDebugScreenName(screenName) {
  const badge = document.getElementById("debug-screen-badge");
  if (badge) {
    badge.textContent = `[DEBUG] Screen: ${screenName}`;
  }
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
  setDebugScreenName("KickoffView (キックオフ画面)");
  updatePhaseStepper("kickoff");
  const proj = state.currentProject;
  const pl = proj.mainTeam.leader;
  const devs = proj.mainTeam.members;

  container.innerHTML = `
    <div class="card overlay-screen">
      <div style="font-size:48px;">🚀</div>
      <h2 style="font-size:26px; font-weight:700;">第 ${state.projectCounter} 期 プロジェクト・キックオフ</h2>
      <p style="color:var(--text-muted);">案件名: <strong>${proj.name}</strong></p>

      <div class="metric-box" style="text-align:left; width:100%; max-width:600px;">
        <p style="font-weight:600; color:#60a5fa; margin-bottom:6px;">上司からの期待要請:</p>
        <p>『${proj.priorityExpectation} 重視（障害・過労の防止）』</p>
        <hr style="border-color:var(--border-color); margin:12px 0;">
        <p style="font-weight:600; color:#a78bfa; margin-bottom:6px;">顧客 (${proj.customer.name}) の第一声:</p>
        <p style="font-style:italic;">${proj.customer.speak()}</p>
      </div>

      <div class="metric-box" style="text-align:left; width:100%; max-width:600px;">
        <p style="font-weight:600; margin-bottom:8px;">■ アサイン確定体制:</p>
        <p>・担当 PL: <strong style="color:#c4b5fd;">${pl ? pl.name : "なし"}</strong> (統率力: ${pl ? pl.leadershipSkill : 0}/5)</p>
        <p>・開発 DEV: ${devs.map(d => d.name).join(", ")} (${devs.length}名)</p>
        <p>・契約納期: <strong>${proj.deadlineWeeks} 週間</strong></p>
      </div>

      <button id="btn-start-sprint" class="btn-cmd btn-primary" style="padding:16px 32px; font-size:18px; width:100%; max-width:300px; justify-content:center;">
        開発フェーズ（週次進行）を開始 ▶
      </button>
    </div>
  `;

  document.getElementById("btn-start-sprint").addEventListener("click", () => {
    renderDashboardView();
  });
}

// 2. メイン開発ダッシュボードの表示
function renderDashboardView() {
  updateHeader();
  setDebugScreenName("DashboardView (メインダッシュボード画面)");
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
  setDebugScreenName("ResultView (プロジェクト結果画面)");
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


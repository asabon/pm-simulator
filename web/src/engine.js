// Web Prototype Game Engine & Logic Functions

import { Customer, Developer, Project, Task, Team } from "./entities.js";

export function getInitialDeveloperPool() {
  return [
    new Developer("dev_1", "ケン", { age: 38, techSkill: 4, commSkill: 4, leadershipSkill: 4, speedSkill: 3, mentalSkill: 4, resolution: 1 }),
    new Developer("dev_2", "レン", { age: 26, techSkill: 3, commSkill: 3, leadershipSkill: 2, speedSkill: 4, mentalSkill: 3, resolution: 0 }),
    new Developer("dev_3", "タク", { age: 31, techSkill: 4, commSkill: 2, leadershipSkill: 3, speedSkill: 3, mentalSkill: 2, resolution: 1 }),
    new Developer("dev_4", "ユイ", { age: 23, techSkill: 2, commSkill: 5, leadershipSkill: 1, speedSkill: 3, mentalSkill: 4, resolution: 0 }),
    new Developer("dev_5", "テツ", { age: 45, techSkill: 5, commSkill: 3, leadershipSkill: 4, speedSkill: 2, mentalSkill: 5, resolution: 2 })
  ];
}

export function getInitialProjectData(projectNumber) {
  const customer = new Customer(`cust_${projectNumber}`, "渡辺部長 (決済事業部)", "VAGUE_REQUIREMENTS");
  const project = new Project(`第${projectNumber}期 基幹決済システム改修`, 4, customer);
  
  const tasks = [
    new Task("t1", "DBスキーマ・テーブル設計", 24.0),
    new Task("t2", "API共通認証・セキュリティ実装", 32.0),
    new Task("t3", "データ移行スクリプト作成", 24.0),
    new Task("t4", "決済コア処理ロジック開発", 48.0),
    new Task("t5", "ユーザー管理画面実装", 32.0),
    new Task("t6", "レポート集計画面構築", 28.0),
    new Task("t7", "管理画面ダッシュボード構築", 24.0),
    new Task("t8", "単体テストコード作成", 24.0),
    new Task("t9", "統合シナリオテスト実施", 32.0),
    new Task("t10", "本番サーバーへのデプロイ", 16.0)
  ];

  return { project, tasks };
}

// =========================================================================
// 🧭 キックオフ順序コンボルックアップテーブル & エンジン (Data-Driven Engine)
// =========================================================================

export const KICKOFF_ACTIONS = {
  CLIENT_WS: { id: "CLIENT_WS", name: "💡 顧客と要件定義ワークショップ実施", category: "CLIENT", defaultSpeaker: "CUSTOMER", defaultComment: "プロトタイプで見せてもらえると助かるよ！どんな機能が必要か一緒につめよう。" },
  CLIENT_PHASED: { id: "CLIENT_PHASED", name: "👥 顧客へ段階リリース(スコープ調整)を提案", category: "CLIENT", defaultSpeaker: "CUSTOMER", defaultComment: "えっ、初期リリースで全部揃わないのか…？まあ、理由があるなら聞こう。" },
  CLIENT_TRADEOFF: { id: "CLIENT_TRADEOFF", name: "🤝 顧客とQCD優先順位の合意形成", category: "CLIENT", defaultSpeaker: "CUSTOMER", defaultComment: "全部大事に決まってるだろ！でも…今回は品質を優先してくれるなら仕方ない。" },
  BOSS_DEADLINE: { id: "BOSS_DEADLINE", name: "🏢 上司へ納期バッファ・スケジュール直訴", category: "BOSS", defaultSpeaker: "BOSS", defaultComment: "もう納期交渉か？理由をしっかり説明しろよ。（上司信頼度が少し低下）" },
  BOSS_HELP_DEV: { id: "BOSS_HELP_DEV", name: "🙋‍♂️ 助っ人エンジニアの追加アサイン要請", category: "BOSS", defaultSpeaker: "BOSS", defaultComment: "自力で回せないのか？仕方ない、エースのタツヤをヘルプで回してやる。" },
  TEAM_RISK_CHECK: { id: "TEAM_RISK_CHECK", name: "🛠️ PLと技術リスク・工数見積もり精査", category: "TEAM", defaultSpeaker: "PL", defaultComment: "PMさん、先に現場のリスクと実工数を精査してくれて助かります！" },
  TEAM_KICKOFF_MEETING: { id: "TEAM_KICKOFF_MEETING", name: "🔥 チームキックオフ決起 ＆ ビジョン共有", category: "TEAM", defaultSpeaker: "PL", defaultComment: "このプロジェクトの意義がわかりました！全員でモチベーション高く頑張ります！" }
};

export const KICKOFF_SYNERGY_RULES = [
  // コンボ1: 【王道の順番】現場リスク精査 ➔ 段階リリース提案
  {
    id: "RULE_GROUNDWORK_TO_CLIENT",
    name: "根拠ある事前交渉コンボ",
    condition: (history, currentActionId) => 
      history.includes("TEAM_RISK_CHECK") && currentActionId === "CLIENT_PHASED",
    speaker: "CUSTOMER",
    comment: "なるほど…現場の工数根拠がそこまで明確なら仕方ない！初期リリースは必須機能だけに絞りましょう。",
    applyEffects: (project, stats) => {
      stats.synergyName = "🌟 【順序コンボ】根拠ある事前交渉 (顧客納得度UP・ペナルティ相殺)";
      stats.customerSatisfactionBonus += 5;
      stats.expectationGapStars += 1;
    }
  },
  // コンボ2: 【順序逆転・唐突】段階リリース提案 ➔ 現場リスク精査
  {
    id: "RULE_BLIND_CLIENT_PROPOSAL",
    name: "無根拠な唐突提案 (不発)",
    condition: (history, currentActionId) => 
      !history.includes("TEAM_RISK_CHECK") && currentActionId === "CLIENT_PHASED",
    speaker: "CUSTOMER",
    comment: "えっ、根拠もなくいきなり機能を絞るってどういうこと！？プロなら工夫して全部やってよ！",
    applyEffects: (project, stats) => {
      stats.customerSatisfactionBonus -= 5;
    }
  },
  // コンボ3: 【共創の順番】要件定義WS ➔ PLリスク精査
  {
    id: "RULE_WS_TO_TEAM_CHECK",
    name: "仕様明確化から現場落とし込みコンボ",
    condition: (history, currentActionId) => 
      history.includes("CLIENT_WS") && currentActionId === "TEAM_RISK_CHECK",
    speaker: "PL",
    comment: "顧客の欲しい仕様イメージがハッキリしたので、めちゃくちゃ見積もりと設計がやりやすくなりました！",
    applyEffects: (project, stats) => {
      stats.synergyName = "🌟 【順序コンボ】明確化からの現場着地 (チーム士気大爆発)";
      stats.teamSafetyStars += 1;
      stats.moraleBonus += 20;
    }
  },
  // コンボ4: 【筋を通す順番】上司納期直訴 ➔ 助っ人要請
  {
    id: "RULE_BOSS_CONSULT_THEN_HELP",
    name: "筋を通した助っ人要請コンボ",
    condition: (history, currentActionId) => 
      history.includes("BOSS_DEADLINE") && currentActionId === "BOSS_HELP_DEV",
    speaker: "BOSS",
    comment: "納期を伸ばしてもまだ厳しいか！分かった、タツヤを全面バックアップで回す。絶対に成功させろよ！",
    applyEffects: (project, stats) => {
      stats.synergyName = "🌟 【順序コンボ】社内全面バックアップ獲得";
      stats.managerSatisfactionBonus += 5;
    }
  }
];

export function evaluateKickoffAction(history, currentActionId, project) {
  const actionInfo = KICKOFF_ACTIONS[currentActionId];
  if (!actionInfo) return null;

  const rule = KICKOFF_SYNERGY_RULES.find(r => r.condition(history, currentActionId));

  const result = {
    actionId: currentActionId,
    actionName: actionInfo.name,
    speaker: rule ? rule.speaker : actionInfo.defaultSpeaker,
    comment: rule ? rule.comment : actionInfo.defaultComment,
    synergyName: rule ? rule.synergyName : null,
    customerSatisfactionBonus: 0,
    managerSatisfactionBonus: 0,
    moraleBonus: 0,
    expectationGapStars: 0,
    teamSafetyStars: 0,
    planHealthStars: 0
  };

  if (rule) {
    rule.applyEffects(project, result);
  }

  return result;
}

export function calculateKickoffDiagnosis(project, actionHistory, selectedMethod) {
  project.methodology = selectedMethod;
  let planHealthStars = 3;
  let expectationGapStars = 3;
  let teamSafetyStars = 3;

  // アクション履歴からの基本影響評価
  if (actionHistory.includes("CLIENT_WS")) {
    planHealthStars += 1;
    project.clarityLevel = Math.min(5, project.clarityLevel + 2);
  }
  if (actionHistory.includes("CLIENT_PHASED")) {
    expectationGapStars += 1;
  }
  if (actionHistory.includes("BOSS_DEADLINE")) {
    project.deadlineWeeks += 1;
    expectationGapStars += 1;
  }
  if (actionHistory.includes("BOSS_HELP_DEV")) {
    teamSafetyStars += 1;
  }
  if (actionHistory.includes("TEAM_RISK_CHECK")) {
    teamSafetyStars += 1;
  }

  // 順序コンボによるスターボーナス
  actionHistory.forEach((actId, idx) => {
    const subHistory = actionHistory.slice(0, idx);
    const evalRes = evaluateKickoffAction(subHistory, actId, project);
    if (evalRes) {
      planHealthStars += evalRes.planHealthStars;
      expectationGapStars += evalRes.expectationGapStars;
      teamSafetyStars += evalRes.teamSafetyStars;
      
      project.customer.satisfaction = Math.min(100, Math.max(0, project.customer.satisfaction + evalRes.customerSatisfactionBonus));
      project.managerSatisfaction = Math.min(100, Math.max(0, project.managerSatisfaction + evalRes.managerSatisfactionBonus));
    }
  });

  // 開発手法（ウォーターフォール vs アジャイル）との適合度補正
  if (selectedMethod === "WATERFALL") {
    if (project.clarityLevel >= 4) {
      planHealthStars += 1;
    } else {
      planHealthStars -= 1; // 要件不鮮明なウォーターフォールは危険
    }
    project.managerSatisfaction = Math.min(100, project.managerSatisfaction + 5);
  } else if (selectedMethod === "AGILE") {
    if (project.clarityLevel < 4) {
      planHealthStars += 1; // 曖昧要件でのアジャイル選定は大正解
    }
    expectationGapStars += 1;
  }

  planHealthStars = Math.min(5, Math.max(1, planHealthStars));
  expectationGapStars = Math.min(5, Math.max(1, expectationGapStars));
  teamSafetyStars = Math.min(5, Math.max(1, teamSafetyStars));

  const totalScore = parseFloat(((planHealthStars + expectationGapStars + teamSafetyStars) / 3).toFixed(1));
  let rank = "B";
  let summaryComment = "";

  if (totalScore >= 4.5) {
    rank = "S";
    summaryComment = "完璧な事前交渉です！死角のない鉄壁の体制でスプリントへ挑みます。";
  } else if (totalScore >= 3.8) {
    rank = "A";
    summaryComment = "見事な準備です！現場と関係者のすり合わせができており安全です。";
  } else if (totalScore >= 3.0) {
    rank = "B";
    summaryComment = "標準的なセットアップです。スプリント中のリスク管理に注意してください。";
  } else {
    rank = "C";
    summaryComment = "防衛ラインが不十分です！無茶振りの影響がスプリントに出る懸念があります。";
  }

  return {
    method: selectedMethod,
    totalScore,
    rank,
    summaryComment,
    planHealthStars,
    expectationGapStars,
    teamSafetyStars
  };
}

export function runWeeklySprint(project, tasks, overtimeIds = new Set(), pm) {
  const logs = [];
  const devs = project.getAllDevelopers().filter(d => d.assignedRole === "DEV");

  if (devs.length === 0) {
    logs.push("⚠️ 開発担当メンバーがいません。進捗は停止しています。");
    project.deadlineWeeks -= 1;
    project.week += 1;
    pm.resetAp();
    return logs;
  }

  // タスクアサイン自動処理
  devs.forEach(dev => {
    let currentTask = tasks.find(t => t.assignedDeveloperId === dev.id && t.status === "IN_PROGRESS");
    if (!currentTask) {
      currentTask = tasks.find(t => t.status === "TODO");
      if (currentTask) {
        currentTask.status = "IN_PROGRESS";
        currentTask.assignedDeveloperId = dev.id;
        logs.push(`⚙️ ${dev.name} がタスク 『${currentTask.name}』 の着手を開始しました。`);
      }
    }
  });

  // 進捗消化計算 (1週間 = 5日換算の現実的な作業量計算)
  devs.forEach(dev => {
    const currentTask = tasks.find(t => t.assignedDeveloperId === dev.id && t.status === "IN_PROGRESS");
    if (currentTask) {
      const isOvertime = overtimeIds.has(dev.id);
      const speedMult = project.direction === "SPEED" ? 1.25 : 1.0;
      
      // 開発手法による消化速度補正
      let methodMult = 1.0;
      if (project.methodology === "WATERFALL") {
        methodMult = 1.3; // ウォーターフォールは計画通り爆速
      } else if (project.methodology === "AGILE") {
        methodMult = 0.85; // アジャイルは試作・対話により慎重進行
      }

      const fatigueFactor = Math.max(0.4, 1.0 - (dev.fatigue / 100.0) * 0.4);
      const speedFactor = 0.7 + 0.1 * dev.speedSkill;

      // 1人あたりの1週間あたりの実質消化時間
      const baseHours = isOvertime ? 55.0 : 40.0;
      const hoursPerWeek = baseHours * speedFactor * fatigueFactor * speedMult * methodMult;
      
      const addedProgress = (hoursPerWeek / currentTask.estimatedHours) * 100.0;
      currentTask.progress = Math.min(100.0, currentTask.progress + addedProgress);

      const fatigueInc = (isOvertime ? 20.0 : 8.0) * (project.direction === "SPEED" ? 1.2 : 1.0);
      dev.fatigue = Math.min(100.0, dev.fatigue + fatigueInc);

      logs.push(`  ・${dev.name}: 『${currentTask.name}』 進捗 +${addedProgress.toFixed(0)}% (累計 ${currentTask.progress.toFixed(0)}%) [疲労: ${dev.fatigue.toFixed(0)}]`);

      if (currentTask.progress >= 100.0) {
        currentTask.status = "DONE";
        logs.push(`✅ タスク 『${currentTask.name}』 が完了しました！`);
      }

      // バグ発生判定
      if (Math.random() < 0.25) {
        project.bugsTotal += 1;
        if (dev.resolution >= 1) {
          project.reportedBugs += 1;
          logs.push(`⚠️ 開発中にバグが検出されました！(総バグ数: ${project.bugsTotal})`);
        }
      }
    }
  });

  project.deadlineWeeks -= 1;
  project.week += 1;
  pm.resetAp();

  return logs;
}

export function evaluateProjectStatus(project, tasks) {
  const mainTasks = tasks.filter(t => !t.id.startsWith("BUG_FIX_"));
  const allDone = mainTasks.every(t => t.status === "DONE");

  if (allDone) {
    return "SUCCESS";
  }

  if (project.deadlineWeeks <= 0) {
    return "FAILED_DEADLINE";
  }

  const devs = project.getAllDevelopers();
  const overworked = devs.filter(d => d.fatigue >= 90.0);
  if (devs.length > 0 && overworked.length >= Math.ceil(devs.length / 2)) {
    return "FAILED_OVERWORK";
  }

  if (project.customer.satisfaction <= 0) {
    return "FAILED_CUSTOMER";
  }

  return "IN_PROGRESS";
}

export function calculateFinalScore(project, pm) {
  const customerScore = project.customer.satisfaction;
  const managerScore = project.managerSatisfaction;
  
  const devs = project.getAllDevelopers();
  const avgFatigue = devs.length > 0 ? devs.reduce((sum, d) => sum + d.fatigue, 0) / devs.length : 0;
  const teamScore = Math.max(0, 100.0 - avgFatigue);

  const totalScore = parseFloat((customerScore * 0.4 + managerScore * 0.3 + teamScore * 0.3).toFixed(1));

  let rank = "C";
  if (totalScore >= 90.0) rank = "S";
  else if (totalScore >= 75.0) rank = "A";
  else if (totalScore >= 60.0) rank = "B";
  else if (totalScore >= 45.0) rank = "C";
  else rank = "D";

  return {
    totalScore,
    rank,
    customerScore: customerScore.toFixed(1),
    managerScore: managerScore.toFixed(1),
    teamScore: teamScore.toFixed(1),
    avgFatigue: avgFatigue.toFixed(1)
  };
}

export function processYearlyClosing(pm, developers) {
  const logs = [];
  pm.completedProjects += 1;
  pm.careerYears += 1;
  logs.push(`📈 PMキャリアが ${pm.careerYears} 年目に突入しました！`);

  for (let i = developers.length - 1; i >= 0; i--) {
    const dev = developers[i];
    dev.age += 1;
    dev.resolution = Math.min(2, dev.resolution + 1);

    if (dev.age >= 65) {
      dev.isRetired = true;
      logs.push(`💐 ベテラン社員 ${dev.name} (${dev.age}歳) が定年退職しました。感謝の拍手！`);
      developers.splice(i, 1);
    }
  }

  const newId = `dev_new_${Date.now()}`;
  const newDev = new Developer(newId, `新入社員 ${developers.length + 1}`, {
    age: 22,
    techSkill: 2,
    commSkill: 3,
    leadershipSkill: 1,
    speedSkill: 3,
    mentalSkill: 3,
    resolution: 0
  });
  developers.push(newDev);
  logs.push(`🌱 新入社員 『${newDev.name}』 (22歳) がチームに配属されました！`);

  return logs;
}

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
  const customer = new Customer(`cust_${projectNumber}`, "渡辺部長 (決済事業部)", "QUALITY_ORIENTED");
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
      const fatigueFactor = Math.max(0.4, 1.0 - (dev.fatigue / 100.0) * 0.4);
      const speedFactor = 0.7 + 0.1 * dev.speedSkill;

      // 1人あたりの1週間あたりの実質消化時間
      const baseHours = isOvertime ? 55.0 : 40.0;
      const hoursPerWeek = baseHours * speedFactor * fatigueFactor * speedMult;
      
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

// Web Prototype Game Engine & Logic Functions

import { Customer, Developer, Project, Task } from "./entities.js";

export function getInitialDeveloperPool() {
  return [
    new Developer("dev_1", "ケン", { age: 38, techSkill: 4, commSkill: 4, leadershipSkill: 4, speedSkill: 3, mentalSkill: 4, resolution: 1 }),
    new Developer("dev_2", "レン", { age: 26, techSkill: 3, commSkill: 3, leadershipSkill: 2, speedSkill: 4, mentalSkill: 3, resolution: 0 }),
    new Developer("dev_3", "タク", { age: 31, techSkill: 4, commSkill: 2, leadershipSkill: 3, speedSkill: 3, mentalSkill: 2, resolution: 1 }),
    new Developer("dev_4", "ユイ", { age: 23, techSkill: 2, commSkill: 5, leadershipSkill: 1, speedSkill: 3, mentalSkill: 4, resolution: 0 }),
    new Developer("dev_5", "テツ", { age: 45, techSkill: 5, commSkill: 3, leadershipSkill: 4, speedSkill: 2, mentalSkill: 5, resolution: 2 })
  ];
}

// =========================================================================
// 🧭 キックオフ動的評価 ＆ アセスメントエンジン
// =========================================================================

export const CUSTOMER_ARCHETYPES = {
  PARTNER: {
    id: "PARTNER",
    name: "🤝 こだわり伴走型",
    hint: "「現場が使いやすくてカッコいいデザインがいいな！画面を見ながら一緒に詰めていこうよ。」",
    favors: ["CLIENT_WS", "CLIENT_PROTOTYPE"],
    dislikes: ["CLIENT_PHASED"]
  },
  DELEGATE: {
    id: "DELEGATE",
    name: "💼 完全丸投げ型",
    hint: "「細かい仕様？ それはプロの君たちが考えてよ。こっちは動くものが納品されれば文句ないからさ。」",
    favors: ["CLIENT_TRADEOFF"],
    dislikes: ["CLIENT_WS", "CLIENT_PROTOTYPE"]
  },
  DEADLINE: {
    id: "DEADLINE",
    name: "⏱️ 納期絶対型",
    hint: "「今回のリリース日は役員会で決定した絶対厳守だ。機能を削るのも納期延期も一切認めないよ。」",
    favors: ["CLIENT_PROTOTYPE", "CLIENT_TRADEOFF"],
    dislikes: ["CLIENT_PHASED", "BOSS_DEADLINE"]
  }
};

export function getInitialProjectData(projectNumber) {
  const customer = new Customer(`cust_${projectNumber}`, "渡辺部長 (決済事業部)", "VAGUE_REQUIREMENTS");
  const project = new Project(`第${projectNumber}期 基幹決済システム改修`, 4, customer);
  
  // 顧客の隠れアーキタイプをランダム設定
  const archetypeKeys = Object.keys(CUSTOMER_ARCHETYPES);
  const selectedKey = archetypeKeys[(projectNumber - 1) % archetypeKeys.length];
  project.customerArchetype = CUSTOMER_ARCHETYPES[selectedKey];
  project.managerTrust = 60; // 上司初期信頼度 (0-100)

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

export const STEP1_ASSESSMENT_CARDS = {
  CARD_QCD: {
    id: "CARD_QCD",
    name: "❓ QCD優先軸の事前すり合わせ",
    target: "👤 顧客",
    desc: "顧客が最も重視する基準（品質・納期・費用）をウェルカム期に確認し、今さら確認ペナルティを防止。",
    getSpeech: (project) => {
      const arch = project.customerArchetype;
      if (arch.id === "PARTNER") return "💬 顧客:「一番大事なのは現場の使い勝手と品質だよ！納得できるものを一緒に作ろう。」 (※こだわり伴走型を看破！)";
      if (arch.id === "DELEGATE") return "💬 顧客:「任せるから期日通り動くものを作ってよ。途中の細かい相談は不要だよ。」 (※完全丸投げ型を看破！)";
      return "💬 顧客:「納期は役員会決定事項だから絶対遅らせないでくれ。そこさえ守れば信頼するよ。」 (※納期絶対型を看破！)";
    }
  },
  CARD_RETRO: {
    id: "CARD_RETRO",
    name: "❓ 過去類似案件の失敗傾向",
    target: "🛠️ PL",
    desc: "過去のハマりどころを現場から事前に聞き出し、チーム安全度を高める。",
    getSpeech: () => "💬 PL:「前回のプロジェクトは隠れた既存DBの整合性チェックで大ハマリしたんです…そこを事前に注意してくれれば安心です！」 (※チーム安全度向上！)"
  },
  CARD_BOSS: {
    id: "CARD_BOSS",
    name: "❓ 上司のリスク許容範囲",
    target: "🏢 上司",
    desc: "上司の懸念点と信頼ラインを確認し、社内バックアップを高める。",
    getSpeech: (project) => `💬 上司:「トラブルで会社に損失を出さなければ基本は現場の判断を尊重するぞ。（上司信頼度: ${project.managerTrust || 60}%）」 (※上司信頼度+5%)`
  }
};

export const KICKOFF_ACTIONS = {
  CLIENT_WS: { id: "CLIENT_WS", name: "💡 顧客と要件定義ワークショップ実施", category: "CLIENT", tags: ["要件確定度UP", "要求膨らみリスク", "AP 1"], defaultSpeaker: "顧客", defaultComment: "プロトタイプで見せてもらえると助かるよ！どんな機能が必要か一緒につめよう。（※要求が追加されるリスクあり）" },
  CLIENT_PHASED: { id: "CLIENT_PHASED", name: "👥 顧客へ段階リリース(スコープ調整)を提案", category: "CLIENT", tags: ["初期スコープ削減", "顧客満足度-5%", "事前精査推奨", "AP 1"], defaultSpeaker: "顧客", defaultComment: "えっ、初期リリースで全部揃わないのか…？まあ、理由があるなら聞こう。（※顧客満足度が少し低下）" },
  CLIENT_TRADEOFF: { id: "CLIENT_TRADEOFF", name: "🤝 顧客とQCD優先順位の合意形成", category: "CLIENT", tags: ["期待値ギャップ減", "顧客満足度-5%", "AP 1"], defaultSpeaker: "顧客", defaultComment: "全部大事に決まってるだろ！でも…今回は品質を優先してくれるなら仕方ない。（※顧客満足度が少し低下）" },
  CLIENT_PROTOTYPE: { id: "CLIENT_PROTOTYPE", name: "📱 画面モック・プロトタイプ先行提示", category: "CLIENT", tags: ["認識ズレ防止", "初期速度-10%", "要件確定度UP", "AP 1"], defaultSpeaker: "顧客", defaultComment: "事前に画面が見られると安心だな！ただ、プロトタイプ作成でスタートが少し遅れるぞ。" },
  BOSS_DEADLINE: { id: "BOSS_DEADLINE", name: "🏢 上司へ納期バッファ・スケジュール直訴", category: "BOSS", tags: ["納期猶予確保", "上司信頼度-10%", "AP 1"], defaultSpeaker: "上司", defaultComment: "もう納期交渉か？理由をしっかり説明しろよ。（※上司評価が低下）" },
  BOSS_HELP_DEV: { id: "BOSS_HELP_DEV", name: "🙋‍♂️ 助っ人エンジニアの追加アサイン要請", category: "BOSS", tags: ["開発力強化", "初期現場疲労UP", "直訴後コンボあり", "AP 1"], defaultSpeaker: "上司", defaultComment: "自力で回せないのか？仕方ない、エースのタツヤを回すが引き継ぎで初期の現場負担が増えるぞ。" },
  TEAM_RISK_CHECK: { id: "TEAM_RISK_CHECK", name: "🛠️ PLと技術リスク・工数見積もり精査", category: "TEAM", tags: ["チーム安全度UP", "段階リリース根拠", "AP 1"], defaultSpeaker: "PL", defaultComment: "PMさん、先に現場のリスクと実工数を精査してくれて助かります！" },
  TEAM_RETROSPECTIVE: { id: "TEAM_RETROSPECTIVE", name: "📚 過去案件の失敗教訓(レトロ)共有", category: "TEAM", tags: ["事故率低減", "説教感・士気微減", "AP 1"], defaultSpeaker: "PL", defaultComment: "過去の炎上パターンの共有ですか…同じ失敗はしませんが、説教感があってプレッシャーも感じますね。" }
};

export const KICKOFF_SYNERGY_RULES = [
  // コンボ1: 【王道の順番】現場リスク精査 ➔ 段階リリース提案
  {
    id: "RULE_GROUNDWORK_TO_CLIENT",
    name: "根拠ある事前交渉コンボ",
    condition: (history, currentActionId) => 
      history.includes("TEAM_RISK_CHECK") && currentActionId === "CLIENT_PHASED",
    speaker: "顧客",
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
    speaker: "顧客",
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
    speaker: "上司",
    comment: "納期を伸ばしてもまだ厳しいか！分かった、タツヤを全面バックアップで回す。絶対に成功させろよ！",
    applyEffects: (project, stats) => {
      stats.synergyName = "🌟 【順序コンボ】社内全面バックアップ獲得";
      stats.managerSatisfactionBonus += 5;
    }
  }
];

export function evaluateKickoffAction(history, currentActionId, project, kickoffState = {}) {
  const actionInfo = KICKOFF_ACTIONS[currentActionId];
  if (!actionInfo) return null;

  const cardsChecked = kickoffState.assessmentCards || [];
  const archetype = project.customerArchetype || CUSTOMER_ARCHETYPES.PARTNER;
  const managerTrust = project.managerTrust || 60;

  // 1. 順序コンボ判定
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
    return result;
  }

  // 2. 🔴 後出し大ペナルティ判定 (Step 1 で確認せずに Step 2 で確認した場合)
  if (currentActionId === "CLIENT_TRADEOFF" && !cardsChecked.includes("CARD_QCD")) {
    result.speaker = "顧客";
    result.comment = "えっ、最初のキックオフの時に聞いてくれよ…今さら改まってそんな初歩的なこと確認されても不安になるよ。";
    result.synergyName = "🔴 【今さら感ペナルティ】前提の確認遅れ (顧客不満)";
    result.customerSatisfactionBonus -= 10;
    return result;
  }

  if (currentActionId === "TEAM_RETROSPECTIVE" && !cardsChecked.includes("CARD_RETRO")) {
    result.speaker = "PL";
    result.comment = "今さら過去の失敗談ですか…？ 最初のうちにリスクとして教えてくれれば対策できたのに、説教に聞こえてテンション落ちます。";
    result.synergyName = "🔴 【今さら感ペナルティ】過去訓の教示遅れ (士気低下)";
    result.moraleBonus -= 15;
    return result;
  }

  // 3. 🧠 顧客隠れタイプ依存の動的セリフ・納得度分岐
  if (actionInfo.category === "CLIENT") {
    if (archetype.favors.includes(currentActionId)) {
      if (currentActionId === "CLIENT_WS") {
        result.comment = "いいね！画面イメージを見ながら機能のすり合わせができるなら大歓迎だよ。一緒に最高の仕様にしよう！";
        result.synergyName = "🟢 【相性抜群】こだわり派顧客の納得 (満足度UP)";
        result.customerSatisfactionBonus += 10;
      } else if (currentActionId === "CLIENT_PROTOTYPE") {
        result.comment = "事前に関係者で実物を見られるのは助かる！これでイメージの相違は無くなるね。";
        result.synergyName = "🟢 【相性抜群】画面モック先行提示の納得";
        result.customerSatisfactionBonus += 5;
      } else if (currentActionId === "CLIENT_TRADEOFF" && cardsChecked.includes("CARD_QCD")) {
        result.comment = "最初にも聞いたけど、今回は品質最優先で頼むよ！優先順位が明確で助かる。";
        result.synergyName = "🟢 【事前すり合わせ成功】信頼感維持";
        result.customerSatisfactionBonus += 5;
      }
    } else if (archetype.dislikes.includes(currentActionId)) {
      if (currentActionId === "CLIENT_WS") {
        result.comment = "えっ、わざわざ打ち合わせに時間取られるの…？ それくらいプロの君たちで良い感じに考えて作ってよ。";
        result.synergyName = "🔴 【相性不一致】丸投げ型顧客の不満";
        result.customerSatisfactionBonus -= 8;
      } else if (currentActionId === "CLIENT_PHASED") {
        result.comment = "は？ 初期リリースで全部揃わないの？ 契約と違うじゃないか、プロなら約束通り全部作ってよ！";
        result.synergyName = "🔴 【相性最悪】納期・スコープ死守型顧客の激怒";
        result.customerSatisfactionBonus -= 15;
      }
    }
  }

  // 4. 🏢 上司信頼度依存の動的セリフ・評価分岐
  if (actionInfo.category === "BOSS") {
    if (managerTrust >= 70) {
      if (currentActionId === "BOSS_DEADLINE") {
        result.comment = "君がそこまで言うなら相当な難易度なんだな。よし、役員会を通して1週間のバッファを確保してやる！";
        result.synergyName = "🟢 【社内高信頼】上司の全面バックアップ獲得";
        result.managerSatisfactionBonus += 5;
      } else if (currentActionId === "BOSS_HELP_DEV") {
        result.comment = "自力で厳しいなら遠慮なく言え！エースのタツヤを即日アサインする。成功させろよ！";
        result.synergyName = "🟢 【社内高信頼】即時助っ人アサイン";
        result.managerSatisfactionBonus += 5;
      }
    } else if (managerTrust <= 40) {
      if (currentActionId === "BOSS_DEADLINE") {
        result.comment = "また最初から言い訳か？ 根拠もなく納期を延ばせるわけないだろ。自力で何とかしろ！";
        result.synergyName = "🔴 【低信頼ペナルティ】上司の激怒・直訴拒絶";
        result.managerSatisfactionBonus -= 15;
      }
    }
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
  if (actionHistory.includes("CLIENT_TRADEOFF")) {
    expectationGapStars += 1;
    project.customer.satisfaction = Math.min(100, project.customer.satisfaction + 3);
  }
  if (actionHistory.includes("CLIENT_PROTOTYPE")) {
    planHealthStars += 1;
    project.clarityLevel = Math.min(5, project.clarityLevel + 1);
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
  if (actionHistory.includes("TEAM_RETROSPECTIVE")) {
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
    planHealthStars,
    expectationGapStars,
    teamSafetyStars,
    totalScore,
    rank,
    summaryComment,
    rallySpeech: getKickoffRallySpeech(totalScore, selectedMethod, actionHistory)
  };
}

export function getKickoffRallySpeech(totalScore, selectedMethod, _actionHistory) {
  const methodLabel = selectedMethod === "WATERFALL" ? "🌊 ウォーターフォール開発" : "🔄 アジャイル開発";
  
  if (totalScore >= 4.5) {
    return {
      speaker: "PL タツヤ",
      speech: `「PMさん、最高の事前調整をありがとうございます！${methodLabel}で進める方針も固まり、チーム全員のモヤモヤが解消されました。現場のリスクも織り込み済みです！全員でモチベーション高く、絶対に成功させましょう！🔥」`
    };
  } else if (totalScore >= 3.5) {
    return {
      speaker: "PL タツヤ",
      speech: `「PMさん、しっかり事前調整と${methodLabel}の決定をしてくれて助かります！まだいくつか不安要素はありますが、チームが一丸となってカバーします。この体制でキックオフして頑張っていきましょう！」`
    };
  } else {
    return {
      speaker: "PL タツヤ",
      speech: `「PMさん、厳しい状況の中ですが${methodLabel}で行く決断をしてくれてありがとうございます。事前準備にやや不安が残りますが、現場も意地を見せます！みんなで助け合って乗り切りましょう！」`
    };
  }
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

export function calculateFinalScore(project, _pm) {
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

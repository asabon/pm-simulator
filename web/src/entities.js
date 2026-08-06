// Web Prototype Data Models (Entities)

export class Developer {
  constructor(id, name, options = {}) {
    this.id = id;
    this.name = name;
    this.age = options.age || 25;
    this.techSkill = options.techSkill || 3;
    this.commSkill = options.commSkill || 3;
    this.leadershipSkill = options.leadershipSkill || 2;
    this.speedSkill = options.speedSkill || 3;
    this.mentalSkill = options.mentalSkill || 3;
    
    this.fatigue = options.fatigue || 0.0;
    this.morale = options.morale || 80.0;
    this.resolution = options.resolution || 0; // 0: 未知, 1: シルエット, 2: 開示
    this.assignedRole = "DEV"; // "PL" or "DEV"
    this.isRetired = false;
  }

  get isPlQualified() {
    return this.leadershipSkill >= 3;
  }

  get statusDisplay() {
    if (this.resolution === 0) {
      return `未知 (?) | 年齢: ${this.age}歳`;
    } else if (this.resolution === 1) {
      const fLabel = this.fatigue >= 70 ? "高" : (this.fatigue >= 40 ? "中" : "良好");
      return `概算理解 | 疲労感: ${fLabel} | 年齢: ${this.age}歳`;
    } else {
      return `詳細開示 | 疲労: ${this.fatigue.toFixed(0)}/100 | 士気: ${this.morale.toFixed(0)}/100 | 統率: ${this.leadershipSkill}/5`;
    }
  }
}

export class Customer {
  constructor(id, name, type = "QUALITY_ORIENTED") {
    this.id = id;
    this.name = name;
    this.type = type; // QUALITY_ORIENTED, SPEED_ORIENTED, VAGUE_REQUIREMENTS
    this.satisfaction = 70.0;
    this.revealed = false;
  }

  speak() {
    if (this.type === "QUALITY_ORIENTED") {
      return "「障害やバグは絶対に許されません。品質第一でお願いしますよ。」";
    } else if (this.type === "SPEED_ORIENTED") {
      return "「とにかくスピード重視です！納期遅れは致命的ですよ。」";
    } else {
      return "「要件はまだ固まっていません。柔軟に対応してくださいね。」";
    }
  }
}

export class Task {
  constructor(id, name, estimatedHours) {
    this.id = id;
    this.name = name;
    this.estimatedHours = estimatedHours;
    this.progress = 0.0; // 0 - 100
    this.status = "TODO"; // TODO, IN_PROGRESS, DONE
    this.assignedDeveloperId = null;
  }
}

export class Team {
  constructor(id, name) {
    this.id = id;
    this.name = name;
    this.leader = null;
    this.members = [];
  }

  setLeader(developer) {
    this.leader = developer;
    developer.assignedRole = "PL";
  }

  assignMember(developer) {
    this.members.push(developer);
    developer.assignedRole = "DEV";
  }

  get allMembers() {
    const list = [];
    if (this.leader) list.push(this.leader);
    return list.concat(this.members);
  }
}

export class Project {
  constructor(name, deadlineWeeks, customer) {
    this.name = name;
    this.deadlineWeeks = deadlineWeeks;
    this.customer = customer || new Customer("cust_1", "顧客部長");
    this.week = 1;
    this.day = 1;
    this.maxDays = deadlineWeeks * 5; // 4週間 = 20営業日
    this.scheduledMeetings = []; // [{ day: 5, actionId: "req_def_ws", title: "要件定義WS" }]
    this.methodology = "WATERFALL"; // WATERFALL vs AGILE
    this.teams = [];
    
    // プロジェクトパラメータ
    this.clarityLevel = 3;  // 1-5
    this.budgetLevel = 3;   // 1-5
    this.scheduleLevel = 3; // 1-5
    
    this.managerSatisfaction = 70.0;
    this.direction = "NORMAL"; // NORMAL, SPEED, QUALITY
    this.bugsTotal = 0;
    this.reportedBugs = 0;
    this.priorityExpectation = "QUALITY";
  }

  // 11月2日(月)を開始基準としたリアルな月日・曜日文字列を取得ヘルパー
  getDateString(dayNum = this.day) {
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    // 基準日: 2026年11月2日(月)
    const current = new Date(2026, 10, 2);
    let workDaysCount = 1;
    while (workDaysCount < dayNum) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workDaysCount++;
      }
    }
    const month = current.getMonth() + 1;
    const date = current.getDate();
    const wday = weekdays[current.getDay()];
    return `${month}月${date}日(${wday})`;
  }

  registerTeam(team) {
    this.teams.push(team);
  }

  get mainTeam() {
    return this.teams[0] || null;
  }

  getAllDevelopers() {
    if (!this.mainTeam) return [];
    return this.mainTeam.allMembers;
  }
}

export class PM {
  constructor(maxAp = 3) {
    this.maxAp = maxAp;
    this.ap = maxAp;
    this.careerYears = 1;
    this.completedProjects = 0;
  }

  resetAp() {
    this.ap = this.maxAp;
  }
}

// UI 遷移モード定義
export const UIMode = {
  TITLE: "TITLE",
  PROLOGUE_INTRO: "PROLOGUE_INTRO",
  PROLOGUE: "PROLOGUE",
  DASHBOARD: "DASHBOARD",
  SCENE_CUSTOMER: "SCENE_CUSTOMER",
  SCENE_MANAGER: "SCENE_MANAGER",
  SCENE_TEAM: "SCENE_TEAM",
  EVENT_MODAL: "EVENT_MODAL"
};

// アクション定義 (ADV UIの各シーンでの具体アクション)
export const ADV_ACTIONS = {
  // 顧客会議室でのアクション
  CUSTOMER: [
    {
      id: "req_def_ws",
      name: "💡 要件定義WSのアポを取る",
      targetGroup: "CUSTOMER",
      costAp: 1,
      isAppointment: true,
      delayDays: 2,
      desc: "【アポ予約】2日後に要件定義ワークショップを予約設定する"
    },
    {
      id: "phased_release",
      name: "👥 段階リリース交渉のアポを取る",
      targetGroup: "CUSTOMER",
      costAp: 1,
      isAppointment: true,
      delayDays: 3,
      desc: "【アポ予約】3日後にスコープ調整の役員面談を予約設定する"
    },
    {
      id: "prototype_demo",
      name: "📱 プロトタイプを先行提示",
      targetGroup: "CUSTOMER",
      costAp: 1,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時】開発初期の認識ズレをモックで即時防止する"
    },
    {
      id: "qcd_align",
      name: "🤝 QCD優先順位の合意アポを取る",
      targetGroup: "CUSTOMER",
      costAp: 1,
      isAppointment: true,
      delayDays: 1,
      desc: "【アポ予約】翌日に期待値すり合わせ面談を予約設定する"
    }
  ],
  // 上司執務室でのアクション
  MANAGER: [
    {
      id: "buffer_request",
      name: "🏢 納期バッファ直訴のアポを取る",
      targetGroup: "MANAGER",
      costAp: 1,
      isAppointment: true,
      delayDays: 1,
      desc: "【アポ予約】翌日に上司へ納期猶予直訴の面談を予約設定する"
    },
    {
      id: "helper_request",
      name: "🙋‍♂️ 助っ人要請の面談アポを取る",
      targetGroup: "MANAGER",
      costAp: 1,
      isAppointment: true,
      delayDays: 1,
      desc: "【アポ予約】翌日に助っ人エンジニア要請の面談を予約設定する"
    },
    {
      id: "boss_risk_check",
      name: "❓ 上司のリスク許容範囲確認",
      targetGroup: "MANAGER",
      costAp: 0,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時/無料】ノーリスクで上司の評価ラインと期待値を確認する"
    }
  ],
  // 開発チームデスクでのアクション (現場アクションは即時中心)
  TEAM: [
    {
      id: "holiday_work_request",
      name: "🚨 現場チームに休日出勤を依頼する (土曜出社)",
      targetGroup: "TEAM",
      costAp: 1,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時】開発進捗を大幅リカバリー！ ただしメンバー疲労度+25%急上昇のジレンマ"
    },
    {
      id: "team_kickoff",
      name: "🚀 チームキックオフ・役割分担の整理 (体制構築)",
      targetGroup: "TEAM",
      costAp: 1,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時】チームの顔合わせと各人の役割分担を整理し健全性を向上させる"
    },
    {
      id: "tech_risk_check",
      name: "🛠️ 技術リスク・見積精査",
      targetGroup: "TEAM",
      costAp: 1,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時】現場のコード・見積精度を自ら精査し交渉の根拠を作る"
    },
    {
      id: "retrospective_share",
      name: "📚 過去の失敗教訓共有",
      targetGroup: "TEAM",
      costAp: 1,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時】チームの安全度を上げバグ発生率を低減する"
    },
    {
      id: "one_on_one",
      name: "❓ チームの懸念点1on1",
      targetGroup: "TEAM",
      costAp: 0,
      isAppointment: false,
      delayDays: 0,
      desc: "【即時/無料】メンバーの隠れ不安やモチベーション状態を対話で看破する"
    }
  ]
};


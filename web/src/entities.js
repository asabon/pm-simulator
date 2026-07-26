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
    this.customer = customer;
    this.week = 1;
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

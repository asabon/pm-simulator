// Web Prototype Overall Game Session & Facade

import { CommandResult } from "./command_result.js";
import { GamePhase } from "./entities.js";
import { getInitialProjectData } from "./engine.js";
import { TeamService } from "./team_service.js";
import { CustomerService } from "./customer_service.js";
import { KickoffService } from "./kickoff_service.js";
import { SprintService } from "./sprint_service.js";

export class GameSession {
  constructor() {
    this.projectNumber = 1;
    this.phase = GamePhase.KICKOFF_PREP;
    this.project = null;
    this.pm = {
      ap: 3,
      maxAp: 3,
      resetAp() { this.ap = this.maxAp; }
    };

    // ドメインサービスのインスタンス化
    this.teamService = new TeamService();
    this.customerService = new CustomerService();
    this.kickoffService = new KickoffService(this);
    this.sprintService = new SprintService(this);

    this.startProject(this.projectNumber);
  }

  startProject(projectNumber = 1) {
    this.projectNumber = projectNumber;
    this.phase = GamePhase.KICKOFF_PREP;

    const { project, tasks } = getInitialProjectData(projectNumber);
    this.project = project;

    // プロジェクトヘ開発メンバープール参照を追加
    this.project.team = this.teamService.getMembers();
    this.project.getAllDevelopers = () => this.teamService.getMembers();

    // 各サービスのデータセットアップ
    this.customerService.setCustomerData(project.customer, project.customerArchetype);
    this.kickoffService.reset();
    this.sprintService.setTasks(tasks);
    this.pm.resetAp();

    return new CommandResult({
      success: true,
      actionType: "START_PROJECT",
      summary: `第 ${projectNumber} 期プロジェクト 『${project.name}』 を開始しました。`,
      logs: [
        `【プロジェクト始動】${project.name}`,
        `顧客: ${project.customer.name}`,
        `納期: ${project.deadlineWeeks} 週間`
      ],
      deliverables: { project, phase: this.phase }
    });
  }

  advancePhase(targetPhase = null) {
    const prevPhase = this.phase;
    if (targetPhase) {
      this.phase = targetPhase;
    } else if (this.phase === GamePhase.KICKOFF_PREP) {
      this.phase = GamePhase.DEVELOPMENT_SPRINT;
    }

    return new CommandResult({
      success: true,
      actionType: "ADVANCE_PHASE",
      summary: `フェーズを ${prevPhase} から ${this.phase} へ切り替えました。`,
      deliverables: { prevPhase, currentPhase: this.phase },
      stateChanges: { phase: this.phase }
    });
  }

  getCurrentState() {
    return {
      projectNumber: this.projectNumber,
      phase: this.phase,
      project: this.project,
      customer: this.customerService.getCustomer(),
      customerArchetype: this.customerService.getArchetype(),
      developers: this.teamService.getMembers(),
      leaderId: this.teamService.leaderId,
      tasks: this.sprintService.getTasks(),
      kickoffAP: this.kickoffService.actionPoints,
      pm: this.pm
    };
  }
}

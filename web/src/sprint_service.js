// Web Prototype Sprint & Task Execution Command Service

import { CommandResult } from "./command_result.js";
import { runWeeklySprint, evaluateProjectStatus, calculateFinalScore } from "./engine.js";

export class SprintService {
  constructor(gameSession) {
    this.gameSession = gameSession;
    this.tasks = [];
    this.overtimeDeveloperIds = new Set();
  }

  setTasks(tasks) {
    this.tasks = tasks;
  }

  getTasks() {
    return this.tasks;
  }

  assignTask(taskId, developerId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (!task) {
      return new CommandResult({
        success: false,
        actionType: "ASSIGN_TASK",
        summary: "指定されたタスクが存在しません。"
      });
    }

    const dev = developerId ? this.gameSession.teamService.getDeveloper(developerId) : null;
    if (developerId && !dev) {
      return new CommandResult({
        success: false,
        actionType: "ASSIGN_TASK",
        summary: "指定された開発者が存在しません。"
      });
    }

    task.assignedDeveloperId = developerId || null;
    if (developerId) {
      task.status = "IN_PROGRESS";
    }

    return new CommandResult({
      success: true,
      actionType: "ASSIGN_TASK",
      summary: `タスク『${task.name}』の担当者を ${dev ? dev.name : "未割り当て"} に設定しました。`,
      deliverables: { task }
    });
  }

  toggleOvertime(developerId) {
    const dev = this.gameSession.teamService.getDeveloper(developerId);
    if (!dev) {
      return new CommandResult({
        success: false,
        actionType: "TOGGLE_OVERTIME",
        summary: "指定された開発者が存在しません。"
      });
    }

    if (this.overtimeDeveloperIds.has(developerId)) {
      this.overtimeDeveloperIds.delete(developerId);
    } else {
      this.overtimeDeveloperIds.add(developerId);
    }

    const isOvertime = this.overtimeDeveloperIds.has(developerId);
    return new CommandResult({
      success: true,
      actionType: "TOGGLE_OVERTIME",
      summary: `${dev.name} の残業指定を ${isOvertime ? "ON (残業投入)" : "OFF (通常作業)"} に変更しました。`,
      deliverables: { developer: dev, isOvertime }
    });
  }

  executeSprintCycle() {
    const project = this.gameSession.project;
    const pm = this.gameSession.pm;

    if (!project) {
      return new CommandResult({
        success: false,
        actionType: "EXECUTE_SPRINT",
        summary: "プロジェクトが開始されていません。"
      });
    }

    const logs = runWeeklySprint(project, this.tasks, this.overtimeDeveloperIds, pm);
    const status = evaluateProjectStatus(project, this.tasks);

    let scoreReport = null;
    if (status !== "IN_PROGRESS") {
      scoreReport = calculateFinalScore(project, pm);
    }

    return new CommandResult({
      success: true,
      actionType: "EXECUTE_SPRINT",
      summary: `第 ${project.week} 週目のスプリントを実行しました。`,
      logs,
      deliverables: {
        week: project.week,
        remainingWeeks: project.deadlineWeeks,
        status,
        scoreReport,
        tasks: this.tasks
      },
      stateChanges: { status }
    });
  }
}

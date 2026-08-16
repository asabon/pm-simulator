// Web Prototype Team & Member Management Service

import { CommandResult } from "./command_result.js";
import { getInitialDeveloperPool } from "./engine.js";

export class TeamService {
  constructor(initialDevelopers = null) {
    this.developers = initialDevelopers || getInitialDeveloperPool();
    this.leaderId = null;
  }

  getMembers() {
    return this.developers;
  }

  getDeveloper(id) {
    return this.developers.find(d => d.id === id) || null;
  }

  assignPL(developerId) {
    const dev = this.getDeveloper(developerId);
    if (!dev) {
      return new CommandResult({
        success: false,
        actionType: "ASSIGN_PL",
        summary: "指定された開発者が存在しません。"
      });
    }

    if (!dev.isPlQualified) {
      return new CommandResult({
        success: false,
        actionType: "ASSIGN_PL",
        summary: `${dev.name} は統率力が不足しているためPLに任命できません。`,
        logs: [`PL任命不可: ${dev.name} は統率力 (${dev.leadershipSkill}/5) が不足しています（必要: 3以上）。`]
      });
    }

    // 他のメンバーのロールをリセットしてPLを更新
    this.developers.forEach(d => {
      d.assignedRole = "DEV";
    });

    dev.assignedRole = "PL";
    this.leaderId = dev.id;

    return new CommandResult({
      success: true,
      actionType: "ASSIGN_PL",
      summary: `${dev.name} をリーダー(PL)に任命しました。`,
      logs: [`【体制変更】${dev.name} をチームリーダー(PL)にアサインしました。`],
      deliverables: { leader: dev },
      stateChanges: { leaderId: dev.id }
    });
  }

  improveResolution(developerId, targetLevel = 2) {
    const dev = this.getDeveloper(developerId);
    if (!dev) {
      return new CommandResult({
        success: false,
        actionType: "IMPROVE_RESOLUTION",
        summary: "対象の開発者が見つかりません。"
      });
    }

    const prevRes = dev.resolution;
    dev.resolution = Math.max(dev.resolution, targetLevel);

    return new CommandResult({
      success: true,
      actionType: "IMPROVE_RESOLUTION",
      summary: `${dev.name} の情報解像度が向上しました (${prevRes} -> ${dev.resolution})。`,
      logs: [`【分析完了】${dev.name} の適性・ステータス詳細を開示しました。`],
      deliverables: { developer: dev }
    });
  }

  updateDeveloperStatus(developerId, { fatigueDelta = 0, moraleDelta = 0 } = {}) {
    const dev = this.getDeveloper(developerId);
    if (!dev) return new CommandResult({ success: false });

    dev.fatigue = Math.min(100, Math.max(0, dev.fatigue + fatigueDelta));
    dev.morale = Math.min(100, Math.max(0, dev.morale + moraleDelta));

    return new CommandResult({
      success: true,
      actionType: "UPDATE_MEMBER_STATUS",
      summary: `${dev.name} の状態を更新しました (疲労: ${dev.fatigue}, 士気: ${dev.morale})。`,
      deliverables: { developer: dev },
      stateChanges: { fatigueDelta, moraleDelta }
    });
  }
}

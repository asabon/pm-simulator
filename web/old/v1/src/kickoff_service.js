// Web Prototype Kickoff Phase Command Service

import { CommandResult } from "./command_result.js";
import { STEP1_ASSESSMENT_CARDS, evaluateKickoffAction, calculateKickoffDiagnosis } from "./engine.js";

export class KickoffService {
  constructor(gameSession) {
    this.gameSession = gameSession;
    this.assessmentCardsChecked = [];
    this.actionHistory = [];
    this.actionPoints = 3;
    this.maxActionPoints = 3;
  }

  reset() {
    this.assessmentCardsChecked = [];
    this.actionHistory = [];
    this.actionPoints = 3;
  }

  getAvailableAssessmentCards() {
    return STEP1_ASSESSMENT_CARDS;
  }

  executeAssessment(cardId) {
    const card = STEP1_ASSESSMENT_CARDS[cardId];
    if (!card) {
      return new CommandResult({
        success: false,
        actionType: "EXECUTE_ASSESSMENT",
        summary: "指定されたアセスメントカードが見つかりません。"
      });
    }

    if (this.assessmentCardsChecked.includes(cardId)) {
      return new CommandResult({
        success: false,
        actionType: "EXECUTE_ASSESSMENT",
        summary: "既に確認済みのアセスメントカードです。"
      });
    }

    this.assessmentCardsChecked.push(cardId);
    const project = this.gameSession.project;
    const speech = typeof card.getSpeech === "function" ? card.getSpeech(project) : "";

    let effectSummary = "";
    if (cardId === "CARD_AGENDA") {
      effectSummary = "事前アジェンダを獲得しました。キーマン同席の会話が可能になります。";
    } else if (cardId === "CARD_QCD") {
      effectSummary = `顧客タイプ (${project.customerArchetype ? project.customerArchetype.name : "不明"}) の満足基準を看破しました。`;
    } else if (cardId === "CARD_RETRO") {
      effectSummary = "過去の類似失敗談を吸い上げ、チームリスクを把握しました。";
    } else if (cardId === "CARD_BOSS") {
      project.managerTrust = Math.min(100, (project.managerTrust || 60) + 5);
      effectSummary = `上司のリスク許容範囲を確認し、信頼度が +5% 上昇しました (${project.managerTrust}%)。`;
    }

    return new CommandResult({
      success: true,
      actionType: "EXECUTE_ASSESSMENT",
      summary: `${card.name} の確認を完了しました。`,
      logs: speech ? [speech] : [],
      deliverables: {
        cardId,
        cardName: card.name,
        effectSummary,
        assessmentCardsChecked: [...this.assessmentCardsChecked]
      },
      stateChanges: { cardAdded: cardId }
    });
  }

  executeProposalAction(actionId) {
    if (this.actionPoints <= 0) {
      return new CommandResult({
        success: false,
        actionType: "EXECUTE_PROPOSAL",
        summary: "行動ポイント(AP)が残っていません。"
      });
    }

    if (this.actionHistory.includes(actionId)) {
      return new CommandResult({
        success: false,
        actionType: "EXECUTE_PROPOSAL",
        summary: "このアクションは既に実行済みです。"
      });
    }

    const project = this.gameSession.project;
    const kickoffState = { assessmentCards: this.assessmentCardsChecked };
    const evalResult = evaluateKickoffAction(this.actionHistory, actionId, project, kickoffState);

    if (!evalResult) {
      return new CommandResult({
        success: false,
        actionType: "EXECUTE_PROPOSAL",
        summary: "無効なアクションです。"
      });
    }

    this.actionHistory.push(actionId);
    this.actionPoints -= 1;

    // 顧客満足度・上司信頼度への影響適用
    if (evalResult.customerSatisfactionBonus && this.gameSession.customerService) {
      this.gameSession.customerService.adjustSatisfaction(
        evalResult.customerSatisfactionBonus,
        evalResult.actionName
      );
    }
    if (evalResult.managerSatisfactionBonus && project) {
      project.managerTrust = Math.min(100, Math.max(0, (project.managerTrust || 60) + evalResult.managerSatisfactionBonus));
    }

    const logs = [];
    if (evalResult.synergyName) logs.push(evalResult.synergyName);
    if (evalResult.comment) logs.push(`💬 ${evalResult.speaker || "関係者"}: ${evalResult.comment}`);

    return new CommandResult({
      success: true,
      actionType: "EXECUTE_PROPOSAL",
      summary: `${evalResult.actionName} を実行しました (残りAP: ${this.actionPoints})。`,
      logs,
      deliverables: {
        evalResult,
        remainingAP: this.actionPoints,
        actionHistory: [...this.actionHistory]
      },
      stateChanges: { apDelta: -1 }
    });
  }

  finalizeKickoffDiagnosis(selectedMethod) {
    const project = this.gameSession.project;
    const diagnosis = calculateKickoffDiagnosis(project, this.actionHistory, selectedMethod);

    return new CommandResult({
      success: true,
      actionType: "FINALIZE_KICKOFF_DIAGNOSIS",
      summary: `キックオフ診断完了: 開発手法 ${selectedMethod}`,
      logs: [
        `【キックオフ完了】選択手法: ${selectedMethod}`,
        `計画健全度: ${"★".repeat(diagnosis.planHealthStars)}${"☆".repeat(5 - diagnosis.planHealthStars)}`,
        `期待値ギャップ: ${"★".repeat(diagnosis.expectationGapStars)}${"☆".repeat(5 - diagnosis.expectationGapStars)}`,
        `チーム安全度: ${"★".repeat(diagnosis.teamSafetyStars)}${"☆".repeat(5 - diagnosis.teamSafetyStars)}`
      ],
      deliverables: { diagnosis },
      stateChanges: { method: selectedMethod }
    });
  }
}

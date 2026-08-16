// Unit tests for Domain Services & Command Pattern Architecture

import { describe, it, expect, beforeEach } from "vitest";
import { GameSession } from "../src/game_session.js";
import { CommandResult } from "../src/command_result.js";

describe("Web Prototype Domain Services & Command Architecture", () => {
  let session;

  beforeEach(() => {
    session = new GameSession();
  });

  describe("GameSession Facade", () => {
    it("should initialize with sub-services and default project", () => {
      expect(session.teamService).toBeDefined();
      expect(session.customerService).toBeDefined();
      expect(session.kickoffService).toBeDefined();
      expect(session.sprintService).toBeDefined();
      expect(session.project).not.toBeNull();
    });

    it("should return current game state via getCurrentState()", () => {
      const state = session.getCurrentState();
      expect(state.projectNumber).toBe(1);
      expect(state.developers.length).toBeGreaterThan(0);
      expect(state.tasks.length).toBeGreaterThan(0);
    });

    it("should advance game phase via advancePhase()", () => {
      const res = session.advancePhase();
      expect(res).toBeInstanceOf(CommandResult);
      expect(res.success).toBe(true);
      expect(session.phase).toBe("DEVELOPMENT_SPRINT");
    });
  });

  describe("TeamService Commands", () => {
    it("should refuse PL assignment if developer leadership skill is low", () => {
      // dev_4 (ユイ) has leadershipSkill = 1
      const res = session.teamService.assignPL("dev_4");
      expect(res).toBeInstanceOf(CommandResult);
      expect(res.success).toBe(false);
      expect(res.summary).toContain("統率力");
    });

    it("should assign qualified developer as PL", () => {
      // dev_1 (ケン) has leadershipSkill = 4
      const res = session.teamService.assignPL("dev_1");
      expect(res.success).toBe(true);
      expect(res.deliverables.leader.id).toBe("dev_1");
      expect(session.teamService.leaderId).toBe("dev_1");
    });

    it("should improve resolution via improveResolution()", () => {
      const dev = session.teamService.getDeveloper("dev_2"); // resolution = 0
      const res = session.teamService.improveResolution("dev_2", 2);
      expect(res.success).toBe(true);
      expect(dev.resolution).toBe(2);
    });
  });

  describe("KickoffService Commands", () => {
    it("should execute assessment card and return CommandResult with deliverables", () => {
      const res = session.kickoffService.executeAssessment("CARD_AGENDA");
      expect(res.success).toBe(true);
      expect(res.actionType).toBe("EXECUTE_ASSESSMENT");
      expect(res.deliverables.cardId).toBe("CARD_AGENDA");
      expect(session.kickoffService.assessmentCardsChecked).toContain("CARD_AGENDA");
    });

    it("should prevent duplicate assessment card execution", () => {
      session.kickoffService.executeAssessment("CARD_AGENDA");
      const res = session.kickoffService.executeAssessment("CARD_AGENDA");
      expect(res.success).toBe(false);
    });

    it("should execute proposal action and update AP and satisfaction", () => {
      // First gain agenda
      session.kickoffService.executeAssessment("CARD_AGENDA");
      
      const res = session.kickoffService.executeProposalAction("CLIENT_WS");
      expect(res.success).toBe(true);
      expect(res.deliverables.remainingAP).toBe(2);
      expect(session.kickoffService.actionHistory).toContain("CLIENT_WS");
    });
  });

  describe("SprintService Commands", () => {
    it("should assign developer to a task", () => {
      const tasks = session.sprintService.getTasks();
      const firstTask = tasks[0];
      const res = session.sprintService.assignTask(firstTask.id, "dev_1");
      
      expect(res.success).toBe(true);
      expect(firstTask.assignedDeveloperId).toBe("dev_1");
      expect(firstTask.status).toBe("IN_PROGRESS");
    });

    it("should toggle overtime mode for developers", () => {
      const res1 = session.sprintService.toggleOvertime("dev_1");
      expect(res1.deliverables.isOvertime).toBe(true);

      const res2 = session.sprintService.toggleOvertime("dev_1");
      expect(res2.deliverables.isOvertime).toBe(false);
    });

    it("should execute a weekly sprint cycle and return summary and logs", () => {
      const res = session.sprintService.executeSprintCycle();
      expect(res.success).toBe(true);
      expect(res.actionType).toBe("EXECUTE_SPRINT");
      expect(res.logs.length).toBeGreaterThan(0);
      expect(res.deliverables.week).toBeGreaterThan(1);
    });
  });
});

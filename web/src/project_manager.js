// PM Simulator - ProjectManager Entity & Command Management

export class ProjectManager {
  constructor({ name = "PM", ap = 3, maxAp = 3, skill = 100 } = {}) {
    this.name = name;
    this.ap = ap;
    this.maxAp = maxAp;
    this.skill = skill;
  }

  /**
   * コンテキスト（フェーズ・残りAP・チーム疲労度等）に応じた利用可能コマンド一覧を取得する
   * @param {Object} context
   * @param {string} context.phase - "KICKOFF", "SPRINT", "CLOSING"
   * @param {number} [context.ap] - 残りAP (省略時は this.ap)
   * @param {number} [context.teamFatigue] - チーム平均疲労度 (0-100)
   * @param {number} [context.customerSatisfaction] - 顧客満足度 (0-100)
   * @returns {Array<Object>} コマンドメタデータ配列
   */
  getAvailableCommands(context = {}) {
    const currentAp = context.ap !== undefined ? context.ap : this.ap;
    const phase = context.phase || "KICKOFF";
    const teamFatigue = context.teamFatigue !== undefined ? context.teamFatigue : 0;

    const allCommands = [
      // キックオフ用アクション
      {
        id: "SCOPE_NEGOTIATION",
        name: "顧客スコープ事前ネゴ",
        cost: 1,
        category: "KICKOFF",
        description: "顧客のこだわり・妥協点を引き出し、要件の明確化と期待値調整を行う。",
        allowedPhases: ["KICKOFF"]
      },
      {
        id: "METHODOLOGY_DECLARATION",
        name: "開発手法の宣言",
        cost: 1,
        category: "KICKOFF",
        description: "ウォーターフォールまたはアジャイル手法を宣言し、プロジェクト方針を固定する。",
        allowedPhases: ["KICKOFF"]
      },
      {
        id: "TEAM_PEP_TALK",
        name: "チーム決起集会",
        cost: 1,
        category: "KICKOFF",
        description: "キックオフ時にチーム全員のモチベーションを高め、初期疲労度を和らげる。",
        allowedPhases: ["KICKOFF"]
      },
      // スプリント/日常用アクション
      {
        id: "ONE_ON_ONE",
        name: "1on1 メンタルケア面談",
        cost: 1,
        category: "SPRINT",
        description: "疲労度の高いメンバーと個別面談を行い、ストレスと疲労度を軽減する。",
        allowedPhases: ["SPRINT"],
        minFatigue: 30
      },
      {
        id: "REPORT_TO_BOSS",
        name: "上示への進捗直訴報告",
        cost: 1,
        category: "SPRINT",
        description: "現状のリスクや予算進捗を上司へ早期報告し、社内信頼度を高める。",
        allowedPhases: ["SPRINT"]
      },
      {
        id: "STAKEHOLDER_SYNC",
        name: "顧客ステークホルダー定期定例",
        cost: 1,
        category: "SPRINT",
        description: "顧客とのミーティングを開催し、仕様認識のズレを防いで満足度を維持する。",
        allowedPhases: ["SPRINT"]
      }
    ];

    return allCommands
      .filter((cmd) => cmd.allowedPhases.includes(phase))
      .map((cmd) => {
        let enabled = true;
        let disabledReason = "";

        if (currentAp < cmd.cost) {
          enabled = false;
          disabledReason = "APが不足しています";
        } else if (cmd.minFatigue && teamFatigue < cmd.minFatigue) {
          enabled = false;
          disabledReason = `チーム疲労度が要件 (${cmd.minFatigue}%) に達していません`;
        }

        return {
          ...cmd,
          enabled,
          disabledReason
        };
      });
  }

  consumeAp(amount = 1) {
    if (this.ap >= amount) {
      this.ap -= amount;
      return true;
    }
    return false;
  }

  restoreAp(amount = null) {
    if (amount === null) {
      this.ap = this.maxAp;
    } else {
      this.ap = Math.min(this.maxAp, this.ap + amount);
    }
  }

  resetAp() {
    this.restoreAp();
  }
}

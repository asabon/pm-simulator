// PM Simulator - ProjectManager Entity & Command Management

export class ProjectManager {
  constructor({ name = "PM", ap = 3, maxAp = 3, skill = 100 } = {}) {
    this.name = name;
    this.ap = ap;
    this.maxAp = maxAp;
    this.skill = skill;
  }

  /**
   * コンテキストに応じた利用可能コマンド一覧を取得する
   * @param {Object} context
   * @param {number} [context.ap] - 残りAP (省略時は this.ap)
   * @param {number} [context.teamFatigue] - チーム平均疲労度 (0-100)
   * @param {Array<string>} [context.kickoffHistory] - 実行済みアクション履歴
   * @param {number} [context.day] - 現在の経過日数
   * @returns {Array<Object>} コマンドメタデータ配列
   */
  getAvailableCommands(context = {}) {
    const currentAp = context.ap !== undefined ? context.ap : this.ap;
    const kickoffHistory = context.kickoffHistory || [];
    const isKickoffDone = kickoffHistory.includes("team_kickoff") || kickoffHistory.includes("team_kickoff_rally");

    const allCommands = [
      // 1. 💬 顧客ステークホルダー調整コマンド
      {
        id: "req_def_ws",
        name: "💬 役員同席の要件定義WS予約",
        cost: 1,
        category: "CUSTOMER",
        isAppointment: true,
        delayDays: 3,
        desc: "【アポ予約】3日後にスコープ調整の役員面談を予約設定する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "prototype_demo",
        name: "📱 プロトタイプを先行提示",
        cost: 1,
        category: "CUSTOMER",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時】開発初期の認識ズレをモックで即時防止する (満足度+5%)",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "qcd_align",
        name: "🤝 QCD優先順位の合意アポを取る",
        cost: 1,
        category: "CUSTOMER",
        isAppointment: true,
        delayDays: 1,
        desc: "【アポ予約】翌日に期待値すり合わせ面談を予約設定する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },

      // 2. 🏢 上司・経営相談コマンド
      {
        id: "buffer_request",
        name: "🏢 納期バッファ直訴のアポを取る",
        cost: 1,
        category: "MANAGER",
        isAppointment: true,
        delayDays: 1,
        desc: "【アポ予約】翌日に上司へ納期猶予直訴の面談を予約設定する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "helper_request",
        name: "🙋‍♂️ 助っ人要請の面談アポを取る",
        cost: 1,
        category: "MANAGER",
        isAppointment: true,
        delayDays: 1,
        desc: "【アポ予約】翌日に助っ人エンジニア要請の面談を予約設定する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "boss_risk_check",
        name: "❓ 上司のリスク許容範囲確認",
        cost: 0,
        category: "MANAGER",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時/無料】ノーリスクで上司の評価ラインと期待値を確認する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },

      // 3. 🛠️ 開発チーム現場コマンド
      {
        id: "agenda_prep",
        name: "📝 会議の論点・アジェンダ整理",
        cost: 1,
        category: "TEAM",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時】直近予定の会議に向けた論点・質問項目をPLと整理する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "tech_risk_check",
        name: "🛠️ 技術リスク・見積精査",
        cost: 1,
        category: "TEAM",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時】現場のコード・見積精度を自ら精査し交渉の根拠を作る",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "retrospective_share",
        name: "📚 過去の失敗教訓共有",
        cost: 1,
        category: "TEAM",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時】チームの安全度を上げバグ発生率を低減する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "one_on_one",
        name: "❓ チームの懸念点1on1",
        cost: 0,
        category: "TEAM",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時/無料】メンバーの隠れ不安やモチベーション状態を対話で看破する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      },
      {
        id: "team_kickoff_rally",
        name: "🚀 チームキックオフ決起 (方針宣言)",
        cost: 1,
        category: "TEAM",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時】下準備の成果・根拠を携えてキックオフを執り行い、チーム体制を発足させる",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: false
      },
      {
        id: "holiday_work_request",
        name: "🚨 現場チームに休日出勤を依頼する",
        cost: 1,
        category: "TEAM",
        isAppointment: false,
        delayDays: 0,
        desc: "【即時】開発進捗を大幅リカバリー！ ただしメンバー疲労度+25%急上昇",
        allowedBeforeKickoff: false,
        allowedAfterKickoff: true
      },

      // 4. ⏱️ 進行コマンド
      {
        id: "advance_day",
        name: "⏱️ 1日を進める",
        cost: 0,
        category: "PROGRESS",
        isAppointment: false,
        delayDays: 0,
        desc: "【進行/無料】本日を終了し次の日へ。予約会議やスプリント進行を判定する",
        allowedBeforeKickoff: true,
        allowedAfterKickoff: true
      }
    ];

    return allCommands
      .filter((cmd) => {
        if (isKickoffDone) {
          return cmd.allowedAfterKickoff;
        }
        return cmd.allowedBeforeKickoff;
      })
      .map((cmd) => {
        let enabled = true;
        let disabledReason = "";

        if (currentAp < cmd.cost) {
          enabled = false;
          disabledReason = "APが不足しています";
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

from .customer import Customer
from .person import Developer
from .team import Team


class Project:
    """プロジェクトマネージャーが担当する案件を表すクラス。

    納期・予算・要件明確度・顧客関係および配下のチームを管理します。

    Attributes:
        name (str): プロジェクト名。
        deadline_weeks (int): 初期設定の納期 (週数)。
        customer (Customer): 発注元顧客。
        clarity_level (int): 要件明確化レベル (1~5)。
        budget_level (int): 予算レベル (1~5)。
        schedule_level (int): 納期妥当性レベル (1~5)。
        priority_expectation (str): 顧客の期待優先度 ("SCHEDULE", "QUALITY", "COST")。
        domain_type (str): ドメインタイプ ("MISSION_CRITICAL", "NEW_BUSINESS" 等)。
        domain_name (str): ドメイン表示名。
        methodology (str): 開発手法 ("WATERFALL", "AGILE")。
        bugs_total (int): 潜在的バグ総数。
        reported_bugs (int): 発覚・報告済みバグ数。
        manager_satisfaction (float): 上司・経営陣の評価満足度 (0.0 ～ 100.0)。
        week (int): 現在の経過週数。
        teams (list[Team]): 登録されているチームのリスト。
    """

    def __init__(
        self,
        name: str,
        deadline_weeks: int,
        customer: Customer,
        clarity_level: int = 3,
        budget_level: int = 3,
        schedule_level: int = 3,
        priority_expectation: str = "SCHEDULE",
        domain_type: str = "MISSION_CRITICAL",
        domain_name: str = "基幹決済システム改修",
    ):
        self.name = name
        self.deadline_weeks = deadline_weeks
        self.customer = customer

        self.clarity_level = clarity_level
        self.budget_level = budget_level
        self.schedule_level = schedule_level

        self.priority_expectation = priority_expectation

        self.domain_type = domain_type
        self.domain_name = domain_name
        self.methodology = "WATERFALL"  # "WATERFALL" or "AGILE"

        self.bugs_total = 0
        self.reported_bugs = 0

        self.manager_satisfaction = 80.0
        self.week = 1

        self.deadline_extension_weeks = 0

        self.pl_active = True
        self.direction = "NORMAL"

        self.teams: list[Team] = []

        self.hearing_type = None
        self.has_evidence = False

    def register_team(self, team: Team) -> None:
        """プロジェクトにチームを登録"""
        if team not in self.teams:
            self.teams.append(team)

    def assign_pl(self, developer: Developer, team_id: str = "main_team") -> bool:
        """指定したチーム（未存在の場合は自動生成）に PL (現場リーダー) をアサインする"""
        target_team = next((t for t in self.teams if t.team_id == team_id), None)
        if target_team is None:
            target_team = Team(team_id=team_id, name="メイン開発チーム")
            self.register_team(target_team)

        target_team.set_leader(developer)
        return True

    def assign_member(self, developer: Developer, team_id: str = "main_team") -> bool:
        """指定したチーム（未存在の場合は自動生成）に開発メンバー (DEV) をアサインする"""
        target_team = next((t for t in self.teams if t.team_id == team_id), None)
        if target_team is None:
            target_team = Team(team_id=team_id, name="メイン開発チーム")
            self.register_team(target_team)

        target_team.assign_member(developer)
        return True

    def set_direction(self, direction: str) -> None:
        """現場チームへの方針指示を更新する ("NORMAL", "QUALITY", "SPEED")"""
        self.direction = direction

    def get_status_summary(self) -> str:
        """プレイヤー画面表示用のプロジェクト状態サマリーテキストを返す"""
        remaining_weeks = self.deadline_weeks + self.deadline_extension_weeks - self.week + 1
        devs_count = len(self.get_all_developers())
        teams_count = len(self.teams)
        main_pl = self.main_team.leader if self.main_team else None
        pl_name = main_pl.name if main_pl else "なし"

        return (
            f"=== プロジェクト状態 [{self.name}] ===\n"
            f"・経過 / 納期    : {self.week} 週間目 / 残り {remaining_weeks} 週間 (全 {self.deadline_weeks + self.deadline_extension_weeks} 週間)\n"
            f"・顧客           : {self.customer.name} (満足度: {self.customer.satisfaction:.1f} / 要件曖昧さ: {self.customer.vague_level:.1f})\n"
            f"・上司満足度     : {self.manager_satisfaction:.1f} / 100.0\n"
            f"・チーム体制     : {teams_count} チーム ({devs_count} 名所属 / メインPL: {pl_name})\n"
            f"・指示方針       : {self.direction}\n"
            f"・バグ報告数     : {self.reported_bugs} 件"
        )

    def get_status_dict(self) -> dict:
        """プロジェクトの状態パラメータを辞書で返す"""
        remaining_weeks = self.deadline_weeks + self.deadline_extension_weeks - self.week + 1
        return {
            "name": self.name,
            "week": self.week,
            "deadline_weeks": self.deadline_weeks,
            "deadline_extension_weeks": self.deadline_extension_weeks,
            "remaining_weeks": remaining_weeks,
            "customer_name": self.customer.name,
            "customer_satisfaction": self.customer.satisfaction,
            "customer_vague_level": self.customer.vague_level,
            "manager_satisfaction": self.manager_satisfaction,
            "direction": self.direction,
            "reported_bugs": self.reported_bugs,
            "teams_count": len(self.teams),
            "total_developers": len(self.get_all_developers()),
        }

    @property
    def main_team(self) -> Team | None:
        """主要チームを返す (チームが1つもない場合は None)"""
        return self.teams[0] if self.teams else None

    def get_all_developers(self) -> list[Developer]:
        """プロジェクト内の全チームに所属する開発メンバーを取得"""
        devs = []
        for team in self.teams:
            devs.extend(team.all_members)
        return devs

    @property
    def assigned_developers(self) -> list[Developer]:
        """後方互換性プロパティ: 全アサインメンバーを返す"""
        return self.get_all_developers()

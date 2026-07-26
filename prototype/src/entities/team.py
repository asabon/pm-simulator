from .person import Developer


class Team:
    """プロジェクト内で開発業務を行うチームを表すクラス。

    PL（現場リーダー）と開発メンバーを管理し、チーム単位での作業推進と集計を担います。

    Attributes:
        team_id (str): チームID。
        name (str): チーム名。
        leader (Developer | None): PL（現場リーダー）。未設定の場合は None。
        members (list[Developer]): 開発メンバー (DEV) のリスト。
    """

    def __init__(self, team_id: str = "main_team", name: str = "メイン開発チーム"):
        self.team_id = team_id
        self.name = name
        self.leader: Developer | None = None
        self.members: list[Developer] = []

    def assign_member(self, developer: Developer) -> None:
        """開発メンバーを追加"""
        developer.assigned_role = "DEV"
        if developer not in self.members:
            self.members.append(developer)

    def set_leader(self, developer: Developer) -> None:
        """PL (現場リーダー) をセット"""
        developer.assigned_role = "PL"
        self.leader = developer

    def remove_member(self, dev_id: str) -> None:
        """メンバーまたはリーダーをチームから除外"""
        if self.leader and self.leader.id == dev_id:
            self.leader = None
        self.members = [m for m in self.members if m.id != dev_id]

    @property
    def all_members(self) -> list[Developer]:
        """PLおよび全開発メンバーのリストを返す"""
        result = []
        if self.leader:
            result.append(self.leader)
        result.extend(self.members)
        return result

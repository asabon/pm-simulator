class Person:
    def __init__(self, person_id: str, name: str, role: str):
        self.id = person_id
        self.name = name
        self.role = role


class PM(Person):
    def __init__(self, person_id: str = "pm_player", name: str = "プレイヤーPM", max_ap: int = 3):
        super().__init__(person_id, name, "PM")
        self.max_ap = max_ap
        self.ap = max_ap
        self.career_years = 1
        self.completed_projects = 0
        self.overall_score = 100.0

    def reset_ap(self):
        self.ap = self.max_ap


class Developer(Person):
    """開発メンバー（開発者）を表すクラス。

    Attributes:
        tech_skill (int): 技術力 (1~5)。品質能力やバグ発生率の算出に影響。
        comm_skill (int): コミュニケーション力 (1~5)。解像度向上や対話イベントに影響。
        leadership_skill (int): 統率力 (1~5)。3以上でPL（現場リーダー）適性あり。
        speed_skill (int): 速度 (1~5)。作業消化速度 (work_speed: 0.7~1.5倍) に影響。
        mental_skill (int): メンタル (1~5)。疲労蓄積や士気変動への耐性に影響。
        age (int): 年齢。
        resolution (int): ステータス開示解像度 (0: 未知[❓], 1: 概算, 2: 完全開示)。
        assigned_role (str): プロジェクト内での割り当て役割 ("PL" または "DEV")。
        is_retired (bool): 離職フラグ。
        _morale (float): 士気 (0.0 ～ 100.0)。
        _fatigue (float): 疲労度 (0.0 ～ 100.0)。
        reveal_duration (int): 一時的な開示効果などの継続ターン数。
    """

    def __init__(
        self,
        dev_id: str,
        name: str,
        tech_skill: int = 3,
        comm_skill: int = 3,
        leadership_skill: int = 3,
        speed_skill: int = 3,
        mental_skill: int = 3,
        age: int = 25,
        resolution: int = 0,
    ):
        super().__init__(dev_id, name, "MEMBER")
        self.tech_skill = tech_skill
        self.comm_skill = comm_skill
        self.leadership_skill = leadership_skill
        self.speed_skill = speed_skill
        self.mental_skill = mental_skill

        self.assigned_role = "DEV"  # プロジェクト内での動的役割 ("PL" または "DEV")
        self.age = age
        self.resolution = resolution
        self.is_retired = False

        self._morale = 80.0
        self._fatigue = 0.0
        self.reveal_duration = 0

    @property
    def is_pl_qualified(self) -> bool:
        """統率力 (leadership_skill >= 3) が一定以上であればPL（現場リーダー）適性あり"""
        return self.leadership_skill >= 3

    @property
    def quality_skill(self) -> int:
        """品質能力 (技術力と統率力のバランスから算出)"""
        return max(1, min(5, round((self.tech_skill + self.leadership_skill) / 2)))

    @property
    def work_speed(self) -> float:
        """speed_skill (1~5) から算定される動的作業スピード (0.7倍 〜 1.5倍)"""
        return 0.5 + 0.2 * self.speed_skill

    @property
    def base_bug_rate(self) -> float:
        """quality_skill (1~5) から算定される動的基礎バグ率 (5.0% 〜 1.0%)"""
        return max(0.005, 0.06 - 0.01 * self.quality_skill)

    @property
    def morale(self):
        return self._morale

    @morale.setter
    def morale(self, value):
        self._morale = max(0.0, min(100.0, value))

    @property
    def fatigue(self):
        return self._fatigue

    @fatigue.setter
    def fatigue(self, value):
        self._fatigue = max(0.0, min(100.0, value))

    def get_status_display(self) -> str:
        pl_qualified_tag = " [PL適性✨]" if self.is_pl_qualified else ""
        if self.resolution == 0:
            return f"年齢: {self.age}歳{pl_qualified_tag} | レーダーチャート: 未知 [❓❓❓❓❓] (協働で解像度向上)"
        elif self.resolution == 1:
            fatigue_label = (
                "高 (限界近し)" if self.fatigue >= 70 else ("中 (疲労蓄積)" if self.fatigue >= 40 else "低 (良好)")
            )
            return (
                f"年齢: {self.age}歳{pl_qualified_tag} | 5軸評価(シルエット): [技術:{self.tech_skill} コミュ:{self.comm_skill} "
                f"統率:{self.leadership_skill} 速度:{self.speed_skill} メンタル:{self.mental_skill}] | 疲労感: {fatigue_label}"
            )
        else:
            return (
                f"年齢: {self.age}歳{pl_qualified_tag} | 🕸️ 5軸レーダー: 🛠️技術:{self.tech_skill} 🤝コミュ:{self.comm_skill} "
                f"👑統率:{self.leadership_skill} ⚡速度:{self.speed_skill} 🧠メンタル:{self.mental_skill} | "
                f"疲労度: {self.fatigue:.0f}/100 | 士気: {self.morale:.0f}/100"
            )

    def speak(self, current_task=None) -> str:
        return self.get_sign(current_task)

    def get_sign(self, current_task=None) -> str:
        if self.assigned_role == "PL":
            if self.fatigue >= 80 or self.morale <= 20:
                return "「メンバーも疲弊してますし、私ももう限界です……。進捗管理どころではありません。」"
            elif self.fatigue >= 50 or self.morale <= 50:
                return "「PM、現場に直接口を出しすぎではないですか？私への相談を通してください。」"

            if self.tech_skill >= 4:
                return "「技術的な堅牢性と見積もり監査は私に任せてください。PMは顧客交渉に専念を。」"
            elif self.comm_skill >= 4:
                return "「要件のヒアリングや現場の雰囲気づくりは任せてください。顧客対話もサポートします。」"
            return "「進捗管理は私に任せて、PMは顧客交渉やリスク対策に集中してください。」"

        if self.fatigue >= 80 or self.morale <= 20:
            return "「……うう、頭が痛いです。体調が優れないので作業が遅れるかもしれません……」"

        if self.fatigue >= 50 or self.morale <= 50:
            return "「最近ちょっと寝不足ですね……。仕様変更が重なると心身ともにキツいです」"

        if self.morale >= 85:
            return "担当タスクを順調にこなしています。「チームの雰囲気も良好ですね！」"

        return "「今週も順調です！タスクを進めていきます」"


class Task:
    def __init__(self, task_id: str, name: str, estimated_hours: float):
        self.id = task_id
        self.name = name
        self.estimated_hours = estimated_hours
        self.actual_hours = 0.0
        self.progress = 0.0
        self.assigned_developer_id = None
        self.status = "TODO"


class Customer(Person):
    def __init__(self, customer_id: str, name: str, customer_type: str, stance_quote: str = ""):
        super().__init__(customer_id, name, "CUSTOMER")
        self.type = customer_type
        self.satisfaction = 80.0
        self.vague_level = 80.0
        self.stance_quote = stance_quote
        self.revealed = False

    def speak(self, current_task=None) -> str:
        if self.revealed:
            type_jp = {
                "QUALITY_ORIENTED": "品質重視",
                "SPEED_ORIENTED": "スピード重視",
                "VAGUE_REQUIREMENTS": "要件探り出し",
            }.get(self.type, self.type)
            return f"「私は{self.name}です。当社が最も重要視しているのは『{type_jp}』です。」"
        return f"「{self.stance_quote}」"


class Project:
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

        self.assigned_developers = []

        self.hearing_type = None
        self.has_evidence = False

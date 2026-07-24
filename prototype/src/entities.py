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
    def __init__(
        self,
        dev_id: str,
        name: str,
        work_speed: float,
        base_bug_rate: float,
        personality_tags: list,
        role: str = "DEV",
        specialty: str = "BE",
        age: int = 25,
        experience_level: str = "MIDDLE",
        resolution: int = 0,
    ):
        super().__init__(dev_id, name, role)
        self.work_speed = work_speed
        self.base_bug_rate = base_bug_rate
        self.personality_tags = personality_tags
        self.specialty = specialty

        self.age = age
        self.experience_level = experience_level
        self.resolution = resolution
        self.is_retired = False

        self._morale = 80.0
        self._fatigue = 0.0
        self.reveal_duration = 0

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
        if self.resolution == 0:
            return f"年齢: {self.age}歳 | 経験: {self.experience_level} | パラメータ: 未知 [?] (協働で解像度向上)"
        elif self.resolution == 1:
            fatigue_label = (
                "高 (限界近し)" if self.fatigue >= 70 else ("中 (疲労蓄積)" if self.fatigue >= 40 else "低 (良好)")
            )
            morale_label = "良好" if self.morale >= 70 else ("普通" if self.morale >= 40 else "低下 (危険)")
            return f"年齢: {self.age}歳 | 疲労感: {fatigue_label} | 士気: {morale_label} | 専門性: {self.specialty}"
        else:
            return f"年齢: {self.age}歳 | 疲労度: {self.fatigue:.0f}/100 | 士気: {self.morale:.0f}/100 | 速度: {self.work_speed:.1f} | バグ率: {self.base_bug_rate * 100:.1f}%"

    def speak(self, current_task=None) -> str:
        return self.get_sign(current_task)

    def get_sign(self, current_task=None) -> str:
        if self.role == "PL":
            if self.fatigue >= 80 or self.morale <= 20:
                return "「メンバーも疲弊してますし、私ももう限界です……。進捗管理どころではありません。」"
            elif self.fatigue >= 50 or self.morale <= 50:
                return "「PM、現場に直接口を出しすぎではないですか？私への相談を通してください。」"

            if self.specialty == "BE":
                return "「今回のプロジェクト要件は私の得意ドメインなので、設計は任せてください。PMは交渉に専念を。」"
            elif self.specialty == "FE":
                return "「今回のシステム要件は以前にも同様の経験があります。現場管理は私に任せてください。」"
            return "「進捗管理は私に任せて、PMは顧客交渉やリスク対策に集中してください。」"

        if self.fatigue >= 80 or self.morale <= 20:
            return "「……うう、頭が痛いです。体調が優れないので作業が遅れるかもしれません……」"

        if current_task and current_task.skill_type != self.specialty:
            if self.fatigue >= 50 or self.morale <= 50:
                return "「経験の薄い分野のタスクで、しかも疲れが溜まっていて全然頭が回りません……」"
            return "「今回の案件の要件はあまり経験がない分野なんですよね……少し手探りです」"

        if self.fatigue >= 50 or self.morale <= 50:
            return "「最近ちょっと寝不足ですね……。仕様がコロコロ変わると心身ともにキツいです」"

        if "DRINK_LOVER" in self.personality_tags and self.morale >= 85:
            return "担当タスクを笑顔でこなしています。「今度みんなで飲みに行きませんか？」"
        if "TECH_GEEK" in self.personality_tags and self.morale >= 85:
            return "黙々と作業しています。「新しい設計フレームを導入したら、品質が上がりました！」"

        return "「今週も順調です！タスクを進めていきます」"


class Task:
    def __init__(self, task_id: str, name: str, estimated_hours: float, skill_type: str = "BE"):
        self.id = task_id
        self.name = name
        self.estimated_hours = estimated_hours
        self.actual_hours = 0.0
        self.progress = 0.0
        self.assigned_developer_id = None
        self.status = "TODO"
        self.skill_type = skill_type


class Customer(Person):
    def __init__(self, customer_id: str, name: str, customer_type: str):
        super().__init__(customer_id, name, "CUSTOMER")
        self.type = customer_type
        self.satisfaction = 80.0
        self.vague_level = 80.0

    def speak(self, current_task=None) -> str:
        return f"「私は{self.name}です。タイプは{self.type}です。」"


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
    ):
        self.name = name
        self.deadline_weeks = deadline_weeks
        self.customer = customer

        self.clarity_level = clarity_level
        self.budget_level = budget_level
        self.schedule_level = schedule_level

        self.priority_expectation = priority_expectation

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

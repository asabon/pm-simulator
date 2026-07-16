class Developer:
    def __init__(self, dev_id: str, name: str, work_speed: float, base_bug_rate: float, salary: int, personality_tags: list, role: str = "DEV"):
        self.id = dev_id
        self.name = name
        self.work_speed = work_speed
        self.base_bug_rate = base_bug_rate
        self.salary = salary
        self.personality_tags = personality_tags
        self.role = role  # "PL" / "DEV"
        
        # 隠しパラメータ
        self._morale = 80.0  # 士気 (0-100)
        self._fatigue = 0.0  # 疲労 (0-100)
        
        # 1on1などによるパラメータ一時開示期限（日数）
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

    def get_sign(self) -> str:
        """開発者の状態に応じた『ひと言サイン』を出力する"""
        if self.role == "PL":
            if self.fatigue >= 80 or self.morale <= 20:
                return "「メンバーも疲弊してますし、私ももう限界です……。進捗管理どころではありません。」"
            elif self.fatigue >= 50 or self.morale <= 50:
                return "「PM、現場に直接口を出しすぎではないですか？私への相談を通してください。」"
            return "「進捗管理は私に任せて、PMは顧客交渉やリスク対策に集中してください。」"

        if self.fatigue >= 80 or self.morale <= 20:
            return "「……うう、頭が痛いです。体調が優れないので明日は遅れるかもしれません……」"
        elif self.fatigue >= 50 or self.morale <= 50:
            return "「最近ちょっと寝不足ですね……。仕様がコロコロ変わると辛いです」"
        
        # 通常・良好な時
        if "DRINK_LOVER" in self.personality_tags and self.morale >= 85:
            return "「プロジェクトも順調ですね！今度みんなで飲みに行きませんか？」"
        if "TECH_GEEK" in self.personality_tags and self.morale >= 85:
            return "「新しいフレームワークを試したいです。コード品質が上がるはずですよ！」"
        
        return "「今日も頑張りましょう！タスクは順調に進んでいます」"


class Task:
    def __init__(self, task_id: str, name: str, estimated_hours: float):
        self.id = task_id
        self.name = name
        self.estimated_hours = estimated_hours
        self.actual_hours = 0.0
        self.progress = 0.0  # 0.0 - 100.0
        self.assigned_developer_id = None
        self.status = "TODO"  # "TODO", "IN_PROGRESS", "DONE"


class Customer:
    def __init__(self, customer_id: str, name: str, customer_type: str):
        self.id = customer_id
        self.name = name
        self.type = customer_type  # "SPEED_ORIENTED", "QUALITY_ORIENTED", "VAGUE_REQUIREMENTS"
        self.satisfaction = 80.0  # 0 - 100
        self.vague_level = 80.0   # あいまい度 (0 - 100)


class Project:
    def __init__(self, name: str, budget: int, deadline_days: int, customer: Customer):
        self.name = name
        self.budget = budget
        self.deadline_days = deadline_days
        self.bugs_total = 0
        self.reported_bugs = 0  # 顧客・上司に報告済みのバグ数
        self.customer = customer
        
        self.manager_satisfaction = 80.0  # 上級マネージャー満足度 (0 - 100)
        self.day = 1
        
        # 交渉による約束・猶予
        self.deadline_extension = 0  # 顧客に認められた延長日数
        self.extra_budget = 0       # 上司から獲得した追加予算

        # PL関連ステータス
        self.pl_active = True       # PLが自律稼働しているか
        self.direction = "NORMAL"   # 現在の開発方針 ("NORMAL" / "BUG_FIRST")

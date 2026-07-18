class Person:
    def __init__(self, person_id: str, name: str, role: str):
        self.id = person_id
        self.name = name
        self.role = role  # "PL" / "DEV" / "CUSTOMER" / "BOSS" など

    def speak(self, current_task=None) -> str:
        """キャラクターの発言を取得する（子クラスでオーバーライド）"""
        return ""


class Developer(Person):
    def __init__(self, dev_id: str, name: str, work_speed: float, base_bug_rate: float, salary: int, personality_tags: list, role: str = "DEV", specialty: str = "BE"):
        super().__init__(dev_id, name, role)
        self.work_speed = work_speed
        self.base_bug_rate = base_bug_rate
        self.salary = salary  # 日当 (1日のコスト)
        self.personality_tags = personality_tags
        self.specialty = specialty  # "FE" / "BE"
        
        # 隠しパラメータ
        self._morale = 80.0  # 士気 (0-100)
        self._fatigue = 0.0  # 疲労 (0-100)
        
        # パラメータ一時開示期限（週数）
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

    def speak(self, current_task=None) -> str:
        """開発者の状態に応じた『ひと言サイン』を出力する"""
        return self.get_sign(current_task)

    def get_sign(self, current_task=None) -> str:
        """開発者の状態に応じた『ひと言サイン』を出力する"""
        if self.role == "PL":
            if self.fatigue >= 80 or self.morale <= 20:
                return "「メンバーも疲弊してますし、私ももう限界です……。進捗管理どころではありません。」"
            elif self.fatigue >= 50 or self.morale <= 50:
                return "「PM、現場に直接口を出しすぎではないですか？私への相談を通してください。」"
            
            # PLの専門性（相性）に応じたメッセージ
            if self.specialty == "BE":  # システム内部でのマッチング
                return "「今回のプロジェクト要件は私の得意ドメインなので、設計は任せてください。PMは交渉に専念を。」"
            elif self.specialty == "FE":
                return "「今回のシステム要件は以前にも同様の経験があります。現場管理は私に任せてください。」"
            return "「進捗管理は私に任せて、PMは顧客交渉やリスク対策に集中してください。」"

        # DEVの場合
        # 1. 限界状態
        if self.fatigue >= 80 or self.morale <= 20:
            return "「……うう、頭が痛いです。体調が優れないので作業が遅れるかもしれません……」"
            
        # 2. ミスマッチ状態（現在作業中のタスクがある場合）
        if current_task and current_task.skill_type != self.specialty:
            if self.fatigue >= 50 or self.morale <= 50:
                return "「経験の薄い分野のタスクで、しかも疲れが溜まっていて全然頭が回りません……」"
            return "「今回の案件の要件はあまり経験がない分野なんですよね……少し手探りです」"
            
        # 3. 疲労蓄積（要注意）
        if self.fatigue >= 50 or self.morale <= 50:
            return "「最近ちょっと寝不足ですね……。仕様がコロコロ変わると心身ともにキツいです」"
        
        # 通常・良好な時
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
        self.progress = 0.0  # 0.0 - 100.0
        self.assigned_developer_id = None
        self.status = "TODO"  # "TODO", "IN_PROGRESS", "DONE"
        self.skill_type = skill_type  # "FE" / "BE"


class Customer(Person):
    def __init__(self, customer_id: str, name: str, customer_type: str):
        super().__init__(customer_id, name, "CUSTOMER")
        self.type = customer_type  # "SPEED_ORIENTED", "QUALITY_ORIENTED", "VAGUE_REQUIREMENTS"
        self.satisfaction = 80.0  # 0 - 100
        self.vague_level = 80.0   # あいまい度 (0 - 100)

    def speak(self, current_task=None) -> str:
        return f"「私は{self.name}です。タイプは{self.type}です。」"


class Project:
    def __init__(self, name: str, budget: int, deadline_weeks: int, customer: Customer, clarity_level: int = 3, budget_level: int = 3, schedule_level: int = 3):
        self.name = name
        self.budget = budget
        self.deadline_weeks = deadline_weeks
        self.customer = customer
        
        # 3つのレベル感パラメータ (1〜5)
        self.clarity_level = clarity_level
        self.budget_level = budget_level
        self.schedule_level = schedule_level
        
        self.bugs_total = 0
        self.reported_bugs = 0  # 顧客・上司に報告済みのバグ数
        
        self.manager_satisfaction = 80.0  # 上級マネージャー満足度 (0 - 100)
        self.week = 1
        
        # 交渉による約束・猶予
        self.deadline_extension_weeks = 0  # 顧客に認められた延長週数
        self.extra_budget = 0             # 上司から獲得した追加予算

        # PL関連ステータス
        self.pl_active = True       # PLが自律稼働しているか
        self.direction = "NORMAL"   # 現在の開発方針 ("NORMAL" / "BUG_FIRST")
        
        # 雇用中のメンバーリスト (ゲーム中の体制)
        self.assigned_developers = []  # List of Developer

        # プロジェクト立ち上げ・事前準備状態管理用
        self.hearing_type = None    # ヒアリングのタイプ ("DEEP" / "LIGHT" / "NONE")
        self.has_evidence = False   # エビデンス（見積もりレポート確認済）の有無

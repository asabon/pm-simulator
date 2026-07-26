class Task:
    """プロジェクト内で消化すべき作業タスクを表すクラス。

    Attributes:
        id (str): タスクID。
        name (str): タスク名（機能名など）。
        estimated_hours (float): 見積もり工数 (人時間)。
        actual_hours (float): 実績投入工数。
        progress (float): 進捗率 (0.0 ～ 100.0)。
        assigned_developer_id (str | None): 担当開発者のID。
        status (str): タスクステータス ("TODO", "IN_PROGRESS", "DONE")。
    """

    def __init__(self, task_id: str, name: str, estimated_hours: float):
        self.id = task_id
        self.name = name
        self.estimated_hours = estimated_hours
        self.actual_hours = 0.0
        self.progress = 0.0
        self.assigned_developer_id = None
        self.status = "TODO"

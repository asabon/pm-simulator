from .person import Person


class Customer(Person):
    """発注元である顧客（ステークホルダー）を表すクラス。

    Attributes:
        type (str): 顧客のスタンスタイプ ("QUALITY_ORIENTED", "SPEED_ORIENTED", "VAGUE_REQUIREMENTS")。
        satisfaction (float): 顧客満足度 (0.0 ～ 100.0)。
        vague_level (float): 要件の曖昧さ・ブレ度 (0.0 ～ 100.0)。
        stance_quote (str): 顧客の口癖・決めゼリフ。
        revealed (bool): 顧客の本音スタンスが開示されているかのフラグ。
    """

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

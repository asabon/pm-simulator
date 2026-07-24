import random

from prototype.src.entities import Customer, Developer, Project, Task


def get_pl_candidates() -> list[Developer]:
    """PL（プロジェクトリーダー）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="pl_ken",
            name="ケン",
            role="PL",
            tech_skill=5,
            comm_skill=2,
            speed_skill=4,
            quality_skill=5,
            mental_skill=3,
            age=38,
            resolution=0,
        ),
        Developer(
            dev_id="pl_ren",
            name="レン",
            role="PL",
            tech_skill=2,
            comm_skill=5,
            speed_skill=3,
            quality_skill=2,
            mental_skill=4,
            age=29,
            resolution=0,
        ),
    ]


def get_dev_candidates() -> list[Developer]:
    """DEV（開発者）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="dev_taku",
            name="タク",
            role="DEV",
            tech_skill=3,
            comm_skill=3,
            speed_skill=4,
            quality_skill=2,
            mental_skill=3,
            age=32,
            resolution=0,
        ),
        Developer(
            dev_id="dev_yui",
            name="ユイ",
            role="DEV",
            tech_skill=3,
            comm_skill=4,
            speed_skill=3,
            quality_skill=4,
            mental_skill=2,
            age=27,
            resolution=0,
        ),
        Developer(
            dev_id="dev_tetsu",
            name="テツ",
            role="DEV",
            tech_skill=5,
            comm_skill=3,
            speed_skill=4,
            quality_skill=5,
            mental_skill=5,
            age=64,  # 定年間近 (65歳で退職)
            resolution=1,  # 長年の社歴により粗い解像度は開示済
        ),
    ]


def generate_new_graduate(dev_id_suffix: int = 1) -> Developer:
    """年度更新時に配属される新入社員を生成する"""
    first_names = ["アオイ", "ヒナタ", "ソラ", "リク", "ハル"]
    name = f"{random.choice(first_names)} (新入社員)"
    return Developer(
        dev_id=f"dev_new_{dev_id_suffix}",
        name=name,
        role="DEV",
        tech_skill=1,
        comm_skill=2,
        speed_skill=2,
        quality_skill=1,
        mental_skill=2,
        age=22,
        resolution=0,  # 完全未知
    )


def get_initial_project_data(project_index: int = 1, customer_type: str = None):
    # ドメイン特性と顧客スタンスの選定
    domain_configs = [
        {
            "domain_type": "MISSION_CRITICAL",
            "domain_name": "基幹決済システム改修",
            "c_type": "QUALITY_ORIENTED",
            "c_name": "渡辺部長 (決済事業部)",
            "clarity_level": 3,
            "budget_level": 2,
            "schedule_level": 3,
            "priority_expectation": "QUALITY",
            "stance_quote": "今回の基幹決済システム改修は我が社の信用に関わる最重要案件です。障害やバグは絶対に許されませんよ。",
        },
        {
            "domain_type": "NEW_BUSINESS",
            "domain_name": "新規Webサービス立ち上げ",
            "c_type": "SPEED_ORIENTED",
            "c_name": "高橋室長 (新規事業室)",
            "clarity_level": 4,
            "budget_level": 3,
            "schedule_level": 1,
            "priority_expectation": "SCHEDULE",
            "stance_quote": "競合他社が来月類似サービスを出すらしいんだ！細かい不備は後回しでいいから、とにかく1日でも早くリリースだ！",
        },
        {
            "domain_type": "DX_REFACTORING",
            "domain_name": "基幹業務プロセスDX刷新",
            "c_type": "VAGUE_REQUIREMENTS",
            "c_name": "佐藤局長 (デジタル推進局)",
            "clarity_level": 1,
            "budget_level": 3,
            "schedule_level": 3,
            "priority_expectation": "SATISFACTION",
            "stance_quote": "役員会からの急な指示で始まったDX企画でね…現場でも具体的な業務仕様が固まりきっていないんだ。相談しながら進めたい。",
        },
    ]

    if customer_type:
        config = next((c for c in domain_configs if c["c_type"] == customer_type), domain_configs[0])
    else:
        # project_index に応じて順番に割り当て
        config = domain_configs[(project_index - 1) % len(domain_configs)]

    customer = Customer(
        customer_id=f"cust_{project_index}",
        name=config["c_name"],
        customer_type=config["c_type"],
        stance_quote=config["stance_quote"],
    )

    # 納期妥当性星レベルマッピング
    schedule_map = {1: 2, 2: 3, 3: 4, 4: 5, 5: 6}
    init_deadline = schedule_map.get(config["schedule_level"], 4)

    project_name = f"第{project_index}期 {config['domain_name']}"
    project = Project(
        name=project_name,
        deadline_weeks=init_deadline,
        customer=customer,
        clarity_level=config["clarity_level"],
        budget_level=config["budget_level"],
        schedule_level=config["schedule_level"],
        priority_expectation=config["priority_expectation"],
        domain_type=config["domain_type"],
        domain_name=config["domain_name"],
    )

    # タスク一覧の定義
    tasks = [
        Task("T01", "DBスキーマ構築", 16.0),
        Task("T02", "API共通認証実装", 24.0),
        Task("T03", "データ移行スクリプト作成", 16.0),
        Task("T04", "ユーザー管理画面実装", 32.0),
        Task("T05", "レポート集計ロジック実装", 24.0),
        Task("T06", "決済連携モジュール開発", 40.0),
        Task("T07", "管理画面ダッシュボード構築", 24.0),
        Task("T08", "単体テストコード作成", 20.0),
        Task("T09", "統合シナリオテスト実施", 32.0),
        Task("T10", "本番サーバーへのデプロイ", 16.0),
    ]

    return project, tasks

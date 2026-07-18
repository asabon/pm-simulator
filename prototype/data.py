from prototype.entities import Developer, Task, Customer, Project

def get_pl_candidates() -> list[Developer]:
    """PL（プロジェクトリーダー）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="pl_ken",
            name="ケン (ケンPL / BE知識豊富)",
            work_speed=1.0,
            base_bug_rate=0.02,
            salary=18000,
            personality_tags=["TECH_GEEK"],
            role="PL",
            specialty="BE"
        ),
        Developer(
            dev_id="pl_ren",
            name="レン (レンPL / FE知識豊富)",
            work_speed=0.7,
            base_bug_rate=0.05,
            salary=10000,
            personality_tags=[],
            role="PL",
            specialty="FE"
        )
    ]

def get_dev_candidates() -> list[Developer]:
    """DEV（開発者）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="dev_taku",
            name="タク (タクDEV / BE特化)",
            work_speed=1.0,
            base_bug_rate=0.02,
            salary=15000,
            personality_tags=["DRINK_LOVER"],
            role="DEV",
            specialty="BE"
        ),
        Developer(
            dev_id="dev_yui",
            name="ユイ (ユイDEV / FE特化)",
            work_speed=1.0,
            base_bug_rate=0.01,
            salary=12000,
            personality_tags=["PRIVATE_FIRST"],
            role="DEV",
            specialty="FE"
        )
    ]

def get_initial_project_data(customer_type="QUALITY_ORIENTED"):
    # 顧客の定義
    customer = Customer(
        customer_id="cust_watanabe",
        name="渡辺部長 (A社)",
        customer_type=customer_type  # SPEED_ORIENTED / QUALITY_ORIENTED / VAGUE_REQUIREMENTS
    )

    # プロジェクトの定義（納期4週間、予算100万）
    project = Project(
        name="新システム構築プロジェクト",
        budget=1000000,
        deadline_weeks=4,
        customer=customer
    )

    # タスク一覧の定義 (FE / BE の割り振り)
    tasks = [
        Task("T01", "DBスキーマ構築", 16.0, "BE"),
        Task("T02", "API共通認証実装", 24.0, "BE"),
        Task("T03", "データ移行スクリプト作成", 16.0, "BE"),
        Task("T04", "ユーザー管理画面実装", 32.0, "FE"),
        Task("T05", "レポート集計ロジック実装", 24.0, "BE"),
        Task("T06", "決済連携モジュール開発", 40.0, "BE"),
        Task("T07", "管理画面ダッシュボード構築", 24.0, "FE"),
        Task("T08", "単体テストコード作成", 20.0, "BE"),
        Task("T09", "統合シナリオテスト実施", 32.0, "FE"),
        Task("T10", "本番サーバーへのデプロイ", 16.0, "BE")
    ]

    return project, tasks

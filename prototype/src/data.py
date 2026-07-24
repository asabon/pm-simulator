from prototype.src.entities import Developer, Task, Customer, Project

def get_pl_candidates() -> list[Developer]:
    """PL（プロジェクトリーダー）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="pl_ken",
            name="ケン (ケンPL)",
            work_speed=1.0,
            base_bug_rate=0.02,
            salary=18000,
            personality_tags=["TECH_GEEK"],
            role="PL",
            specialty="BE"
        ),
        Developer(
            dev_id="pl_ren",
            name="レン (レンPL)",
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
            name="タク (タクDEV)",
            work_speed=1.0,
            base_bug_rate=0.02,
            salary=15000,
            personality_tags=["DRINK_LOVER"],
            role="DEV",
            specialty="BE"
        ),
        Developer(
            dev_id="dev_yui",
            name="ユイ (ユイDEV)",
            work_speed=1.0,
            base_bug_rate=0.01,
            salary=12000,
            personality_tags=["PRIVATE_FIRST"],
            role="DEV",
            specialty="FE"
        )
    ]

def get_initial_project_data(customer_type="QUALITY_ORIENTED"):
    # 顧客の定義と星パラメータの初期化
    if customer_type == "SPEED_ORIENTED":
        c_name = "スピード重視顧客 (B社)"
        clarity_level = 4
        budget_level = 3
        schedule_level = 1  # 納期妥当性が非常に厳しい (弾丸スケジュール)
    elif customer_type == "VAGUE_REQUIREMENTS":
        c_name = "渡辺部長 (A社)"
        clarity_level = 1  # 要求具体度が非常に曖昧
        budget_level = 3
        schedule_level = 3
    else:  # QUALITY_ORIENTED
        c_name = "品質重視顧客 (C社)"
        clarity_level = 3
        budget_level = 2  # 予算がカツカツ
        schedule_level = 3

    customer = Customer(
        customer_id="cust_watanabe",
        name=c_name,
        customer_type=customer_type
    )

    # 予算妥当性星レベルマッピング: 1=60万, 2=80万, 3=100万, 4=120万, 5=150万
    budget_map = {1: 600000, 2: 800000, 3: 1000000, 4: 1200000, 5: 1500000}
    init_budget = budget_map.get(budget_level, 1000000)

    # 納期妥当性星レベルマッピング: 1=2週間, 2=3週間, 3=4週間, 4=5週間, 5=6週間
    schedule_map = {1: 2, 2: 3, 3: 4, 4: 5, 5: 6}
    init_deadline = schedule_map.get(schedule_level, 4)

    # プロジェクトの定義
    project = Project(
        name="新システム構築プロジェクト",
        budget=init_budget,
        deadline_weeks=init_deadline,
        customer=customer,
        clarity_level=clarity_level,
        budget_level=budget_level,
        schedule_level=schedule_level
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

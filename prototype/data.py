from prototype.entities import Developer, Task, Customer, Project

def get_pl_candidates() -> list[Developer]:
    """PL（プロジェクトリーダー）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="pl_suzuki",
            name="鈴木 (鈴木PL / ベテラン)",
            work_speed=1.0,
            base_bug_rate=0.02, # 鈴木は有能でバグが起きにくい
            salary=18000,
            personality_tags=["TECH_GEEK"],
            role="PL"
        ),
        Developer(
            dev_id="pl_tanaka",
            name="田中 (田中PL / 若手)",
            work_speed=0.7,
            base_bug_rate=0.05, # 田中は管理能力が低くバグが起きやすい
            salary=10000,
            personality_tags=[],
            role="PL"
        )
    ]

def get_dev_candidates() -> list[Developer]:
    """DEV（開発者）の雇用候補者を返す"""
    return [
        Developer(
            dev_id="dev_yamada",
            name="山田 (山田DEV / 中堅)",
            work_speed=1.2,
            base_bug_rate=0.02,
            salary=15000,
            personality_tags=["DRINK_LOVER"],
            role="DEV"
        ),
        Developer(
            dev_id="dev_sato",
            name="佐藤 (佐藤DEV / 若手)",
            work_speed=0.8,
            base_bug_rate=0.01, # 佐藤は遅いが極めて丁寧でバグを出さない
            salary=12000,
            personality_tags=["PRIVATE_FIRST"],
            role="DEV"
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
        Task("T10", "本番サーバーへのデプロイ", 16.0)
    ]

    return project, tasks

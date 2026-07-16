from entities import Developer, Task, Customer, Project

def get_initial_data(customer_type="QUALITY_ORIENTED"):
    # 開発者の定義
    developers = [
        Developer(
            dev_id="dev_yamada",
            name="山田 (中堅エンジニア)",
            work_speed=1.2,
            base_bug_rate=0.02,
            salary=15000,
            personality_tags=["DRINK_LOVER"]  # 飲み会でモラールが上がりやすい
        ),
        Developer(
            dev_id="dev_sato",
            name="佐藤 (若手エンジニア)",
            work_speed=0.8,
            base_bug_rate=0.01,
            salary=12000,
            personality_tags=["PRIVATE_FIRST"]  # 残業・飲み会強制が嫌い、休みを好む
        ),
        Developer(
            dev_id="dev_suzuki",
            name="鈴木 (ベテランエンジニア)",
            work_speed=1.0,
            base_bug_rate=0.04,
            salary=18000,
            personality_tags=["TECH_GEEK"]  # 新しい技術や負債解消を好む
        )
    ]

    # 顧客の定義
    customer = Customer(
        customer_id="cust_watanabe",
        name="渡辺部長 (A社)",
        customer_type=customer_type  # SPEED_ORIENTED / QUALITY_ORIENTED
    )

    # プロジェクトの定義（20日間、予算100万）
    project = Project(
        name="新システム構築プロジェクト",
        budget=1000000,
        deadline_days=20,
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
        Task("T10: [NEW]", "本番サーバーへのデプロイ", 16.0)
    ]

    return project, developers, tasks

import random
from prototype.entities import Project, Developer, Task, Customer

def calculate_work_factor(dev: Developer) -> float:
    """士気と疲労による作業効率補正を計算する"""
    morale_factor = 0.5 + 0.5 * (dev.morale / 100.0)
    fatigue_factor = 1.0 - 0.5 * (dev.fatigue / 100.0)
    return morale_factor * fatigue_factor

def auto_assign_tasks(project: Project, tasks: list[Task], logs: list[str], day_in_week: int):
    """PLが有効な場合、空いているDEVメンバーに自動でタスクをアサインする"""
    if not project.pl_active:
        return
        
    pl = next((d for d in project.assigned_developers if d.role == "PL"), None)
    if not pl:
        return

    # 田中PLの場合、アサインにミスが発生しタイムロスする確率 (各日30%)
    if pl.id == "pl_tanaka" and random.random() < 0.30:
        logs.append(f"⚠️ [アサイン遅延] 田中PLの指示がうまく伝わらず、今日の新規タスクの割り当ては見送られました。")
        return

    # 空いているDEVメンバー（担当中のタスクがないメンバー）の取得
    free_devs = []
    for dev in project.assigned_developers:
        if dev.role != "DEV":
            continue
        is_busy = any(t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS" for t in tasks)
        if not is_busy:
            free_devs.append(dev)
            
    for dev in free_devs:
        # BUG_FIRST 方針かつバグが存在する場合、バグ修正タスクをアサイン
        if project.direction == "BUG_FIRST" and project.bugs_total > 0:
            bug_task_id = f"BUG_FIX_W{project.week}D{day_in_week}_{dev.id}"
            if not any(t.id == bug_task_id for t in tasks):
                from prototype.entities import Task
                bug_task = Task(bug_task_id, f"[緊急] バグ修正 ({dev.name})", 8.0)
                bug_task.assigned_developer_id = dev.id
                bug_task.status = "IN_PROGRESS"
                tasks.append(bug_task)
                logs.append(f"📋 {pl.name}: 「開発方針に従い、{dev.name} さんにバグ修正をアサインしました。」")
                continue

        # 通常のタスクアサイン
        todo_tasks = [t for t in tasks if t.status == "TODO"]
        if todo_tasks:
            next_task = todo_tasks[0]
            next_task.assigned_developer_id = dev.id
            next_task.status = "IN_PROGRESS"
            logs.append(f"📋 {pl.name}: 「{dev.name} さん、次は『{next_task.name}』をお願いします。」")


def run_weekly_sprint(project: Project, tasks: list[Task], 
                      overtime_ids: set[str], resting_ids: set[str]) -> list[str]:
    """1週間（5営業日）分の開発シミュレーションを実行する"""
    logs = []
    developers = project.assigned_developers
    pl = next((d for d in developers if d.role == "PL"), None)
    
    logs.append(f"\n--- スプリント {project.week} 開発スタート (残り納期: {project.deadline_weeks} 週間) ---")

    # 1. 1週間 (5日間) のシミュレーションループ
    for day in range(1, 6):
        logs.append(f"\n[第{project.week}週 / 営業日 {day}日目]")
        
        # タスクアサインの実行
        auto_assign_tasks(project, tasks, logs, day)
        
        # メンバーの給料（日当）の消費
        daily_cost = sum(d.salary for d in developers)
        project.budget -= daily_cost
        
        # 開発者の作業進行
        for dev in developers:
            if dev.role == "PL":
                # PL自身の状態更新
                if dev.id in resting_ids:
                    dev.fatigue = max(0.0, dev.fatigue - 20.0)
                    dev.morale = min(100.0, dev.morale + 10.0)
                else:
                    dev.fatigue += 5.0
                    dev.morale -= 1.0
                    
                # PLボイコット判定
                if dev.morale <= 0.0 and project.pl_active:
                    project.pl_active = False
                    logs.append(f"🚨 【PLボイコット】{dev.name} の士気が完全に失われました！「PMが現場に介入しすぎるなら、私はもう管理をやりません」と自律稼働を停止しました。")
                continue

            # DEVの作業進行
            if dev.id in resting_ids:
                dev.fatigue = max(0.0, dev.fatigue - 30.0)
                dev.morale += 10.0
                logs.append(f"💤 {dev.name} は休暇を取りました。")
                continue

            # 作業時間の決定
            hours = 8.0
            is_overtime = dev.id in overtime_ids
            if is_overtime:
                hours = 12.0
                
            assigned_task = next((t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None)
            
            if assigned_task:
                # 進捗計算
                factor = calculate_work_factor(dev)
                effective_hours = hours * dev.work_speed * factor
                assigned_task.actual_hours += effective_hours
                
                progress_increase = (effective_hours / assigned_task.estimated_hours) * 100.0
                assigned_task.progress = min(100.0, assigned_task.progress + progress_increase)
                
                logs.append(f"🛠 {dev.name} が「{assigned_task.name}」を作業中... ({assigned_task.progress:.0f}%)")
                
                # 完了判定
                if assigned_task.progress >= 100.0:
                    assigned_task.status = "DONE"
                    assigned_task.assigned_developer_id = None
                    logs.append(f"✅ 「{assigned_task.name}」が完了しました！")
                    
                    if assigned_task.id.startswith("BUG_FIX_"):
                        project.bugs_total = max(0, project.bugs_total - 1)
                        project.reported_bugs = max(0, project.reported_bugs - 1)
                        logs.append(f"🔧 バグが1件修正されました。(残バグ: {project.bugs_total}件)")

                # バグ発生判定（バグ修正中以外でのみ発生）
                if not assigned_task.id.startswith("BUG_FIX_"):
                    # 鈴木PLがアクティブな場合、バグ発生率が 15% 減少するパッシブ効果
                    bug_multiplier = 0.85 if (pl and pl.id == "pl_suzuki" and project.pl_active) else 1.0
                    bug_chance = dev.base_bug_rate * (1.0 + dev.fatigue / 100.0) * effective_hours * bug_multiplier
                    
                    if random.random() < bug_chance:
                        project.bugs_total += 1
                        logs.append(f"⚠️ 「{assigned_task.name}」のコードにバグが混入しました。(総バグ: {project.bugs_total}件)")
            else:
                logs.append(f"😴 {dev.name} は待機状態です。")

            # DEVの状態（疲労・士気）更新
            if is_overtime:
                dev.fatigue += 20.0
                if "PRIVATE_FIRST" in dev.personality_tags:
                    dev.morale -= 25.0
                else:
                    dev.morale -= 8.0
            else:
                dev.fatigue += 10.0
                dev.morale -= 2.0

    # 2. 1on1などの効果週数カウントを減少
    for dev in developers:
        if dev.reveal_duration > 0:
            dev.reveal_duration -= 1

    # 3. 顧客満足度の週末更新
    unreported_bugs = project.bugs_total - project.reported_bugs
    
    if project.customer.type == "QUALITY_ORIENTED":
        # 品質重視: 未報告バグへの強い反発
        if unreported_bugs > 0:
            satisfaction_drop = unreported_bugs * 5.0  # 週単位なので影響を大きく
            project.customer.satisfaction -= satisfaction_drop
            project.manager_satisfaction -= unreported_bugs * 2.0
            logs.append(f"❌ 顧客はバグが隠されているのではないかと不審に思っています。")
        project.customer.satisfaction -= project.reported_bugs * 1.5
        
    elif project.customer.type == "SPEED_ORIENTED":
        # スピード重視: スプリント単位での進捗ギャップ
        total_progress = sum(t.progress for t in tasks)
        avg_progress = total_progress / len(tasks)
        
        # 現在の週数に基づく想定進捗 (4週間のうちの割合)
        expected_progress = (project.week / 4.0) * 100.0
        if avg_progress < expected_progress:
            delay_gap = expected_progress - avg_progress
            project.customer.satisfaction -= delay_gap * 0.5
            logs.append(f"❌ 開発スケジュールが想定より遅れています。")
            
    elif project.customer.type == "VAGUE_REQUIREMENTS":
        # 要件あいまい: あいまい度が高いと、顧客満足度が毎日少しずつ下がる
        # 週合計で引く
        satisfaction_drop = project.customer.vague_level * 0.4
        project.customer.satisfaction -= satisfaction_drop
        if satisfaction_drop > 0:
            logs.append(f"❓ 顧客は仕様のすり合わせ不足に強い不安を抱いています。")
            
    project.customer.satisfaction = max(0.0, min(100.0, project.customer.satisfaction))

    # 4. 上級マネージャー満足度の更新
    base_manager_sat = project.customer.satisfaction
    
    # メンバーの過労によるペナルティ
    for dev in developers:
        if dev.fatigue >= 90:
            base_manager_sat -= 20.0
            logs.append(f"🚨 【重大な警告】{dev.name} が過労で倒れかけています！上司から管理責任を問われています。")
            
    project.manager_satisfaction = max(0.0, min(100.0, base_manager_sat))

    # 5. 週数の進捗
    project.week += 1
    project.deadline_weeks -= 1
    
    return logs


def trigger_event(project: Project, tasks: list[Task]) -> dict:
    """週の終わりにランダムイベントを発生させる"""
    developers = project.assigned_developers
    
    # 要件あいまい顧客の場合、あいまい度（vague_level）に応じて追加要求イベントが確率で発生
    if project.customer.type == "VAGUE_REQUIREMENTS":
        rework_chance = (project.customer.vague_level / 100.0) * 0.70 # 週単位なので高確率に
        if random.random() < rework_chance:
            target_dev = random.choice([d for d in developers if d.role == "DEV"])
            return {
                "id": "rework_request",
                "title": "顧客からの追加要望（手戻り）",
                "description": f"顧客の{project.customer.name}から、「出来上がってきたモジュールの仕様について、追加で機能変更してほしい」と要求がありました。追加タスク「画面レイアウトの再調整」(24時間) が発生します。",
                "choices": [
                    {
                        "text": f"要望をそのまま開発者に丸投げする (顧客満足度+15, 担当の {target_dev.name} の士気-30)",
                        "action": lambda p, d, t: pass_through_rework(p, d, t, target_dev)
                    },
                    {
                        "text": f"防波堤としてPMが間に入り調整して納得させる (調整費用 ¥30,000 消費, 顧客満足度+5, {target_dev.name} の士気-5)",
                        "action": lambda p, d, t: buffer_rework(p, d, t, target_dev)
                    },
                    {
                        "text": "交渉して追加要望を断る (タスク追加なし, 顧客満足度-25)",
                        "action": lambda p, d, t: reject_rework(p)
                    }
                ]
            }

    # 1週間の終わりに 50% の確率で通常イベント発生
    if random.random() > 0.50:
        return None

    events = [
        {
            "id": "spec_change",
            "title": "仕様変更の打診",
            "description": f"顧客の{project.customer.name}から、「ダッシュボードのグラフ分析機能を追加してほしい」と打診がありました。予算は ¥200,000 追加されますが、納期は据え置きです。",
            "choices": [
                {
                    "text": "受け入れる (予算+20万, 追加タスク「グラフ描画機能」登録, 顧客満足度+10)",
                    "action": lambda p, d, t: accept_spec_change(p, t)
                },
                {
                    "text": "交渉して断る (顧客満足度-15)",
                    "action": lambda p, d, t: refuse_spec_change(p)
                }
            ]
        },
        {
            "id": "bug_discovery",
            "title": "テスト環境でのバグ発覚",
            "description": "開発中のシステムにバグが潜んでいるのではないかと、顧客側が疑念を持っています。正直にバグ状況を報告しますか？",
            "choices": [
                {
                    "text": f"正直に報告する (報告済バグ数を {project.bugs_total}件 に更新。顧客満足度-10, 上司信頼+5)",
                    "action": lambda p, d, t: report_bugs_honestly(p)
                },
                {
                    "text": "「問題ありません」と隠し通す (顧客満足度変化なし。ただし未報告のまま放置するとペナルティ累積)",
                    "action": lambda p, d, t: hide_bugs(p)
                }
            ]
        }
    ]
    
    return random.choice(events)


# アクション関数
def accept_spec_change(project: Project, tasks: list[Task]) -> str:
    project.budget += 200000
    from prototype.entities import Task
    new_task = Task("T_EXTRA", "[追加] グラフ描画機能実装", 24.0)
    tasks.append(new_task)
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 10.0)
    return "仕様変更を受け入れました。新たなタスクが追加され、予算が ¥200,000 増加しました。"

def refuse_spec_change(project: Project) -> str:
    project.customer.satisfaction = max(0.0, project.customer.satisfaction - 15.0)
    return "仕様変更を断りました。顧客満足度が低下しました。"

def report_bugs_honestly(project: Project) -> str:
    diff = project.bugs_total - project.reported_bugs
    project.reported_bugs = project.bugs_total
    project.customer.satisfaction = max(0.0, project.customer.satisfaction - 10.0)
    project.manager_satisfaction = min(100.0, project.manager_satisfaction + 5.0)
    return f"正直にバグを報告しました（新規報告: {diff}件）。顧客満足度は下がりましたが、上司からの管理能力評価が上がりました。"

def hide_bugs(project: Project) -> str:
    return "バグを報告せず、順調であると回答しました。顧客は納得したようですが、バグが残ったままです。"

def pass_through_rework(project: Project, developers: list[Developer], tasks: list[Task], dev: Developer) -> str:
    from prototype.entities import Task
    new_task = Task("T_REWORK", "[追加手戻り] 画面レイアウトの再調整", 24.0)
    tasks.append(new_task)
    dev.morale -= 30.0
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 15.0)
    return f"顧客の要望をそのまま {dev.name} に丸投げしました。{dev.name} の士気が著しく低下しました。"

def buffer_rework(project: Project, developers: list[Developer], tasks: list[Task], dev: Developer) -> str:
    from prototype.entities import Task
    new_task = Task("T_REWORK", "[追加手戻り] 画面レイアウトの再調整", 24.0)
    tasks.append(new_task)
    project.budget -= 30000
    dev.morale -= 5.0
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 5.0)
    return f"PMが調整に入り、納得感を持って {dev.name} に作業を依頼しました。費用 ¥30,000 を消費しましたが、士気の低下を抑えられました。"

def reject_rework(project: Project) -> str:
    project.customer.satisfaction = max(0.0, project.customer.satisfaction - 25.0)
    return "顧客の追加要望を断りました。顧客の満足度が大きく低下しました。"

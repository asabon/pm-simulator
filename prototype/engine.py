import random
from prototype.entities import Project, Developer, Task, Customer

def calculate_work_factor(dev: Developer) -> float:
    """士気と疲労による作業効率補正を計算する"""
    morale_factor = 0.5 + 0.5 * (dev.morale / 100.0)
    fatigue_factor = 1.0 - 0.5 * (dev.fatigue / 100.0)
    return morale_factor * fatigue_factor

def next_day_cycle(project: Project, developers: list[Developer], tasks: list[Task], 
                   overtime_ids: set[str], resting_ids: set[str]) -> list[str]:
    """1日のゲーム進行処理を行い、発生した出来事のログ（テキストリスト）を返す"""
    logs = []
    
    # 1. 予算の消費 (開発者の日当支払い。休みでも発生)
    daily_cost = 0
    for dev in developers:
        daily_cost += dev.salary
    project.budget -= daily_cost
    logs.append(f"開発者の給与（日当）として計 ¥{daily_cost:,} を支払いました。 (残予算: ¥{project.budget:,})")

    # 2. 各開発者の作業進行
    for dev in developers:
        if dev.id in resting_ids:
            # 休暇中の処理
            dev.fatigue = max(0.0, dev.fatigue - 30.0)
            dev.morale += 10.0
            logs.append(f"💤 {dev.name} は休暇を取りました。疲労が回復し、士気が上がりました。")
            
            # アサインされていたタスクは進捗しない
            continue
        
        # 作業時間の決定
        hours = 8.0
        is_overtime = dev.id in overtime_ids
        if is_overtime:
            hours = 12.0
            logs.append(f"🔥 {dev.name} に残業を指示しました。")
            
        # 担当タスクの取得
        assigned_task = next((t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None)
        
        # 進捗計算
        if assigned_task:
            factor = calculate_work_factor(dev)
            effective_hours = hours * dev.work_speed * factor
            assigned_task.actual_hours += effective_hours
            
            progress_increase = (effective_hours / assigned_task.estimated_hours) * 100.0
            assigned_task.progress = min(100.0, assigned_task.progress + progress_increase)
            
            logs.append(f"🛠 {dev.name} が「{assigned_task.name}」を作業しました。(進捗: +{progress_increase:.1f}% -> {assigned_task.progress:.1f}%)")
            
            # タスク完了判定
            if assigned_task.progress >= 100.0:
                assigned_task.status = "DONE"
                assigned_task.assigned_developer_id = None
                logs.append(f"✅ タスク「{assigned_task.name}」が完了しました！")
                
            # バグ発生の判定
            # 基本バグ率 + 疲労度影響。作業時間（effective_hours）に比例して判定
            bug_chance = dev.base_bug_rate * (1.0 + dev.fatigue / 100.0) * effective_hours
            if random.random() < bug_chance:
                project.bugs_total += 1
                logs.append(f"⚠️ 「{assigned_task.name}」のコードに潜在的なバグが混入しました。(総バグ数: {project.bugs_total}件)")
        else:
            logs.append(f"😴 {dev.name} は担当タスクがないため、社内雑務をしていました。")

        # 3. 開発者の状態（疲労・士気）更新
        if is_overtime:
            dev.fatigue += 20.0
            if "PRIVATE_FIRST" in dev.personality_tags:
                dev.morale -= 25.0
                logs.append(f"😡 {dev.name} は残業させられたことに強い不満を抱いています！(士気大幅低下)")
            else:
                dev.morale -= 8.0
        else:
            dev.fatigue += 10.0
            dev.morale -= 2.0
            
        # 1on1の開示残り日数を減少
        if dev.reveal_duration > 0:
            dev.reveal_duration -= 1

    # 3. 顧客満足度の更新
    unreported_bugs = project.bugs_total - project.reported_bugs
    
    # 顧客タイプによる不満度計算
    if project.customer.type == "QUALITY_ORIENTED":
        # 品質重視: 隠れている（未報告の）バグがあると、顧客は不穏な空気を察知して満足度が下がる
        if unreported_bugs > 0:
            satisfaction_drop = unreported_bugs * 1.5
            project.customer.satisfaction -= satisfaction_drop
            # 隠蔽ペナルティとして上司の満足度もこっそり下がる
            project.manager_satisfaction -= unreported_bugs * 0.5
            
        # 報告済みバグに対する不満
        project.customer.satisfaction -= project.reported_bugs * 0.5
        
    elif project.customer.type == "SPEED_ORIENTED":
        # スピード重視: 全体タスクの平均進捗率が、残り日数に対して遅れていると満足度低下
        total_progress = sum(t.progress for t in tasks)
        avg_progress = total_progress / len(tasks)
        expected_progress = ((20 - project.deadline_days) / 20) * 100.0
        
        if avg_progress < expected_progress:
            delay_gap = expected_progress - avg_progress
            project.customer.satisfaction -= delay_gap * 0.2
            
    elif project.customer.type == "VAGUE_REQUIREMENTS":
        # 要件あいまい: あいまい度（vague_level）に比例して、顧客の不安から満足度が毎日低下する
        satisfaction_drop = project.customer.vague_level * 0.15
        project.customer.satisfaction -= satisfaction_drop
        if satisfaction_drop > 0:
            logs.append(f"❓ 顧客は仕様のあいまさに不安を感じています。(顧客満足度 -{satisfaction_drop:.1f})")
            
    # 顧客満足度は 0-100 に収める
    project.customer.satisfaction = max(0.0, min(100.0, project.customer.satisfaction))

    # 4. 上級マネージャー満足度の更新
    # 基本的に顧客満足度に連動するが、離職者や極端な疲労メンバーがいるとマイナス
    base_manager_sat = project.customer.satisfaction
    
    # メンバーの過労によるペナルティ
    for dev in developers:
        if dev.fatigue >= 90:
            base_manager_sat -= 15.0
            logs.append(f"🚨 【警告】{dev.name} が過労で限界寸前です！上司が心配しています。")
            
    project.manager_satisfaction = max(0.0, min(100.0, base_manager_sat))

    # 5. 日付とデッドラインの更新
    project.day += 1
    project.deadline_days -= 1
    
    return logs


def trigger_event(project: Project, developers: list[Developer], tasks: list[Task]) -> dict:
    """ランダムイベントを発生させる。発生しない場合は None を返す。"""
    # 要件あいまい顧客の場合、あいまい度（vague_level）に応じて追加要求イベントが確率で発生
    if project.customer.type == "VAGUE_REQUIREMENTS":
        # あいまい度が高いほど、高確率で追加要求（手戻り）イベントが発生する (最大で毎日 40% の確率)
        rework_chance = (project.customer.vague_level / 100.0) * 0.45
        if random.random() < rework_chance:
            # ランダムに影響を受ける開発者を選定しておく
            target_dev = random.choice(developers)
            
            # 手戻り要求イベントの定義
            return {
                "id": "rework_request",
                "title": "顧客からの追加要望（手戻り）",
                "description": f"顧客の{project.customer.name}から、「出来上がってきた画面の仕様について、少し追加で修正してほしい」と要求がありました。追加タスク「画面レイアウトの再調整」(24時間) が発生します。",
                "choices": [
                    {
                        "text": f"要望をそのまま開発者に丸投げする (顧客満足度+15, 担当予定の {target_dev.name} の士気-30)",
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

    # 1日の終わりに 35% の確率で通常イベント発生
    if random.random() > 0.35:
        return None

    # 通常イベントリスト
    events = [
        {
            "id": "spec_change",
            "title": "仕様変更の打診",
            "description": f"顧客の{project.customer.name}から、「追加機能としてダッシュボードのグラフ化を追加してほしい」と打診がありました。予算は ¥200,000 追加されますが、納期は据え置きです。",
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
            "description": "開発中のシステムに不具合があるのではないかと、顧客側が疑念を持っています。正直にバグ状況を報告しますか？",
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


# イベント用アクション関数
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

# 追加要求イベント用アクション関数
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

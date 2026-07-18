import random
from prototype.entities import Project, Developer, Task, Customer

def calculate_work_factor(dev: Developer) -> float:
    """士気と疲労による作業効率補正を計算する"""
    morale_factor = 0.5 + 0.5 * (dev.morale / 100.0)
    fatigue_factor = 1.0 - 0.5 * (dev.fatigue / 100.0)
    return morale_factor * fatigue_factor


def run_detailed_hearing(project: Project, tasks: list[Task]) -> str:
    """PL同行による詳細ヒアリング（要件定義）を実行し、効果メッセージを返す"""
    pl = next((d for d in project.assigned_developers if d.role == "PL"), None)
    if not pl:
        return "⚠️ PLがアサインされていません。"
        
    # プロジェクトのタスク特性比率の集計
    incomplete_tasks = [t for t in tasks if t.status != "DONE"]
    be_hours = sum(t.estimated_hours for t in incomplete_tasks if t.skill_type == "BE")
    fe_hours = sum(t.estimated_hours for t in incomplete_tasks if t.skill_type == "FE")
    
    # BEが50%以上なら BE中心のプロジェクト、それ以外は FE中心
    project_domain = "BE" if be_hours >= fe_hours else "FE"
    
    # 納期を1週消費
    project.deadline_weeks -= 1
    project.hearing_type = "DEEP"
    
    # 要件あいまい顧客（渡辺部長）の場合
    if project.customer.type == "VAGUE_REQUIREMENTS":
        # PLの専門性とプロジェクトドメインの一致チェック
        if pl.specialty == project_domain:
            # 一致している場合、有能なPLが要件をクリアにする
            project.customer.vague_level = max(0.0, project.customer.vague_level - 45.0)
            project.customer.satisfaction = min(100.0, project.customer.satisfaction + 15.0)
            return (f"🤝 【ヒアリング成功】\n"
                    f"  {pl.name}が専門知識({pl.specialty})を活かして渡辺部長のあいまいな要望を的確に言語化しました！\n"
                    f"  (納期: -1週間 / 初期顧客満足度 +15 / 要求あいまい度: -45% ➔ 現在: {project.customer.vague_level:.1f}%)")
        else:
            # ミスマッチの場合、時間だけ浪費（要件定義の罠）
            project.customer.vague_level = max(0.0, project.customer.vague_level - 15.0)
            project.customer.satisfaction = min(100.0, project.customer.satisfaction + 5.0)
            domain_jp = "バックエンド" if project_domain == "BE" else "フロントエンド"
            pl_spec_jp = "バックエンド" if pl.specialty == "BE" else "フロントエンド"
            return (f"🚨 【ヒアリングミスマッチ（要件定義の罠）】\n"
                    f"  今回は{domain_jp}中心の要件に対し、{pl.name}の専門知識({pl_spec_jp})が合致しませんでした。\n"
                    f"  技術的な議論が噛み合わず、時間（1週間）を浪費した割には要件があまり明確になりませんでした。\n"
                    f"  (納期: -1週間 / 初期顧客満足度 +5 / 要求あいまい度: -15% ➔ 現在: {project.customer.vague_level:.1f}%)")
    else:
        # 通常の顧客（品質・スピード重視）は、PLが同行すれば基本クリア
        if pl.specialty == project_domain:
            project.customer.vague_level = max(0.0, project.customer.vague_level - 50.0)
            project.customer.satisfaction = min(100.0, project.customer.satisfaction + 15.0)
            return f"🤝 {pl.name}の専門的リードにより、顧客の要求仕様が完璧にクリアになりました！ (初期顧客満足度 +15 / 要求あいまい度大幅低下)"
        else:
            project.customer.vague_level = max(0.0, project.customer.vague_level - 25.0)
            project.customer.satisfaction = min(100.0, project.customer.satisfaction + 10.0)
            return f"🤝 専門分野に少しズレがありましたが、{pl.name}のサポートにより要求仕様が整理されました。 (初期顧客満足度 +10 / 要求あいまい度低下)"


def generate_pl_estimation_report(project: Project, tasks: list[Task]) -> str:
    """PLによるスケジュール妥当性見積もりレポートを生成する"""
    pl = next((d for d in project.assigned_developers if d.role == "PL"), None)
    devs = [d for d in project.assigned_developers if d.role == "DEV"]
    
    if not pl or not devs:
        return "⚠️ PLまたは開発メンバーがアサインされていません。"
        
    project.has_evidence = True # レポートを確認したためエビデンスを保持
    
    # 未完了のタスク
    incomplete_tasks = [t for t in tasks if t.status != "DONE"]
    total_task_hours = sum(t.estimated_hours for t in incomplete_tasks)
    
    # 納期（日）と総稼働可能時間（通常稼働）
    deadline_days = project.deadline_weeks * 5
    available_hours_per_dev = deadline_days * 8.0
    total_available_hours = available_hours_per_dev * len(devs)
    
    # BE/FEタスクの集計
    be_task_hours = sum(t.estimated_hours for t in incomplete_tasks if t.skill_type == "BE")
    fe_task_hours = sum(t.estimated_hours for t in incomplete_tasks if t.skill_type == "FE")
    
    # BE/FE人員の有無
    has_be_dev = any(d.specialty == "BE" for d in devs)
    has_fe_dev = any(d.specialty == "FE" for d in devs)
    
    if pl.id == "pl_ken":
        # ケンPL: スキルミスマッチ効率を考慮した正確なシミュレーション
        estimated_actual_needed = 0.0
        for t in incomplete_tasks:
            if t.skill_type == "BE":
                if has_be_dev:
                    estimated_actual_needed += t.estimated_hours / 1.5
                else:
                    estimated_actual_needed += t.estimated_hours / 0.5
            else: # FE
                if has_fe_dev:
                    estimated_actual_needed += t.estimated_hours / 1.2
                else:
                    estimated_actual_needed += t.estimated_hours / 0.6
                    
        gap = total_available_hours - estimated_actual_needed
        
        report = f"📋 【ケンPLの見積もり監査レポート】\n"
        report += f"  ■ 分析内容:\n"
        report += f"    - 未完了タスク総見積もり: {total_task_hours:.1f} 人時 (BE: {be_task_hours:.1f}h / FE: {fe_task_hours:.1f}h)\n"
        report += f"    - スキル特性（ミスマッチ）を加味した実質必要開発時間: 約 {estimated_actual_needed:.1f} 時間\n"
        report += f"    - 納期までのチーム総稼働時間 (定時): {total_available_hours:.1f} 時間 (残り {project.deadline_weeks} 週間 / 開発者 {len(devs)} 名)\n"
        report += f"  ■ 妥当性判定:\n"
        
        if gap < -10.0:
            report += f"    🚨 深刻なスケジュール不足です！ 実質必要時間に対して、約 {-gap:.1f} 時間分 不足しています。\n"
            report += f"    （原因: メンバーの専門性とタスクのギャップ、あるいは納期設計の甘さがあります。納期延長か追加人員の交渉を強く進言します。）"
        elif gap < 15.0:
            report += f"    ⚠️ ギリギリ収まる見込みですが、バグ対応や仕様変更のバッファがありません。(余裕: {gap:.1f} 時間)\n"
            report += f"    （通常通り進める場合、バグが1件でも発生すると遅延します。開発方針をバグ優先にするか、何らかの対策費を確保しておくと安全です。）"
        else:
            report += f"    ✅ 納期内に十分に完了可能なスケジュールです。 (余裕: {gap:.1f} 時間)"
            
        return report
        
    else:
        # レンPL: 精度がブレる見積もり
        raw_gap = total_available_hours - total_task_hours
        random_error = random.randint(-30, 30)
        estimated_gap = raw_gap + random_error
        
        report = f"📋 【レンPLの状況報告レポート (※見積もり精度: 粗め)】\n"
        report += f"  ■ 分析内容:\n"
        report += f"    - 残りタスクの合計時間: {total_task_hours:.1f} 時間\n"
        report += f"    - 納期までの総稼働時間: {total_available_hours:.1f} 時間\n"
        report += f"  ■ 妥当性判定:\n"
        
        if estimated_gap < 0:
            report += f"    🚨 えーっと、たぶん納期に間に合いそうにありません。だいたい {-estimated_gap:.1f} 時間くらい足りない気がします……たぶん。\n"
            report += f"    （BEとFEの役割分担がうまく噛み合っていないような気もしますが、よく分かりません。納期を少し延ばしてもらったほうが無難かもしれません。）"
        else:
            report += f"    ❓ なんとかギリギリいけるんじゃないでしょうか？ (予測バッファ: {estimated_gap:.1f} 時間)\n"
            report += f"    （ただ、バグが出たら遅れるかもしれませんし、私の勘なのであまり自信はありません……）"
            
        return report


def auto_assign_tasks(project: Project, tasks: list[Task], logs: list[str], day_in_week: int):
    """PLが有効な場合、空いているDEVメンバーに自動でタスクをアサインする"""
    if not project.pl_active:
        return
        
    pl = next((d for d in project.assigned_developers if d.role == "PL"), None)
    if not pl:
        return

    # レンPLの場合、アサインにミスが発生しタイムロスする確率 (各日30%)
    if pl.id == "pl_ren" and random.random() < 0.30:
        logs.append(f"⚠️ [アサイン遅延] {pl.name}の指示がうまく伝わらず、今日の新規タスクの割り当ては見送られました。")
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
                # 専門性とタスクスキルのミスマッチ判定
                is_mismatch = False
                if dev.specialty == "BE" and assigned_task.skill_type == "FE":
                    is_mismatch = True
                    speed_mult = 0.6
                elif dev.specialty == "FE" and assigned_task.skill_type == "BE":
                    is_mismatch = True
                    speed_mult = 0.5
                elif dev.specialty == "BE" and assigned_task.skill_type == "BE":
                    speed_mult = 1.5
                elif dev.specialty == "FE" and assigned_task.skill_type == "FE":
                    speed_mult = 1.2
                else:
                    speed_mult = dev.work_speed
                
                # 進捗計算
                factor = calculate_work_factor(dev)
                effective_hours = hours * speed_mult * factor
                assigned_task.actual_hours += effective_hours
                
                progress_increase = (effective_hours / assigned_task.estimated_hours) * 100.0
                assigned_task.progress = min(100.0, assigned_task.progress + progress_increase)
                
                mismatch_sign = " (※スキルミスマッチ中)" if is_mismatch else ""
                logs.append(f"🛠 {dev.name} が「{assigned_task.name}」を作業中... ({assigned_task.progress:.0f}%){mismatch_sign}")
                
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
                    # ケンPLがアクティブな場合、バグ発生率が 15% 減少するパッシブ効果
                    bug_multiplier = 0.85 if (pl and pl.id == "pl_ken" and project.pl_active) else 1.0
                    # スキルミスマッチの場合、バグ発生率が 3 倍
                    if is_mismatch:
                        bug_multiplier *= 3.0
                        
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
        if unreported_bugs > 0:
            satisfaction_drop = unreported_bugs * 5.0
            project.customer.satisfaction -= satisfaction_drop
            project.manager_satisfaction -= unreported_bugs * 2.0
            logs.append(f"❌ 顧客はバグが隠されているのではないかと不審に思っています。")
        project.customer.satisfaction -= project.reported_bugs * 1.5
        
    elif project.customer.type == "SPEED_ORIENTED":
        total_progress = sum(t.progress for t in tasks)
        avg_progress = total_progress / len(tasks)
        
        expected_progress = (project.week / 4.0) * 100.0
        if avg_progress < expected_progress:
            delay_gap = expected_progress - avg_progress
            project.customer.satisfaction -= delay_gap * 0.5
            logs.append(f"❌ 開発スケジュールが想定より遅れています。")
            
    elif project.customer.type == "VAGUE_REQUIREMENTS":
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
    
    if project.customer.type == "VAGUE_REQUIREMENTS":
        rework_chance = (project.customer.vague_level / 100.0) * 0.70
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
    new_task = Task("T_EXTRA", "[追加] グラフ描画機能実装", 24.0, "FE")
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
    new_task = Task("T_REWORK", "[追加手戻り] 画面レイアウトの再調整", 24.0, "FE")
    tasks.append(new_task)
    dev.morale -= 30.0
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 15.0)
    return f"顧客の要望をそのまま {dev.name} に丸投げしました。{dev.name} の士気が著しく低下しました。"

def buffer_rework(project: Project, developers: list[Developer], tasks: list[Task], dev: Developer) -> str:
    from prototype.entities import Task
    new_task = Task("T_REWORK", "[追加手戻り] 画面レイアウトの再調整", 24.0, "FE")
    tasks.append(new_task)
    project.budget -= 30000
    dev.morale -= 5.0
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 5.0)
    return f"PMが調整に入り、納得感を持って {dev.name} に作業を依頼しました。費用 ¥30,000 を消費しましたが、士気の低下を抑えられました。"

def reject_rework(project: Project) -> str:
    project.customer.satisfaction = max(0.0, project.customer.satisfaction - 25.0)
    return "顧客の追加要望を断りました。顧客の満足度が大きく低下しました。"

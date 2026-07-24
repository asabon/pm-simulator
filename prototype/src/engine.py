import random

from prototype.src.entities import PM, Developer, Project, Task


def calculate_work_factor(dev: Developer) -> float:
    """士気と疲労による作業効率補正を計算する"""
    morale_factor = 0.5 + 0.5 * (dev.morale / 100.0)
    fatigue_factor = 1.0 - 0.5 * (dev.fatigue / 100.0)
    return morale_factor * fatigue_factor


def run_detailed_hearing(project: Project, tasks: list[Task], pm: PM = None) -> str:
    """PL同行による詳細ヒアリング（要件定義）を実行し、効果メッセージを返す"""
    pl = next((d for d in project.assigned_developers if d.role == "PL"), None)
    if not pl:
        return "⚠️ PLがアサインされていません。"

    if pm and pm.ap > 0:
        pm.ap -= 1  # APを1消費
        ap_msg = " (PM AP 1消費)"
    else:
        ap_msg = ""

    # プロジェクトのタスク特性比率の集計
    incomplete_tasks = [t for t in tasks if t.status != "DONE"]
    be_hours = sum(t.estimated_hours for t in incomplete_tasks if t.skill_type == "BE")
    fe_hours = sum(t.estimated_hours for t in incomplete_tasks if t.skill_type == "FE")
    project_domain = "BE" if be_hours >= fe_hours else "FE"

    # 納期を1週消費 (納期妥当性の星が1ダウン)
    project.deadline_weeks -= 1
    old_schedule_level = project.schedule_level
    project.schedule_level = max(1, project.schedule_level - 1)
    project.hearing_type = "DEEP"

    old_clarity = project.clarity_level

    if pl.specialty == project_domain:
        # 一致している場合、有能なPLが要件をクリアにする (要求具体度の星+3)
        project.clarity_level = min(5, project.clarity_level + 3)
        project.customer.satisfaction = min(100.0, project.customer.satisfaction + 15.0)
        return (
            f"🤝 【ヒアリング成功】{ap_msg}\n"
            f"  {pl.name}が専門知識({pl.specialty})を活かして顧客の要望を的確に言語化・整理しました！\n"
            f"  - 要求具体度: {'🌟' * old_clarity} ➔ {'🌟' * project.clarity_level} (+3)\n"
            f"  - 納期妥当性: {'🌟' * old_schedule_level} ➔ {'🌟' * project.schedule_level} (-1 / 納期1週間消費)\n"
            f"  - 初期顧客満足度 +15"
        )
    else:
        # ミスマッチの場合、時間だけ浪費（要件定義の罠 / 要求具体度の星+1）
        project.clarity_level = min(5, project.clarity_level + 1)
        project.customer.satisfaction = min(100.0, project.customer.satisfaction + 5.0)
        domain_jp = "バックエンド" if project_domain == "BE" else "フロントエンド"
        pl_spec_jp = "バックエンド" if pl.specialty == "BE" else "フロントエンド"
        return (
            f"🚨 【ヒアリングミスマッチ（要件定義の罠）】{ap_msg}\n"
            f"  今回は{domain_jp}中心の要件に対し、{pl.name}の専門知識({pl_spec_jp})が合致しませんでした。\n"
            f"  技術的な議論が噛み合わず、時間（1週間）を浪費した割には要件があまり明確になりませんでした。\n"
            f"  - 要求具体度: {'🌟' * old_clarity} ➔ {'🌟' * project.clarity_level} (+1)\n"
            f"  - 納期妥当性: {'🌟' * old_schedule_level} ➔ {'🌟' * project.schedule_level} (-1 / 納期1週間消費)\n"
            f"  - 初期顧客満足度 +5"
        )


def generate_pl_estimation_report(project: Project, tasks: list[Task]) -> str:
    """PLによるスケジュール妥当性見積もりレポートを生成する"""
    pl = next((d for d in project.assigned_developers if d.role == "PL"), None)
    if not pl:
        return "⚠️ PLがアサインされていません。"

    project.has_evidence = True  # レポートを確認したためエビデンスを保持

    if pl.id == "pl_ken":
        report = "📋 【ケンPLの見積もり監査レポート】\n"
        report += "  ■ 分析内容:\n"
        report += f"    - 要求具体度: {'🌟' * project.clarity_level} (レベル {project.clarity_level}/5)\n"
        report += f"    - 予算妥当性: {'🌟' * project.budget_level} (レベル {project.budget_level}/5)\n"
        report += f"    - 納期妥当性: {'🌟' * project.schedule_level} (レベル {project.schedule_level}/5)\n"
        report += "  ■ 妥当性判定:\n"

        if project.schedule_level <= 1:
            report += (
                "    🚨 深刻なスケジュール不足です！納期妥当性が極めて低く、このまま開始するとデスマーチになります。\n"
            )
            report += "    （対策案: 初期交渉で納期延長を申し入れ、納期妥当性を引き上げることを強く進言します。）"
        elif project.schedule_level == 2:
            report += "    ⚠️ ギリギリ完了可能ですが、仕様変更やバグ対応のバッファがありません。\n"
            report += "    （対策案: スコープ削減交渉で作業量を減らすか、開発方針をバグ優先にすることをお勧めします。）"
        else:
            report += "    ✅ 納期内に十分に完了可能なスケジュール設計です。"
        return report
    else:
        report = "📋 【レンPLの状況報告レポート (※見積もり精度: 粗め)】\n"
        report += "  ■ 妥当性判定:\n"

        if project.schedule_level <= 2:
            report += "    🚨 えーっと、たぶん納期に間に合いそうにありません。スケジュールがかなり厳しい気がします……たぶん。\n"
            report += "    （対策案: 納期を少し延ばしてもらったほうが無難かもしれません。）"
        else:
            report += "    ❓ なんとかギリギリいけるんじゃないでしょうか？\n"
            report += "    （バグが出たら遅れるかもしれませんし、私の勘なのであまり自信はありません……）"
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
                from prototype.src.entities import Task

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


def run_weekly_sprint(
    project: Project, tasks: list[Task], overtime_ids: set[str], resting_ids: set[str], pm: PM = None
) -> list[str]:
    """1週間（5営業日）分の開発シミュレーションを実行する"""
    logs = []
    developers = project.assigned_developers

    # 毎スプリントごとにPMのAPをリセット
    if pm:
        pm.reset_ap()
        logs.append(f"⚡ [PM AP回復] 今スプリントのAPが上限 ({pm.max_ap}) に回復しました。")

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
                    logs.append(
                        f"🚨 【PLボイコット】{dev.name} の士気が完全に失われました！「PMが現場に介入しすぎるなら、私はもう管理をやりません」と自律稼働を停止しました。"
                    )
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

            assigned_task = next(
                (t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None
            )

            if assigned_task:
                # 専門性とタスクスキルのミスマッチ判定
                if dev.specialty == "BE" and assigned_task.skill_type == "FE":
                    speed_mult = 0.6
                elif dev.specialty == "FE" and assigned_task.skill_type == "BE":
                    speed_mult = 0.5
                elif dev.specialty == "BE" and assigned_task.skill_type == "BE":
                    speed_mult = 1.3
                elif dev.specialty == "FE" and assigned_task.skill_type == "FE":
                    speed_mult = 1.3
                else:
                    speed_mult = 1.0

                work_factor = calculate_work_factor(dev)
                actual_progress = hours * dev.work_speed * speed_mult * work_factor
                assigned_task.progress += (actual_progress / assigned_task.estimated_hours) * 100.0

                # 疲労と士気の計算
                dev.fatigue += 6.0 if is_overtime else 3.0
                dev.morale -= 4.0 if is_overtime else 1.0

                mismatch_sign = " ⚠️[スキル相性低下中]" if speed_mult < 1.0 else ""
                logs.append(
                    f"🛠 {dev.name} が「{assigned_task.name}」を作業中... ({assigned_task.progress:.0f}%){mismatch_sign}"
                )

                # タスク完了判定
                if assigned_task.progress >= 100.0:
                    assigned_task.progress = 100.0
                    assigned_task.status = "DONE"
                    logs.append(f"✅ 「{assigned_task.name}」が完了しました！")

                    if assigned_task.id.startswith("BUG_FIX_"):
                        project.bugs_total = max(0, project.bugs_total - 1)
                        if project.reported_bugs > project.bugs_total:
                            project.reported_bugs = project.bugs_total
                        logs.append(f"🔧 バグが1件修正されました。(残バグ: {project.bugs_total}件)")
                    else:
                        # 通常タスク完了時のバグ混入判定
                        # 要求具体度(clarity_level)が高いとバグ混入率が劇的に下がる
                        clarity_bug_mult = max(0.2, 1.2 - (project.clarity_level * 0.2))
                        bug_chance = dev.base_bug_rate * (1.5 if is_overtime else 1.0) * clarity_bug_mult
                        if random.random() < bug_chance:
                            project.bugs_total += 1
                            logs.append(
                                f"⚠️ 「{assigned_task.name}」のコードにバグが混入しました。(総バグ: {project.bugs_total}件)"
                            )
            else:
                logs.append(f"😴 {dev.name} は待機状態です。")
                dev.fatigue = max(0.0, dev.fatigue - 5.0)

    # 2. 週終わりの顧客満足度・進捗チェック
    completed_hours = sum(t.estimated_hours for t in tasks if t.status == "DONE" and not t.id.startswith("BUG_FIX_"))
    total_hours = sum(t.estimated_hours for t in tasks if not t.id.startswith("BUG_FIX_"))
    avg_progress = (completed_hours / total_hours) * 100.0 if total_hours > 0 else 0.0

    # 期待進捗率
    total_weeks = project.deadline_weeks + project.week - 1
    expected_progress = (project.week / total_weeks) * 100.0 if total_weeks > 0 else 100.0

    if avg_progress < expected_progress:
        delay_gap = expected_progress - avg_progress
        project.customer.satisfaction -= delay_gap * 0.3
        logs.append(
            f"❌ 開発スケジュールが想定より遅れています。(進捗: {avg_progress:.0f}% / 期待: {expected_progress:.0f}%)"
        )

    project.week += 1
    project.deadline_weeks -= 1

    return logs


def check_urgent_events(project: Project, pm: PM) -> dict:
    """開発中に発生する突発・緊急アラートイベント（AP消費を要する）をチェックする"""
    developers = project.assigned_developers

    # 1. メンバー過労アラート
    fatigued_dev = next((d for d in developers if d.fatigue >= 75 and not d.is_retired), None)
    if fatigued_dev:
        return {
            "type": "MEMBER_OVERWORK",
            "title": f"🚨 【緊急アラート】{fatigued_dev.name} が限界寸前です！",
            "description": f"{fatigued_dev.name} の疲労が {fatigued_dev.fatigue:.0f}/100 に達しています。このまま放置すると過労で離職・ボイコットに繋がります！",
            "target": fatigued_dev,
        }

    # 2. 顧客クレームアラート
    if project.customer.satisfaction <= 40.0:
        return {
            "type": "CUSTOMER_ANGER",
            "title": f"🚨 【緊急アラート】顧客の {project.customer.name} が激怒しています！",
            "description": f"顧客満足度が {project.customer.satisfaction:.1f}% まで低下しました。直ちに対応しなければ契約打ち切りやペナルティに発展します。",
            "target": project.customer,
        }

    return None


def trigger_event(project: Project, tasks: list[Task]) -> dict:
    """週の終わりに定例/ランダムイベントを発生させる"""
    developers = project.assigned_developers

    rework_chances = {1: 0.80, 2: 0.50, 3: 0.30, 4: 0.15, 5: 0.05}
    chance = rework_chances.get(project.clarity_level, 0.30)

    if random.random() < chance:
        target_dev = random.choice([d for d in developers if d.role == "DEV"])
        return {
            "id": "rework_request",
            "title": "顧客からの追加要望（手戻り）",
            "description": f"顧客の{project.customer.name}から、「出来上がってきたモジュールの仕様について、追加で機能変更してほしい」と要求がありました。追加タスク「画面レイアウトの再調整」(24時間) が発生します。",
            "choices": [
                {
                    "text": f"要望をそのまま開発者に丸投げする (顧客満足度+15, 担当の {target_dev.name} の士気-30)",
                    "action": lambda p, d, t: pass_through_rework(p, d, t, target_dev),
                },
                {
                    "text": f"防波堤としてPMが間に入り調整する (調整費用 ¥30,000 消費, 顧客満足度+5, {target_dev.name} の士気-5)",
                    "action": lambda p, d, t: buffer_rework(p, d, t, target_dev),
                },
                {
                    "text": "交渉して追加要望を断る (タスク追加なし, 顧客満足度-25)",
                    "action": lambda p, d, t: reject_rework(p),
                },
            ],
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
                    "action": lambda p, d, t: accept_spec_change(p, t),
                },
                {"text": "交渉して断る (顧客満足度-15)", "action": lambda p, d, t: refuse_spec_change(p)},
            ],
        },
        {
            "id": "bug_discovery",
            "title": "テスト環境でのバグ発覚",
            "description": "開発中のシステムにバグが潜んでいるのではないかと、顧客側が疑念を持っています。正直にバグ状況を報告しますか？",
            "choices": [
                {
                    "text": f"正直に報告する (報告済バグ数を {project.bugs_total}件 に更新。顧客満足度-10, 上司信頼+5)",
                    "action": lambda p, d, t: report_bugs_honestly(p),
                },
                {
                    "text": "「問題ありません」と隠し通す (顧客満足度変化なし。ただし未報告のまま放置するとペナルティ累積)",
                    "action": lambda p, d, t: hide_bugs(p),
                },
            ],
        },
    ]

    return random.choice(events)


# アクション関数
def accept_spec_change(project: Project, tasks: list[Task]) -> str:
    project.budget += 200000
    from prototype.src.entities import Task

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
    from prototype.src.entities import Task

    new_task = Task("T_REWORK", "[追加手戻り] 画面レイアウトの再調整", 24.0, "FE")
    tasks.append(new_task)
    dev.morale -= 30.0
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 15.0)
    return f"顧客の要望をそのまま {dev.name} に丸投げしました。{dev.name} の士気が著しく低下しました。"


def buffer_rework(project: Project, developers: list[Developer], tasks: list[Task], dev: Developer) -> str:
    from prototype.src.entities import Task

    new_task = Task("T_REWORK", "[追加手戻り] 画面レイアウトの再調整", 24.0, "FE")
    tasks.append(new_task)
    project.budget -= 30000
    dev.morale -= 5.0
    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 5.0)
    return f"PMが調整に入り、納得感を持って {dev.name} に作業を依頼しました。費用 ¥30,000 を消費しましたが、士気の低下を抑えられました。"


def reject_rework(project: Project) -> str:
    project.customer.satisfaction = max(0.0, project.customer.satisfaction - 25.0)
    return "顧客の追加要望を断りました。顧客の満足度が大きく低下しました。"


def process_yearly_closing(pm: PM, developers: list[Developer]) -> list[str]:
    """プロジェクトクロージングおよび年度更新（加齢・退職・新人配属・解像度向上）を行う"""
    logs = []
    pm.completed_projects += 1
    pm.career_years += 1

    logs.append(f"\n🎉 【年度更新・人事サイクル処理】(PMキャリア {pm.career_years}年目に入ります)")

    retired_names = []
    for dev in developers:
        # 1. 加齢
        dev.age += 1

        # 2. 協働による解像度の向上 (未知 ➔ 粗い ➔ 精緻)
        if dev.resolution < 2:
            dev.resolution += 1
            logs.append(f"🔍 {dev.name} との協働により、パラメータの解像度が上がりました！ (レベル {dev.resolution})")

        # 3. 定年退職判定 (65歳)
        if dev.age >= 65 and not dev.is_retired:
            dev.is_retired = True
            retired_names.append(dev.name)
            logs.append(f"💐 {dev.name} が65歳を迎え、定年退職しました。長年の貢献に感謝します！")

    # 定年退職者の除外
    developers[:] = [d for d in developers if not d.is_retired]

    # 4. 新入社員の自動配属
    from prototype.src.data import generate_new_graduate

    new_grad = generate_new_graduate(pm.completed_projects)
    developers.append(new_grad)
    logs.append(f"✨ チームに新入社員 {new_grad.name} (22歳 / {new_grad.specialty}専門) が配属されました！")

    return logs

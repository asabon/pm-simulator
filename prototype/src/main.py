import sys

from prototype.src.data import get_dev_candidates, get_initial_project_data, get_pl_candidates
from prototype.src.engine import (
    check_urgent_events,
    generate_pl_estimation_report,
    process_yearly_closing,
    run_detailed_hearing,
    run_weekly_sprint,
    trigger_event,
)
from prototype.src.entities import PM


def print_header(title: str):
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)


SKILL_LABEL = {"BE": "サーバー側", "FE": "画面側"}


def show_status(project, developers, tasks, pm: PM):
    print_header(f"WEEK {project.week} - スプリント状況 (PM AP: {pm.ap}/{pm.max_ap})")
    print(f"【プロジェクト】: {project.name} (PMキャリア: {pm.career_years}年目)")
    print(f"【 残 予 算 】: ¥{project.budget:,}  |  【 納 期 】: あと {project.deadline_weeks} 週間")
    print(
        f"【要求具体度】: {'🌟' * project.clarity_level:<5} | 【予算妥当性】: {'🌟' * project.budget_level:<5} | 【納期妥当性】: {'🌟' * project.schedule_level:<5}"
    )
    print(f"【上司最重視期待】: {project.priority_expectation}")
    print(f"【総バグ数】: {project.bugs_total} 件 (報告済: {project.reported_bugs} 件)")

    # 顧客情報
    print(
        f"【顧客満足度】: {project.customer.satisfaction:.1f}% ({project.customer.name} / タイプ: {project.customer.type})"
    )
    print(f"【上司信頼度】: {project.manager_satisfaction:.1f}%")

    # PL管理状況
    pl = next((d for d in developers if d.role == "PL"), None)
    pl_status = f"自律稼働中 ({pl.name})" if pl else "アサインなし"
    if pl and not project.pl_active:
        pl_status = f"🚨 ボイコット中 ({pl.name})"

    direction_jp = "進捗優先" if project.direction == "NORMAL" else "バグ修正優先"
    print(f"【 PL 管理 】: {pl_status}  |  【開発方針】: {direction_jp}")

    print("\n■ 開発体制とチームの状態（解像度メカニクス適用）")
    for dev in developers:
        assigned_task = next(
            (t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None
        )
        task_info = f"担当: {assigned_task.name} ({assigned_task.progress:.0f}%)" if assigned_task else "担当: なし"

        role_label = f"({dev.role} / {SKILL_LABEL.get(dev.specialty, dev.specialty)}専門)"
        print(f" - {dev.name:<22} {role_label:<14} {task_info}")
        print(f"   ステータス情報 ➔ {dev.get_status_display()}")
        print(f"   発言: {dev.speak(assigned_task)}")

    print("\n■ タスクボード")
    todo_tasks = [t for t in tasks if t.status == "TODO" and not t.id.startswith("BUG_FIX_")]
    in_progress_tasks = [t for t in tasks if t.status == "IN_PROGRESS"]
    done_tasks = [t for t in tasks if t.status == "DONE" and not t.id.startswith("BUG_FIX_")]

    print(
        f" [TODO]        ({len(todo_tasks)}件): "
        + ", ".join(
            [f"{t.name}({t.estimated_hours}h/{SKILL_LABEL.get(t.skill_type, t.skill_type)})" for t in todo_tasks]
        )
    )
    print(
        f" [IN PROGRESS] ({len(in_progress_tasks)}件): "
        + ", ".join(
            [f"{t.name}({t.progress:.0f}%/{SKILL_LABEL.get(t.skill_type, t.skill_type)})" for t in in_progress_tasks]
        )
    )
    print(
        f" [DONE]        ({len(done_tasks)}件): "
        + ", ".join([f"{t.name}({SKILL_LABEL.get(t.skill_type, t.skill_type)})" for t in done_tasks])
    )
    print("=" * 60)


def main():
    # Windows環境等でのUnicode出力エラー（絵文字等）対策
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    pm = PM()

    print_header("PM Simulator - 通年キャリアマネジメント・プロトタイプ")
    print("【仕様書 game_design.md 完全準拠版】")
    print("ゲームの目的: PMとして長年にわたりプロジェクトを成功させ、キャリア評価を高めること。")
    print("万能の解決策はありません。現場のPLを信頼しつつ、APを適切に配分してタイムマネジメントを行いましょう。")

    # チームプール（年度を跨いで引き継がれる開発メンバー）
    team_pool = get_dev_candidates()
    pl_pool = get_pl_candidates()

    project_counter = 1

    # 通年キャリアマネジメントのループ (複数プロジェクトを跨いでプレイ)
    while True:
        print_header(f"第 {project_counter} 期 プロジェクト開始 (PMキャリア {pm.career_years}年目)")

        # 顧客タイプの選択
        print("顧客のタイプを選択してください:")
        print("1: 品質重視 (品質に妥協がなく、未報告のバグがあると満足度が激しく低下する)")
        print("2: スピード重視 (とにかく納期優先。進捗が遅れると満足度が徐々に低下する)")
        print("3: 要件あいまい (仕様が未確定で追加要求・手戻りが多発。PMの防波堤能力が試される)")
        choice = input("選択 (デフォルト: 1): ")

        c_type = "SPEED_ORIENTED" if choice == "2" else ("VAGUE_REQUIREMENTS" if choice == "3" else "QUALITY_ORIENTED")

        project, tasks = get_initial_project_data(project_counter, customer_type=c_type)

        # --- PHASE 1: プロジェクトキックオフフェーズ ---
        print_header("PHASE 1: プロジェクトキックオフ")
        print(f"【上司からの打診】: {project.name} のPMを担当してください。")
        print(f"【上司の最優先期待】: 『{project.priority_expectation}』 を最も重視して運営してください！")
        print("\n現在の初期レベル感:")
        print(f"  - 要求具体度: {'🌟' * project.clarity_level} (レベル {project.clarity_level}/5)")
        print(
            f"  - 予算妥当性: {'🌟' * project.budget_level} (レベル {project.budget_level}/5) ➔ 予算額: ¥{project.budget:,}"
        )
        print(
            f"  - 納期妥当性: {'🌟' * project.schedule_level} (レベル {project.schedule_level}/5) ➔ 納期: {project.deadline_weeks} 週間"
        )

        # 体制構築
        print_header("キックオフ Step 2: 体制構築（メンバー選定）")
        print("所属メンバープールから今期のPLおよび開発メンバーをアサインしてください。")

        # PLのアサイン
        print("\n[PL（プロジェクトリーダー）を選択してください]:")
        for idx, pl_cand in enumerate(pl_pool):
            print(
                f"{idx + 1}: {pl_cand.name} (日当: ¥{pl_cand.salary:,} / 専門: {pl_cand.specialty}) - {pl_cand.get_status_display()}"
            )
        pl_choice = input("選択 (デフォルト: 1): ")
        selected_pl = pl_pool[1] if pl_choice == "2" else pl_pool[0]
        project.assigned_developers.append(selected_pl)
        print(f"➔ {selected_pl.name} をPLとしてアサインしました。")

        # DEVのアサイン
        print("\n[開発メンバーをチームに組み込みます]:")
        for dev_cand in team_pool:
            if dev_cand.is_retired:
                continue
            print(f" - {dev_cand.name} (日当: ¥{dev_cand.salary:,}) ➔ {dev_cand.get_status_display()}")
            u_input = input("  アサインしますか？ (y/n, デフォルト: y): ")
            if u_input.lower() != "n":
                project.assigned_developers.append(dev_cand)
                print(f"  ➔ {dev_cand.name} をアサインしました。")

        if len([d for d in project.assigned_developers if d.role == "DEV"]) == 0:
            print("⚠️ DEVメンバーが0名のため、自動的に候補を追加アサインしました。")
            project.assigned_developers.append(team_pool[0])

        # 事前防衛交渉（ヒアリング等）
        print_header("キックオフ Step 3: 前提確認と事前交渉")
        print(f"現在のアクションポイント (PM AP: {pm.ap}/{pm.max_ap})")
        print("1: 丁寧な要件ヒアリングを行う (AP 1消費, 要求具体度向上、納期1週消費)")
        print("2: PLの見積もり監査レポートを確認する (無料、リスク状況を可視化)")
        print("3: 交渉を行わずすぐにプロジェクトを開始する")
        k_choice = input("選択 (デフォルト: 2): ")

        if k_choice == "1":
            print(run_detailed_hearing(project, tasks, pm))
        elif k_choice == "2":
            print(generate_pl_estimation_report(project, tasks))

        input("\n[Enterキーで第2フェーズ（プロジェクト進行）へ]")

        # --- PHASE 2: プロジェクト進行フェーズ (イベント駆動型) ---
        print_header("PHASE 2: プロジェクト進行フェーズ (イベント駆動型)")

        while project.deadline_weeks > 0 and any(t.status != "DONE" for t in tasks):
            show_status(project, project.assigned_developers, tasks, pm)

            # 突発・緊急アラートイベントのチェック
            urgent_event = check_urgent_events(project, pm)
            if urgent_event:
                print_header(urgent_event["title"])
                print(urgent_event["description"])
                print(f"現在の PM AP: {pm.ap}/{pm.max_ap}")
                print("対応アクションを選択してください:")
                print("1: 【面談/ケア】対象者と緊急面談・1on1を実施する (AP 1消費: 疲労回復・解像度開示)")
                print("2: 【顧客交渉】顧客と打ち合わせ、納期の延長を要請する (AP 1消費: 納期+1週, 満足度少し低下)")
                print(
                    "3: 【上司報告】上司に緊急エスカレーションする (AP 1消費: 追加予算 ¥200,000 獲得, 上司評価少し低下)"
                )
                print("4: 【方針変更】開発方針を『バグ優先』に変更する (AP 0消費)")
                print("5: 特に何もしない (放置)")

                u_act = input("選択: ")
                if u_act == "1" and pm.ap > 0:
                    pm.ap -= 1
                    target_dev = urgent_event.get("target")
                    if hasattr(target_dev, "fatigue"):
                        target_dev.fatigue = max(0.0, target_dev.fatigue - 40.0)
                        target_dev.morale = min(100.0, target_dev.morale + 20.0)
                        target_dev.resolution = min(2, target_dev.resolution + 1)
                        print(f"➔ {target_dev.name} と面談を行い、疲労を大幅にケアしました！解像度も向上しました。")
                elif u_act == "2" and pm.ap > 0:
                    pm.ap -= 1
                    project.deadline_weeks += 1
                    project.customer.satisfaction = max(0.0, project.customer.satisfaction - 10.0)
                    print("➔ 顧客との粘り強い交渉により、納期を1週間延長させました！")
                elif u_act == "3" and pm.ap > 0:
                    pm.ap -= 1
                    project.budget += 200000
                    project.manager_satisfaction = max(0.0, project.manager_satisfaction - 5.0)
                    print("➔ 上司へエスカレーションし、追加予算 ¥200,000 を獲得しました！")
                elif u_act == "4":
                    project.direction = "BUG_FIRST"
                    print("➔ 開発方針を『バグ優先』に変更しました。")

            # プレイヤーコマンド受付
            print("\nPMコマンド選択:")
            print(" 1: スプリントを進める (1週間経過)")
            print(" 2: 開発方針の変更 (現在: " + ("進捗優先" if project.direction == "NORMAL" else "バグ優先") + ")")
            print(" 3: メンバーと1on1面談を実施 (AP 1消費: 指定メンバーの疲労回復 ＆ 解像度UP)")
            print(" 4: 上司へ定期進捗報告 (AP 1消費: 上司信頼度向上)")
            cmd = input("コマンド (デフォルト: 1): ")

            overtime_ids = set()
            resting_ids = set()

            if cmd == "2":
                project.direction = "BUG_FIRST" if project.direction == "NORMAL" else "NORMAL"
                print(
                    f"➔ 開発方針を 『{'進捗優先' if project.direction == 'NORMAL' else 'バグ優先'}』 に切り替えました。"
                )
            elif cmd == "3" and pm.ap > 0:
                pm.ap -= 1
                print("\n面談するメンバーを選択してください:")
                for idx, dev in enumerate(project.assigned_developers):
                    print(f" {idx + 1}: {dev.name}")
                m_choice = input("選択: ")
                try:
                    idx = int(m_choice) - 1
                    m_dev = project.assigned_developers[idx]
                    m_dev.fatigue = max(0.0, m_dev.fatigue - 30.0)
                    m_dev.morale = min(100.0, m_dev.morale + 15.0)
                    m_dev.resolution = min(2, m_dev.resolution + 1)
                    print(f"➔ {m_dev.name} と1on1を実施しました！(疲労回復・解像度UP)")
                except (ValueError, IndexError):
                    print("選択がキャンセルされました。")
            elif cmd == "4" and pm.ap > 0:
                pm.ap -= 1
                project.manager_satisfaction = min(100.0, project.manager_satisfaction + 10.0)
                print("➔ 上司へ定例報告を行いました。上司信頼度が上昇しました！")

            # 残業・休暇指示の設定
            print("\n【今週の個別指示 (オプション)】")
            u_ot = input("残業を指示するメンバーの番号 (カンマ区切り、空欄でなし): ")
            if u_ot.strip():
                try:
                    indices = [int(i.strip()) - 1 for i in u_ot.split(",") if i.strip()]
                    for idx in indices:
                        if 0 <= idx < len(project.assigned_developers):
                            overtime_ids.add(project.assigned_developers[idx].id)
                except ValueError:
                    pass

            # 1週間分のシミュレーション実行
            logs = run_weekly_sprint(project, tasks, overtime_ids, resting_ids, pm)
            print_header(f"WEEK {project.week - 1} 実行結果ログ")
            for log in logs:
                print(log)

            # 定例/ランダムイベントのチェック
            event = trigger_event(project, tasks)
            if event:
                print_header(f"イベント発生: {event['title']}")
                print(event["description"])
                for idx, choice in enumerate(event["choices"]):
                    print(f" {idx + 1}: {choice['text']}")
                e_choice = input("選択: ")
                try:
                    c_idx = int(e_choice) - 1
                    res_msg = event["choices"][c_idx]["action"](project, project.assigned_developers, tasks)
                    print(f"➔ {res_msg}")
                except (ValueError, IndexError):
                    res_msg = event["choices"][0]["action"](project, project.assigned_developers, tasks)
                    print(f"➔ {res_msg}")

            input("\n[Enterキーで次の週へ]")

        # --- PHASE 3: プロジェクトクロージング ＆ 人事更新フェーズ ---
        print_header("PHASE 3: プロジェクトクロージング ＆ 人事・組織更新")

        # 評価計算
        completed_tasks = [t for t in tasks if t.status == "DONE" and not t.id.startswith("BUG_FIX_")]
        completion_rate = (len(completed_tasks) / len([t for t in tasks if not t.id.startswith("BUG_FIX_")])) * 100.0

        print(f"【最終タスク完了率】: {completion_rate:.1f}%")
        print(f"【最終顧客満足度  】: {project.customer.satisfaction:.1f}%")
        print(f"【最終上司信頼度  】: {project.manager_satisfaction:.1f}%")
        print(f"【最終残予算      】: ¥{project.budget:,}")

        # プレイスコア算出
        proj_score = (
            (completion_rate * 0.4) + (project.customer.satisfaction * 0.3) + (project.manager_satisfaction * 0.3)
        )
        print(f"\n🏆 今回のプロジェクト総合評価スコア: {proj_score:.1f} / 100 点")

        # 年度更新（人事サイクル処理）
        closing_logs = process_yearly_closing(pm, team_pool)
        for cl in closing_logs:
            print(cl)

        project_counter += 1
        cont = input("\n次のプロジェクト（次年度）へ進みますか？ (y/n): ")
        if cont.lower() == "n":
            print_header("通年キャリアマネジメント 終了")
            print(f"PMとしての通算キャリア: {pm.career_years} 年")
            print(f"完了プロジェクト数: {pm.completed_projects} 件")
            print("お疲れ様でした！シミュレーションを終了します。")
            break


if __name__ == "__main__":
    main()

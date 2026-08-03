import sys

from prototype.src.data import get_initial_developer_pool, get_initial_project_data
from prototype.src.engine import (
    calculate_final_score,
    evaluate_project_status,
    process_yearly_closing,
    run_weekly_sprint,
)
from prototype.src.entities import PM, Team
from prototype.src.kickoff import KickoffPhase


def print_header(title: str):
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)


def show_member_details(developers: list):
    print_header("チームメンバー詳細パラメータ・解像度一覧")
    for dev in developers:
        print(f" - {dev.name:<10} ({dev.assigned_role})")
        print(f"   ステータス情報 ➔ {dev.get_status_display()}")
    print("=" * 60)


def show_status(project, developers, tasks, pm: PM):
    print_header(f"WEEK {project.week} - スプリント状況 (PM AP: {pm.ap}/{pm.max_ap})")
    print(f"【プロジェクト】: {project.name} (PMキャリア: {pm.career_years}年目)")
    print(f"【 納 期 】: あと {project.deadline_weeks} 週間")
    print(
        f"【要求具体度】: {'🌟' * project.clarity_level:<5} | 【予算妥当性】: {'🌟' * project.budget_level:<5} | 【納期妥当性】: {'🌟' * project.schedule_level:<5}"
    )
    print(f"【上司最重視期待】: {project.priority_expectation}")
    print(f"【総バグ数】: {project.bugs_total} 件 (報告済: {project.reported_bugs} 件)")

    # 顧客情報
    cust_type_label = (
        {
            "QUALITY_ORIENTED": "品質重視",
            "SPEED_ORIENTED": "スピード重視",
            "VAGUE_REQUIREMENTS": "要件探り出し",
        }.get(project.customer.type, project.customer.type)
        if project.customer.revealed
        else "隠蔽中 [?] (対話・ヒアリングで確定)"
    )
    method_label = "🌊 ウォーターフォール型" if project.methodology == "WATERFALL" else "🔄 アジャイル型"
    print(
        f"【顧客満足度】: {project.customer.satisfaction:.1f}% ({project.customer.name} / 優先特性: {cust_type_label})"
    )
    print(f"【開発手法】: {method_label}  |  【上司信頼度】: {project.manager_satisfaction:.1f}%")

    # PLの存在と現場報告 (PL主導の表示)
    pl = next((d for d in developers if d.assigned_role == "PL"), None)
    print("\n🗣️ 【PL (現場リーダー) からの現場状況報告】")
    if pl:
        print(f"  ・担当PL  : {pl.name} (統率力: {pl.leadership_skill}/5)")
        print(f"  ・PLコメント: {pl.speak()}")
    else:
        print("  ・担当PL  : なし")

    direction_jp = "進捗優先" if project.direction == "NORMAL" or project.direction == "SPEED" else "バグ修正優先"
    print(f"  ・現在方針: 『{direction_jp}』")

    print("\n👥 【現場チームの稼働状況】")
    devs = [d for d in developers if d.assigned_role == "DEV"]
    for dev in devs:
        fatigue_str = "高" if dev.fatigue >= 70 else ("中" if dev.fatigue >= 40 else "良好")
        print(f"  - {dev.name:<8} (DEV) | 状態: 稼働中 | 疲労: {fatigue_str}")

    # ハイレベル進捗率の算出
    total_hours = sum(t.estimated_hours for t in tasks if not t.id.startswith("BUG_FIX_"))
    completed_hours = sum(t.estimated_hours * (t.progress / 100.0) for t in tasks if not t.id.startswith("BUG_FIX_"))
    overall_progress = (completed_hours / total_hours * 100.0) if total_hours > 0 else 0.0

    print(f"\n📊 【全体プロジェクト進捗率】: {overall_progress:.1f}%")
    print("=" * 60)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    pm = PM()

    print_header("PM Simulator - 通年キャリアマネジメント・プロトタイプ")
    print("【仕様書 game_design.md 完全準拠版】")
    print("ゲームの目的: PMとして長年にわたりプロジェクトを成功させ、キャリア評価を高めること。")
    print("現場のPL（プロジェクトリーダー）を信頼し、PLとの対話・方針協調を軸にタイムマネジメントを行いましょう。")

    team_pool = get_initial_developer_pool()
    project_counter = 1

    while True:
        print_header(f"第 {project_counter} 期 プロジェクト開始 (PMキャリア {pm.career_years}年目)")

        project, tasks = get_initial_project_data(project_counter)

        # --- PHASE 1: プロジェクトキックオフフェーズ ---
        team = Team(team_id="main_dev_team", name="メイン開発チーム")
        selected_pl = next(
            (p for p in team_pool if getattr(p, "is_pl_qualified", False) and not getattr(p, "is_retired", False)),
            team_pool[0],
        )
        team.set_leader(selected_pl)

        for dev_cand in team_pool:
            if dev_cand == selected_pl or getattr(dev_cand, "is_retired", False):
                continue
            team.assign_member(dev_cand)

        project.register_team(team)
        pl = team.leader

        # 新しいキックオフフェーズの実行
        kickoff_engine = KickoffPhase(project, team, pm)
        kickoff_engine.run()

        # --- PHASE 2: プロジェクト進行フェーズ ---
        print_header("PHASE 2: プロジェクト進行フェーズ")

        while True:
            status = evaluate_project_status(project, tasks)
            if status != "IN_PROGRESS":
                break

            show_status(project, project.get_all_developers(), tasks, pm)

            print("\n【今週のPMコマンド】(残り AP: " + str(pm.ap) + "/" + str(pm.max_ap) + ")")
            print(" 1: PLへ現場スプリントの推進を指示する (消化速度向上 / 疲労度若干UP)")
            print(" 2: PLと要件・顧客対応の打ち合わせを行う (AP 1消費: 要件明確化, 顧客満足度+10)")
            print(" 3: PLと1on1を実施し現場のメンタルケア方針を共有する (AP 1消費: 全員の疲労-20, 士気+15)")
            print(" 4: プロジェクト全体サマリー・詳細情報を確認する (無料)")
            print(" 5: ターンを進める (次週へ)")

            cmd = input("選択 (デフォルト: 1): ").strip()

            if cmd == "2":
                if pm.ap > 0:
                    pm.ap -= 1
                    project.customer.satisfaction = min(100.0, project.customer.satisfaction + 10.0)
                    project.clarity_level = min(5, project.clarity_level + 1)
                    print(f"➔ PL({pl.name if pl else 'リーダー'})と要件を整理し、顧客対話を強化しました！")
                else:
                    print("⚠️ APが不足しています。")
            elif cmd == "3":
                if pm.ap > 0:
                    pm.ap -= 1
                    for dev in project.get_all_developers():
                        dev.fatigue = max(0.0, dev.fatigue - 20.0)
                        dev.morale = min(100.0, dev.morale + 15.0)
                    print(f"➔ PL({pl.name if pl else 'リーダー'})と1on1を実施し、チーム全体の負荷を緩和しました！")
                else:
                    print("⚠️ APが不足しています。")
            elif cmd == "4":
                print("\n" + project.get_status_summary())
                input("\n[Enterキーでメニューに戻る]")
                continue
            elif cmd == "1" or cmd == "":
                project.direction = "SPEED"
                print(f"➔ PL({pl.name if pl else 'リーダー'})へ「進捗優先」のスプリント指示を出しました。")

            overtime_ids = set()
            resting_ids = set()
            logs = run_weekly_sprint(project, tasks, overtime_ids, resting_ids, pm)
            print_header(f"WEEK {project.week - 1} 実行結果")
            for log in logs:
                print(log)

            status = evaluate_project_status(project, tasks)
            if status != "IN_PROGRESS":
                break

        # --- PHASE 3: プロジェクトクロージング ＆ 結果発表 ---
        print_header("PHASE 3: プロジェクトクロージング ＆ 結果発表")

        final_status = evaluate_project_status(project, tasks)
        if final_status == "SUCCESS":
            print("🎉 【祝・プロジェクト完了！】")
            print(f"  納期内に全タスクを納品し、顧客 {project.customer.name} から感謝の言葉をいただきました！")
        elif final_status == "FAILED_DEADLINE":
            print("🚨 【プロジェクト失敗: 納期超過】")
            print("  契約納期までに作業が完了せず、炎上案件となってしまいました……。")
        elif final_status == "FAILED_OVERWORK":
            print("🚨 【プロジェクト失敗: 現場崩壊・過労】")
            print("  メンバーの過半数が極度な過労・不満に陥り、開発体制が崩壊しました……。")
        elif final_status == "FAILED_CUSTOMER":
            print("🚨 【プロジェクト失敗: 顧客契約解除】")
            print("  顧客満足度がゼロになり、プロジェクトが打ち切られました……。")

        score_info = calculate_final_score(project, pm)

        print("\n📊 【最終評価リザルト】")
        print(f"  ・総合評価スコア: {score_info['total_score']} / 100.0 点")
        print(f"  ・最終評価ランク: {score_info['rank']}")
        print(f"  ・顧客満足度スコア: {score_info['customer_score']} 点")
        print(f"  ・上司評価スコア  : {score_info['manager_score']} 点")
        print(f"  ・チーム健全性    : {score_info['team_score']} 点 (平均疲労度: {score_info['avg_fatigue']})")

        closing_logs = process_yearly_closing(pm, team_pool)
        for cl in closing_logs:
            print(cl)

        project_counter += 1
        cont = input("\n次のプロジェクト（次年度）へ進みますか？ (y/n, デフォルト: n): ").strip()
        if cont.lower() != "y":
            print_header("通年キャリアマネジメント 終了")
            print(f"PMとしての通算キャリア: {pm.career_years} 年")
            print(f"完了プロジェクト数: {pm.completed_projects} 件")
            print("お疲れ様でした！シミュレーションを終了します。")
            break


if __name__ == "__main__":
    main()

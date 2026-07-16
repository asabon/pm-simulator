import sys
from prototype.data import get_initial_data
from prototype.engine import next_day_cycle, trigger_event

def print_header(title: str):
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)

def show_status(project, developers, tasks):
    print_header(f"DAY {project.day} - プロジェクト状況")
    print(f"【プロジェクト】: {project.name}")
    print(f"【 残 予 算 】: ¥{project.budget:,}  |  【 納 期 】: あと {project.deadline_days} 日")
    print(f"【総バグ数】: {project.bugs_total} 件 (報告済: {project.reported_bugs} 件)")
    print(f"【顧客満足度】: {project.customer.satisfaction:.1f}% ({project.customer.name} / タイプ: {project.customer.type})")
    print(f"【上司信頼度】: {project.manager_satisfaction:.1f}%")
    
    print("\n■ 開発者メンバー状態")
    for dev in developers:
        # アサインタスクの確認
        assigned_task = next((t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None)
        task_info = f"担当: {assigned_task.name} ({assigned_task.progress:.1f}%)" if assigned_task else "担当: なし"
        
        # 隠しパラメータの表示判定
        if dev.reveal_duration > 0:
            status_details = f"[疲労: {dev.fatigue:.0f}/100, 士気: {dev.morale:.0f}/100]"
        else:
            status_details = "[ステータス: 隠蔽中]"
            
        print(f" - {dev.name:<18} {status_details:<25} {task_info}")
        print(f"   サイン: {dev.get_sign()}")

    print("\n■ タスクボード")
    todo_tasks = [t for t in tasks if t.status == "TODO"]
    in_progress_tasks = [t for t in tasks if t.status == "IN_PROGRESS"]
    done_tasks = [t for t in tasks if t.status == "DONE"]
    
    print(f" [TODO]        ({len(todo_tasks)}件): " + ", ".join([f"{t.name}({t.estimated_hours}h)" for t in todo_tasks]))
    print(f" [IN PROGRESS] ({len(in_progress_tasks)}件): " + ", ".join([f"{t.name}({t.progress:.0f}%)" for t in in_progress_tasks]))
    print(f" [DONE]        ({len(done_tasks)}件): " + ", ".join([t.name for t in done_tasks]))
    print("=" * 60)

def main():
    print_header("PM Simulator - CLI Prototype")
    print("ゲームの目的: プロジェクトを成功させ、上司（上級マネージャー）を満足させること。")
    print("上司の期待に応えるため、顧客の期待値をコントロールし、チームを崩壊させずに乗り切りましょう。")
    
    # 顧客タイプの選択
    print("\n顧客のタイプを選択してください:")
    print("1: 品質重視 (品質に妥協がなく、未報告のバグがあると満足度が激しく低下する)")
    print("2: スピード重視 (とにかく納期優先。進捗が遅れると満足度が徐々に低下する)")
    choice = input("選択 (デフォルト: 1): ")
    c_type = "SPEED_ORIENTED" if choice == "2" else "QUALITY_ORIENTED"
    
    project, developers, tasks = get_initial_data(customer_type=c_type)
    
    print("\n--- イントロダクション ---")
    print(f"上級マネージャー:「今回のクライアントである {project.customer.name} さんを紹介するよ。」")
    if c_type == "QUALITY_ORIENTED":
        print("「渡辺部長は非常に品質に厳しい方だ。バグを隠したまま納品しようものなら、私の立場もなくなる。しっかり管理してくれ。」")
    else:
        print("「渡辺部長はスピードを最優先される方だ。スケジュール遅延は許されない。とにかく納期を守るように動いてくれ。」")
    print("「君のマネジメント能力に期待しているよ。では、スタートだ！」")
    input("\n[Enterキーを押して開始...]")

    overtime_ids = set()
    resting_ids = set()

    # メインゲームループ
    while True:
        show_status(project, developers, tasks)
        
        # ゲームオーバー判定
        if project.budget <= 0:
            print("\n❌ 【GAME OVER】 予算が底をつきました！プロジェクトは破綻し、会社から解雇されました。")
            break
        if project.deadline_days < 0:
            # 納期が過ぎた場合、すべてのタスクが完了しているか確認
            incomplete = [t for t in tasks if t.status != "DONE"]
            if incomplete:
                print("\n❌ 【GAME OVER】 納期遅れが発生しました！タスクが完了せず、顧客から損害賠償を請求されました。")
                break
        if any(d.fatigue >= 100 for d in developers):
            collapsed_dev = next(d for d in developers if d.fatigue >= 100)
            print(f"\n❌ 【GAME OVER】 {collapsed_dev.name} が過労により倒れ、退職しました。チームが崩壊しプロジェクトは打ち切られました。")
            break
        if project.manager_satisfaction <= 0:
            print("\n❌ 【GAME OVER】 上級マネージャーからの信頼が完全に失われ、PMを解任されました。")
            break

        # クリア判定
        if all(t.status == "DONE" for t in tasks):
            print("\n🎉 【PROJECT CLEAR!!!】 すべてのタスクを完了し、プロジェクトを無事納品しました！")
            print(f"最終的な上級マネージャー評価: {project.manager_satisfaction:.1f}%")
            if project.manager_satisfaction >= 80:
                print("🏆 評価: Sクラス！上司は君のマネジメントを大絶賛しています。昇進間違いなし！")
            elif project.manager_satisfaction >= 50:
                print("👍 評価: Aクラス。無難にプロジェクトを納めました。信頼を獲得しました。")
            else:
                print("😐 評価: Bクラス。なんとか終わらせましたが、プロセスに多くの課題を残しました。")
            break

        print(f"行動を選択してください (残り行動ポイント: 1日のアクション制限はありません)")
        print("1: タスクの割り当てを変更する")
        print("2: メンバーと 1on1 (面談) を行う (疲労/士気の開示、士気回復)")
        print("3: 飲み会（懇親会）を開催する (費用: ¥30,000)")
        print("4: 残業指示の切り替え (次の日の進捗が増えるが、疲労増)")
        print("5: 休暇の付与 (次の日の作業から外れるが、疲労回復)")
        print("6: 顧客へ進捗報告・バグ報告 (期待値調整)")
        print("7: 上級マネージャーへ交渉 (予算追加 / 納期延長)")
        print("0: 1日を進める")
        
        action = input("入力: ")
        
        if action == "1":
            print("\n--- タスク割り当て ---")
            # タスク選択
            todo_in_progress = [t for t in tasks if t.status != "DONE"]
            for i, t in enumerate(todo_in_progress):
                assigned_name = next((d.name for d in developers if d.id == t.assigned_developer_id), "未割り当て")
                print(f"{i+1}: {t.name} (現状: {t.status} / 担当: {assigned_name})")
            
            t_choice = input("割り当てるタスクを選択 (戻るは Enter): ")
            if t_choice.isdigit() and 1 <= int(t_choice) <= len(todo_in_progress):
                selected_task = todo_in_progress[int(t_choice) - 1]
                
                # 開発者選択
                print("\n担当者を選択してください:")
                print("0: 割り当て解除 (TODOに戻す)")
                for j, dev in enumerate(developers):
                    print(f"{j+1}: {dev.name}")
                d_choice = input("選択: ")
                if d_choice == "0":
                    selected_task.assigned_developer_id = None
                    selected_task.status = "TODO"
                    print(f"「{selected_task.name}」を未割り当てに戻しました。")
                elif d_choice.isdigit() and 1 <= int(d_choice) <= len(developers):
                    selected_dev = developers[int(d_choice) - 1]
                    # 既存の割り当て解除
                    for t in tasks:
                        if t.assigned_developer_id == selected_dev.id and t.status == "IN_PROGRESS":
                            t.assigned_developer_id = None
                            t.status = "TODO"
                    selected_task.assigned_developer_id = selected_dev.id
                    selected_task.status = "IN_PROGRESS"
                    print(f"「{selected_task.name}」を {selected_dev.name} に割り当てました。")
                    
        elif action == "2":
            print("\n--- 1on1 (面談) ---")
            for i, dev in enumerate(developers):
                print(f"{i+1}: {dev.name}")
            d_choice = input("面談するメンバーを選択: ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(developers):
                selected_dev = developers[int(d_choice) - 1]
                selected_dev.reveal_duration = 3  # 3日間ステータス開示
                selected_dev.morale = min(100.0, selected_dev.morale + 15.0)
                selected_dev.fatigue = max(0.0, selected_dev.fatigue - 5.0)
                print(f"💡 {selected_dev.name} と1on1を実施しました。")
                print(f"本音を聞き出しました！ [疲労: {selected_dev.fatigue:.0f}/100, 士気: {selected_dev.morale:.0f}/100]")
                input("[Enterキーで戻る]")

        elif action == "3":
            print("\n--- 飲み会（懇親会）開催 ---")
            if project.budget < 30000:
                print("予算が足りません！ (開催費用: ¥30,000)")
                continue
            
            project.budget -= 30000
            print("🍻 飲み会を開催しました！ (費用 ¥30,000 消費)")
            
            # 飲み会嫌い（Sato）の強制参加処理
            sato = next((d for d in developers if "PRIVATE_FIRST" in d.personality_tags), None)
            force_join = False
            if sato:
                print(f"プライベート重視の {sato.name} を強制参加させますか？")
                print("1: 強制参加させる (やる気が激減しストレス増加)")
                print("2: 自由参加にする (本人は不参加、やる気変化なし)")
                join_choice = input("選択 (デフォルト: 2): ")
                if join_choice == "1":
                    force_join = True
            
            for dev in developers:
                if "DRINK_LOVER" in dev.personality_tags:
                    dev.morale += 30.0
                    print(f"😊 {dev.name} (飲み会好き): 「最高ですね！モチベーション上がりました！」 (士気大幅UP)")
                elif "PRIVATE_FIRST" in dev.personality_tags:
                    if force_join:
                        dev.morale -= 20.0
                        dev.fatigue += 10.0
                        print(f"😡 {dev.name} (プライベート重視/強制参加): 「正直、業務外で拘束されるのは苦痛です……」 (士気低下/疲労増)")
                    else:
                        print(f"🏠 {dev.name} (プライベート重視/自由参加): 定時に帰宅し、家でゆっくり過ごしたようです。")
                else:
                    dev.morale += 10.0
                    print(f"🙂 {dev.name}: 「楽しかったです。リフレッシュできました。」")
            input("[Enterキーで戻る]")

        elif action == "4":
            print("\n--- 残業指示設定 ---")
            for i, dev in enumerate(developers):
                status = "残業中" if dev.id in overtime_ids else "定時退社"
                print(f"{i+1}: {dev.name} [現在: {status}]")
            d_choice = input("残業設定を切り替えるメンバーの番号を入力 (完了は Enter): ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(developers):
                selected_dev = developers[int(d_choice) - 1]
                if selected_dev.id in overtime_ids:
                    overtime_ids.remove(selected_dev.id)
                    print(f"{selected_dev.name} を定時退社に戻しました。")
                else:
                    # 休暇中の場合は残業できない
                    if selected_dev.id in resting_ids:
                        resting_ids.remove(selected_dev.id)
                    overtime_ids.add(selected_dev.id)
                    print(f"{selected_dev.name} に残業を指示しました。")

        elif action == "5":
            print("\n--- 休暇付与設定 ---")
            for i, dev in enumerate(developers):
                status = "休暇予定" if dev.id in resting_ids else "出勤予定"
                print(f"{i+1}: {dev.name} [現在: {status}]")
            d_choice = input("休暇を切り替えるメンバーの番号を入力 (完了は Enter): ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(developers):
                selected_dev = developers[int(d_choice) - 1]
                if selected_dev.id in resting_ids:
                    resting_ids.remove(selected_dev.id)
                    print(f"{selected_dev.name} を出勤予定に戻しました。")
                else:
                    # 残業指示を解除して休暇にする
                    if selected_dev.id in overtime_ids:
                        overtime_ids.remove(selected_dev.id)
                    resting_ids.add(selected_dev.id)
                    print(f"{selected_dev.name} に次の日の有給/休暇を付与しました。")

        elif action == "6":
            print("\n--- 顧客への報告と期待値調整 ---")
            unreported = project.bugs_total - project.reported_bugs
            print(f"現在、検知されているバグ: {project.bugs_total}件 (うち未報告: {unreported}件)")
            print("1: 正直にバグを含めて報告する (一時的に満足度低下、ただしサプライズ防止)")
            print("2: 進捗状況だけを報告し、バグは濁す (満足度維持、ただし隠蔽リスク継続)")
            r_choice = input("選択 (デフォルト: 1): ")
            if r_choice == "2":
                print("✉️ 顧客へ『進捗は概ね順調です』と定形報告を送りました。")
                project.customer.satisfaction = min(100.0, project.customer.satisfaction + 2.0)
            else:
                project.reported_bugs = project.bugs_total
                project.customer.satisfaction = max(0.0, project.customer.satisfaction - (unreported * 2.0))
                # 報告の誠実さで上司の信頼が少し上がる
                project.manager_satisfaction = min(100.0, project.manager_satisfaction + 5.0)
                print("✉️ 顧客へバグ状況も含めて詳細な進捗レポートを報告しました。")
                print("顧客は不満を示していますが、隠し事はクリアされました。")
            input("[Enterキーで戻る]")

        elif action == "7":
            print("\n--- 上級マネージャーへのエスカレーション交渉 ---")
            if project.manager_satisfaction < 50:
                print("❌ 上司からの信頼が低すぎるため、交渉を聞き入れてもらえません！ (必要信頼度: 50%以上)")
                input("[Enterキーで戻る]")
                continue
            
            print(f"現在の上司信頼度: {project.manager_satisfaction:.1f}%")
            print("1: 予算の追加を要請する (上司信頼度-20%, 予算+¥300,000)")
            print("2: 納期延長の根回しを依頼する (上司信頼度-20%, 納期+3日)")
            n_choice = input("選択 (戻るは Enter): ")
            if n_choice == "1":
                project.manager_satisfaction -= 20.0
                project.budget += 300000
                print("🤝 上司へ粘り強く交渉し、追加予算 ¥300,000 を獲得しました！ (信頼度が下がりました)")
            elif n_choice == "2":
                project.manager_satisfaction -= 20.0
                project.deadline_days += 3
                print("🤝 上司が顧客へ根回しを行ってくれ、納期が 3 日間延長されました！ (信頼度が下がりました)")
            input("[Enterキーで戻る]")

        elif action == "0":
            # 1日を進める処理の実行
            print_header("1日の進行中...")
            logs = next_day_cycle(project, developers, tasks, overtime_ids, resting_ids)
            for log in logs:
                print(log)
            
            # 翌日のために残業・休暇予定をリセット
            overtime_ids.clear()
            resting_ids.clear()
            
            # ランダムイベントのトリガー
            event = trigger_event(project, developers, tasks)
            if event:
                print("\n" + "!" * 20 + " トラブル発生 " + "!" * 20)
                print(f"【{event['title']}】")
                print(event['description'])
                for idx, choice in enumerate(event['choices']):
                    print(f"{idx+1}: {choice['text']}")
                
                ev_choice = input("選択: ")
                selected_idx = 0
                if ev_choice.isdigit() and 1 <= int(ev_choice) <= len(event['choices']):
                    selected_idx = int(ev_choice) - 1
                
                # アクションの実行
                event_log = event['choices'][selected_idx]['action'](project, developers, tasks)
                print(f"\n➔ {event_log}")
                print("!" * 53)
            
            input("\n[Enterキーで次の日へ...]")

if __name__ == "__main__":
    main()

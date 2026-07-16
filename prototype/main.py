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
    
    # 顧客・上司情報
    vague_info = f"  |  【要求あいまい度】: {project.customer.vague_level:.1f}%" if project.customer.type == "VAGUE_REQUIREMENTS" else ""
    print(f"【顧客満足度】: {project.customer.satisfaction:.1f}% ({project.customer.name} / タイプ: {project.customer.type}){vague_info}")
    print(f"【上司信頼度】: {project.manager_satisfaction:.1f}%")
    
    # PL管理状況
    pl = next((d for d in developers if d.role == "PL"), None)
    pl_status = "自律稼働中" if project.pl_active else "🚨 ボイコット中 (管理停止)"
    direction_jp = "進捗優先" if project.direction == "NORMAL" else "バグ修正優先"
    print(f"【 PL 管理 】: {pl_status} (方針: {direction_jp})")
    
    print("\n■ 組織体制とメンバー状態")
    for dev in developers:
        # アサインタスクの確認
        assigned_task = next((t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None)
        task_info = f"担当: {assigned_task.name} ({assigned_task.progress:.1f}%)" if assigned_task else "担当: なし"
        
        # 隠しパラメータの表示判定
        if dev.reveal_duration > 0:
            status_details = f"[疲労: {dev.fatigue:.0f}/100, 士気: {dev.morale:.0f}/100]"
        else:
            status_details = "[ステータス: 隠蔽中]"
            
        role_label = f"({dev.role})"
        print(f" - {dev.name:<22} {role_label:<6} {status_details:<25} {task_info}")
        print(f"   サイン: {dev.get_sign()}")

    print("\n■ タスクボード")
    todo_tasks = [t for t in tasks if t.status == "TODO" and not t.id.startswith("BUG_FIX_")]
    in_progress_tasks = [t for t in tasks if t.status == "IN_PROGRESS"]
    done_tasks = [t for t in tasks if t.status == "DONE" and not t.id.startswith("BUG_FIX_")]
    
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
    print("3: 要件あいまい重視 (追加要求・手戻りが多発。PMの防波堤能力が試される)")
    choice = input("選択 (デフォルト: 1): ")
    
    if choice == "2":
        c_type = "SPEED_ORIENTED"
    elif choice == "3":
        c_type = "VAGUE_REQUIREMENTS"
    else:
        c_type = "QUALITY_ORIENTED"
    
    project, developers, tasks = get_initial_data(customer_type=c_type)
    pl = next(d for d in developers if d.role == "PL")
    
    print("\n--- イントロダクション ---")
    print(f"上級マネージャー:「今回のクライアントである {project.customer.name} さんを紹介するよ。」")
    if c_type == "QUALITY_ORIENTED":
        print("「渡辺部長は非常に品質に厳しい方だ。バグを隠したまま納品しようものなら、私の立場もなくなる。しっかり管理してくれ。」")
    elif c_type == "SPEED_ORIENTED":
        print("「渡辺部長はスピードを最優先される方だ。スケジュール遅延は許されない。とにかく納期を守るように動いてくれ。」")
    else:
        print("「渡辺部長はご自身の要求を言語化するのが苦手で、仕様が非常にあいまいだ。こまめにデモを見せて合意を取らないと、後で手戻りが発生するぞ。頑張ってくれ。」")
    print(f"「現場のタスクアサインと進捗管理は、PLの {pl.name} に任せてある。君はマクロな管理に集中してくれ。」")
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
        # バグ修正や追加タスクも含めて、すべてのタスクが完了しているか
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

        print(f"行動を選択してください:")
        
        # PLの状況に応じたメニュー表示
        if project.pl_active:
            print("1: タスクの割り当てを変更する [PLが自律管理中のため不要です]")
        else:
            print("1: 【手動】タスクの割り当てを変更する (PLボイコット中につき強制介入)")
            
        print("2: メンバーと 1on1 (面談) を行う (PLと行うと現場週報開示 / DEVと直接行うと過干渉ペナルティ)")
        print("3: 飲み会（懇親会）を開催する (費用: ¥30,000)")
        print("4: 現場への残業指示の切り替え (直接指示するとPL士気-25)")
        print("5: 現場への休暇付与設定 (直接指示するとPL士気-25)")
        print("6: 顧客へ進捗報告・期待値調整 (デモ) (あいまい度の低下・バグ報告)")
        print("7: 上級マネージャーへ交渉 (予算追加 / 納期延長)")
        print("8: PLへ開発方針を指示する (NORMAL:進捗優先 / BUG_FIRST:バグ修正優先)")
        if not project.pl_active:
            print("9: PLへ謝罪しケアする (費用: ¥50,000、ボイコット解除)")
            
        print("0: 1日を進める")
        
        action = input("入力: ")
        
        if action == "1":
            if project.pl_active:
                print("\n❌ 現場のタスク割り当ては鈴木リーダーに一任しています。割り当ての変更は不要です。")
                print("（PLを信頼し、PMの本来の業務である顧客交渉やリスク管理に集中しましょう）")
                input("[Enterキーで戻る]")
                continue
            
            print("\n--- 【手動】タスク割り当て (PLボイコット中) ---")
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
                devs_list = [d for d in developers if d.role == "DEV"]
                for j, dev in enumerate(devs_list):
                    print(f"{j+1}: {dev.name}")
                d_choice = input("選択: ")
                if d_choice == "0":
                    selected_task.assigned_developer_id = None
                    selected_task.status = "TODO"
                    print(f"「{selected_task.name}」を未割り当てに戻しました。")
                elif d_choice.isdigit() and 1 <= int(d_choice) <= len(devs_list):
                    selected_dev = devs_list[int(d_choice) - 1]
                    # 既存のアサイン解除
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
                role_label = "(PL)" if dev.role == "PL" else "(DEV)"
                print(f"{i+1}: {dev.name} {role_label}")
            d_choice = input("面談するメンバーを選択: ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(developers):
                selected_dev = developers[int(d_choice) - 1]
                
                if selected_dev.role == "PL":
                    # PLとの1on1: 鈴木リーダーの士気回復と、現場メンバーのステータス開示
                    selected_dev.reveal_duration = 3
                    selected_dev.morale = min(100.0, selected_dev.morale + 30.0)
                    selected_dev.fatigue = max(0.0, selected_dev.fatigue - 10.0)
                    
                    # 現場メンバーのステータスを開示する（週報レポート）
                    for d in developers:
                        if d.role == "DEV":
                            d.reveal_duration = 3
                            
                    print(f"💡 PL {selected_dev.name} と面談を行いました。現場の週報レポートを受け取りました。")
                    print(f"【PL鈴木の管理者プライド】: {selected_dev.morale:.0f}/100")
                    print("➔ 3日間、現場メンバー（山田・佐藤）の正確な疲労と士気が表示されます。")
                else:
                    # DEVとの直接1on1: 過干渉によるPLの士気低下
                    selected_dev.reveal_duration = 3
                    selected_dev.morale = min(100.0, selected_dev.morale + 15.0)
                    selected_dev.fatigue = max(0.0, selected_dev.fatigue - 5.0)
                    
                    # PLのプライド低下
                    pl.morale -= 10.0
                    print(f"💡 {selected_dev.name} と直接面談を行いました。")
                    print(f"⚠️ 【過干渉】鈴木PLから「現場に直接口を出しすぎではないですか？私への相談を通してください」と難色を示されました。")
                    print(f"(鈴木PLの士気 -10 -> 現在: {pl.morale:.0f}/100)")
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
                    print(f"🙂 {dev.name}: 「楽しかったです。」")
            input("[Enterキーで戻る]")

        elif action == "4":
            print("\n--- 残業指示設定 ---")
            devs_list = [d for d in developers if d.role == "DEV"]
            for i, dev in enumerate(devs_list):
                status = "残業中" if dev.id in overtime_ids else "定時退社"
                print(f"{i+1}: {dev.name} [現在: {status}]")
            d_choice = input("残業指示を出すメンバーの番号を入力 (完了は Enter): ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(devs_list):
                selected_dev = devs_list[int(d_choice) - 1]
                
                # PLがアクティブな場合、直接の指示は過干渉ペナルティ
                if project.pl_active:
                    pl.morale -= 25.0
                    print(f"⚠️ 【過干渉】PLを通さずに {selected_dev.name} へ直接残業指示を出したため、鈴木PLのプライドが傷つきました。")
                    print(f"(鈴木PLの士気 -25 -> 現在: {pl.morale:.0f}/100)")
                
                if selected_dev.id in overtime_ids:
                    overtime_ids.remove(selected_dev.id)
                    print(f"{selected_dev.name} を定時退社に戻しました。")
                else:
                    if selected_dev.id in resting_ids:
                        resting_ids.remove(selected_dev.id)
                    overtime_ids.add(selected_dev.id)
                    print(f"{selected_dev.name} に残業を指示しました。")
                input("[Enterキーで戻る]")

        elif action == "5":
            print("\n--- 休暇付与設定 ---")
            devs_list = [d for d in developers if d.role == "DEV"]
            for i, dev in enumerate(devs_list):
                status = "休暇予定" if dev.id in resting_ids else "出勤予定"
                print(f"{i+1}: {dev.name} [現在: {status}]")
            d_choice = input("休暇を付与するメンバーの番号を入力 (完了は Enter): ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(devs_list):
                selected_dev = devs_list[int(d_choice) - 1]
                
                # PLがアクティブな場合、直接の指示は過干渉ペナルティ
                if project.pl_active:
                    pl.morale -= 25.0
                    print(f"⚠️ 【過干渉】PLを通さずに {selected_dev.name} へ直接休暇を付与したため、鈴木PLのプライドが傷つきました。")
                    print(f"(鈴木PLの士気 -25 -> 現在: {pl.morale:.0f}/100)")
                
                if selected_dev.id in resting_ids:
                    resting_ids.remove(selected_dev.id)
                    print(f"{selected_dev.name} を出勤予定に戻しました。")
                else:
                    if selected_dev.id in overtime_ids:
                        overtime_ids.remove(selected_dev.id)
                    resting_ids.add(selected_dev.id)
                    print(f"{selected_dev.name} に休暇を付与しました。")
                input("[Enterキーで戻る]")

        elif action == "6":
            print("\n--- 顧客への報告と期待値調整 (デモ) ---")
            unreported = project.bugs_total - project.reported_bugs
            print(f"現在、検知されているバグ: {project.bugs_total}件 (うち未報告: {unreported}件)")
            if project.customer.type == "VAGUE_REQUIREMENTS":
                print(f"現在の顧客の要求あいまい度: {project.customer.vague_level:.1f}%")
            
            print("1: 正直にバグを含めて報告し、進捗デモを行う (バグをクリアし、あいまい度-20%)")
            print("2: 進捗状況だけを簡単に報告し、バグは濁す (あいまい度-10%のみ)")
            r_choice = input("選択 (デフォルト: 1): ")
            
            if r_choice == "2":
                print("✉️ 顧客へ『進捗は概ね順調です』と定形報告を送りました。")
                project.customer.satisfaction = min(100.0, project.customer.satisfaction + 2.0)
                if project.customer.type == "VAGUE_REQUIREMENTS":
                    project.customer.vague_level = max(0.0, project.customer.vague_level - 10.0)
                    print("顧客の仕様への理解が少し進みました。")
            else:
                project.reported_bugs = project.bugs_total
                project.customer.satisfaction = max(0.0, project.customer.satisfaction - (unreported * 2.0))
                project.manager_satisfaction = min(100.0, project.manager_satisfaction + 5.0)
                if project.customer.type == "VAGUE_REQUIREMENTS":
                    project.customer.vague_level = max(0.0, project.customer.vague_level - 20.0)
                    print(f"顧客と仕様について十分な認識合わせを行いました！(あいまい度 -20%)")
                print("✉️ 顧客へバグ状況も含めて詳細な進捗レポートを報告しました。")
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

        elif action == "8":
            print("\n--- PLへ開発方針を指示する ---")
            print(f"現在の開発方針: {project.direction}")
            print("1: 進捗優先方針 (NORMAL - 進捗の早いタスク順に割り振る)")
            print("2: バグ修正優先方針 (BUG_FIRST - 発生しているバグの修正を最優先にする)")
            d_choice = input("方針を選択: ")
            if d_choice == "2":
                project.direction = "BUG_FIRST"
                print("📋 鈴木PLに『バグの修正を最優先にしてほしい』と指示しました。")
            else:
                project.direction = "NORMAL"
                print("📋 鈴木PLに『基本機能の開発（進捗優先）を進めてほしい』と指示しました。")
            input("[Enterキーで戻る]")

        elif action == "9" and not project.pl_active:
            print("\n--- PLへ謝罪しケアを行う ---")
            if project.budget < 50000:
                print("予算が足りません！ (謝罪・再教育費用: ¥50,000)")
                continue
            
            project.budget -= 50000
            project.pl_active = True
            pl.morale = 50.0
            print("🤝 鈴木リーダーに自身の介入を謝罪し、改めて現場管理を委ねることで合意しました。(費用 ¥50,000 消費)")
            print("➔ 鈴木PLが業務に復帰し、自動タスク割り当てが再開されます。(PL士気: 50/100)")
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

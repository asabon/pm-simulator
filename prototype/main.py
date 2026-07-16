import sys
from prototype.data import get_pl_candidates, get_dev_candidates, get_initial_project_data
from prototype.engine import run_weekly_sprint, trigger_event

def print_header(title: str):
    print("\n" + "=" * 60)
    print(f" {title} ".center(60, "="))
    print("=" * 60)

def get_dev_macro_status(dev) -> str:
    """開発者のマクロな状態（サイン）を返す"""
    if dev.fatigue >= 80:
        return "限界寸前 (要休養)"
    elif dev.fatigue >= 40:
        return "要注意 (疲労蓄積)"
    return "良好 (稼働可能)"

def show_status(project, developers, tasks):
    print_header(f"WEEK {project.week} - スプリント状況")
    print(f"【プロジェクト】: {project.name}")
    print(f"【 残 予 算 】: ¥{project.budget:,}  |  【 納 期 】: あと {project.deadline_weeks} 週間")
    print(f"【総バグ数】: {project.bugs_total} 件 (報告済: {project.reported_bugs} 件)")
    
    # 顧客情報
    vague_info = f"  |  【要求あいまい度】: {project.customer.vague_level:.1f}%" if project.customer.type == "VAGUE_REQUIREMENTS" else ""
    print(f"【顧客満足度】: {project.customer.satisfaction:.1f}% ({project.customer.name} / タイプ: {project.customer.type}){vague_info}")
    print(f"【上司信頼度】: {project.manager_satisfaction:.1f}%")
    
    # PL管理状況
    pl = next((d for d in developers if d.role == "PL"), None)
    pl_status = f"自律稼働中 (鈴木PL)" if pl.id == "pl_suzuki" else f"自律稼働中 (田中PL)"
    if not project.pl_active:
        pl_status = f"🚨 ボイコット中 ({pl.name})"
        
    direction_jp = "進捗優先" if project.direction == "NORMAL" else "バグ修正優先"
    print(f"【 PL 管理 】: {pl_status}  |  【開発方針】: {direction_jp}")
    
    print("\n■ 開発体制とチームの状態")
    for dev in developers:
        assigned_task = next((t for t in tasks if t.assigned_developer_id == dev.id and t.status == "IN_PROGRESS"), None)
        task_info = f"担当: {assigned_task.name} ({assigned_task.progress:.0f}%)" if assigned_task else "担当: なし"
        
        # 隠しパラメータの表示判定 (1on1面談後のみ正確な数値)
        if dev.reveal_duration > 0:
            status_details = f"[疲労: {dev.fatigue:.0f}/100, 士気: {dev.morale:.0f}/100]"
        else:
            status_details = f"[{get_dev_macro_status(dev)}]"
            
        role_label = f"({dev.role})"
        print(f" - {dev.name:<22} {role_label:<6} {status_details:<25} {task_info}")
        print(f"   発言: {dev.get_sign()}")

    print("\n■ タスクボード")
    todo_tasks = [t for t in tasks if t.status == "TODO" and not t.id.startswith("BUG_FIX_")]
    in_progress_tasks = [t for t in tasks if t.status == "IN_PROGRESS"]
    done_tasks = [t for t in tasks if t.status == "DONE" and not t.id.startswith("BUG_FIX_")]
    
    print(f" [TODO]        ({len(todo_tasks)}件): " + ", ".join([f"{t.name}({t.estimated_hours}h)" for t in todo_tasks]))
    print(f" [IN PROGRESS] ({len(in_progress_tasks)}件): " + ", ".join([f"{t.name}({t.progress:.0f}%)" for t in in_progress_tasks]))
    print(f" [DONE]        ({len(done_tasks)}件): " + ", ".join([t.name for t in done_tasks]))
    print("=" * 60)

def main():
    print_header("PM Simulator - CLI Prototype (Macro PM Version)")
    print("ゲームの目的: プロジェクトを成功させ、上司（上級マネージャー）を満足させること。")
    print("PLを信頼して現場管理を委ねつつ、PMはマクロな方針決定、顧客交渉、リスク対策に専念しましょう。")
    
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
    
    project, tasks = get_initial_data = get_initial_project_data(customer_type=c_type)
    
    # --- A. 初期契約交渉フェーズ ---
    print_header("キックオフ前: 初期契約交渉")
    print("プロジェクト開始にあたり、顧客と1つだけ交渉を行うことができます。")
    print("1: 納期延長交渉 (納期を 4週間 ➔ 5週間 に延ばす。ただし顧客の初期満足度が -20% となる)")
    print("2: 予算追加交渉 (予算を ¥1,000,000 ➔ ¥1,300,000 に増やす。ただし上司の初期信頼度が -20% となる)")
    print("3: 交渉せず現状維持で開始 (納期4週間、予算100万、初期満足度80%、上司信頼度80%)")
    neg_choice = input("選択 (デフォルト: 3): ")
    
    if neg_choice == "1":
        project.deadline_weeks = 5
        project.customer.satisfaction = 60.0
        print("\n🤝 納期延長を獲得しました！ (納期: 5週間 / 初期顧客満足度: 60%)")
    elif neg_choice == "2":
        project.budget = 1300000
        project.manager_satisfaction = 60.0
        print("\n🤝 追加予算を獲得しました！ (予算: ¥1,300,000 / 初期上司信頼度: 60%)")
    else:
        print("\n🤝 現状維持でプロジェクトをスタートします。")
        
    input("[Enterキーで次へ]")

    # --- B. 体制構築（要員アサイン）フェーズ ---
    print_header("キックオフ前: 体制構築（人材雇用）")
    print(f"現在の予算: ¥{project.budget:,}")
    print("プロジェクトを運営するチームメンバーをアサインしてください。")
    
    # PLの選択
    print("\n[STEP 1] PL (プロジェクトリーダー) を1名選択してください (必須):")
    pl_candidates = get_pl_candidates()
    for idx, pl_cand in enumerate(pl_candidates):
        print(f"{idx+1}: {pl_cand.name} (日当: ¥{pl_cand.salary:,} / 管理スキル・信頼性高)")
    pl_choice = input("選択: ")
    selected_pl = pl_candidates[1] if pl_choice == "2" else pl_candidates[0]
    project.assigned_developers.append(selected_pl)
    print(f"➔ {selected_pl.name} をPLとしてアサインしました。")
    
    # DEVの選択
    print("\n[STEP 2] DEV (開発メンバー) をアサインしてください (1名以上、複数可):")
    dev_candidates = get_dev_candidates()
    for dev_cand in dev_candidates:
        print(f" - {dev_cand.name} (日当: ¥{dev_cand.salary:,} / 特性: {', '.join(dev_cand.personality_tags) if dev_cand.personality_tags else 'なし'})")
        u_input = input(f"  このメンバーを雇用しますか？ (y/n): ")
        if u_input.lower() == 'y':
            project.assigned_developers.append(dev_cand)
            print(f"  ➔ {dev_cand.name} をアサインしました。")
            
    # DEVが誰も選ばれなかった場合の強制アサイン (山田を自動雇用)
    if len([d for d in project.assigned_developers if d.role == "DEV"]) == 0:
        print("\n⚠️ 開発メンバーがアサインされていません！山田さんを自動的にアサインしました。")
        project.assigned_developers.append(dev_candidates[0])
        
    print("\n--- イントロダクション ---")
    print(f"上級マネージャー:「今回のクライアントである {project.customer.name} さんを紹介したよ。」")
    if c_type == "QUALITY_ORIENTED":
        print("「渡辺部長は非常に品質に厳しい方だ。バグを隠したまま納品しようものなら、私の立場もなくなる。しっかり管理してくれ。」")
    elif c_type == "SPEED_ORIENTED":
        print("「渡辺部長はスピードを最優先される方だ。スケジュール遅延は許されない。とにかく納期を守るように動いてくれ。」")
    else:
        print("「渡辺部長はご自身の要求を言語化するのが苦手で、仕様が非常にあいまいだ。こまめにデモを見せて合意を取らないと、後で手戻りが発生するぞ。計画的に動いてくれ。」")
    print(f"「現場の管理は PL の {selected_pl.name} に任せてある。君はPMとしての本来の役割（交渉・意思決定）を果たしてくれ。」")
    input("\n[Enterキーを押して第1週を開始...]")

    overtime_ids = set()
    resting_ids = set()

    # メイン週次ゲームループ
    while True:
        show_status(project, project.assigned_developers, tasks)
        
        # ゲームオーバー判定
        if project.budget <= 0:
            print("\n❌ 【GAME OVER】 予算が底をつきました！プロジェクトは破綻し、会社から解雇されました。")
            break
        if project.deadline_weeks < 0:
            incomplete = [t for t in tasks if t.status != "DONE"]
            if incomplete:
                print("\n❌ 【GAME OVER】 納期遅れが発生しました！スプリント期間内にタスクが完了せず、プロジェクトは失敗に終わりました。")
                break
        if any(d.fatigue >= 100 for d in project.assigned_developers):
            collapsed_dev = next(d for d in project.assigned_developers if d.fatigue >= 100)
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
                print("👍 評価: Aクラス。無難にプロジェクトを納めました。")
            else:
                print("😐 評価: Bクラス。なんとか終わらせましたが、多くの課題を残しました。")
            break

        print(f"週次アクションを選択してください:")
        
        if project.pl_active:
            print("1: 【PL自動管理中】 タスク割り当てを変更する (鈴木/田中リーダーに一任されています)")
        else:
            print("1: 【手動割り当て】 タスク割り当てを変更する (PLボイコット中につき強制介入が必要)")
            
        print("2: PL・メンバーと面談 (1on1) を行う (PLと行うと現場状況が数値開示されます)")
        print("3: チーム全体の懇親会（飲み会）を開催する (費用: ¥30,000 / 士気回復)")
        print("4: 来週の稼働指示 (残業・休暇) を決定する")
        print("5: 顧客へスプリント報告・デモを行う (あいまい度低下・バグ報告)")
        print("6: 上級マネージャーへ交渉 (予算追加 / 納期延長)")
        print("7: PLへ開発方針指示を出す (NORMAL:進捗優先 / BUG_FIRST:バグ修正優先)")
        if not project.pl_active:
            print("8: PLに謝罪してケアする (費用: ¥50,000 / ボイコット解除)")
            
        print("0: スプリント(1週間)を進める")
        
        action = input("入力: ")
        
        if action == "1":
            if project.pl_active:
                pl = next(d for d in project.assigned_developers if d.role == "PL")
                print(f"\n❌ 現場のタスクアサインは {pl.name} に一任しています。")
                print("（PLを信頼し、PMの本来の業務である顧客交渉やリスク管理に集中しましょう）")
                input("[Enterキーで戻る]")
                continue
            
            # 手動アサイン (PLボイコット時のみ)
            print("\n--- 【手動】タスク割り当て (PLボイコット中) ---")
            todo_in_progress = [t for t in tasks if t.status != "DONE"]
            for i, t in enumerate(todo_in_progress):
                assigned_name = next((d.name for d in project.assigned_developers if d.id == t.assigned_developer_id), "未割り当て")
                print(f"{i+1}: {t.name} (現状: {t.status} / 担当: {assigned_name})")
            
            t_choice = input("割り当てるタスクを選択 (戻るは Enter): ")
            if t_choice.isdigit() and 1 <= int(t_choice) <= len(todo_in_progress):
                selected_task = todo_in_progress[int(t_choice) - 1]
                
                print("\n担当者を選択してください:")
                print("0: 割り当て解除")
                devs_list = [d for d in project.assigned_developers if d.role == "DEV"]
                for j, dev in enumerate(devs_list):
                    print(f"{j+1}: {dev.name}")
                d_choice = input("選択: ")
                if d_choice == "0":
                    selected_task.assigned_developer_id = None
                    selected_task.status = "TODO"
                    print(f"「{selected_task.name}」を未割り当てに戻しました。")
                elif d_choice.isdigit() and 1 <= int(d_choice) <= len(devs_list):
                    selected_dev = devs_list[int(d_choice) - 1]
                    for t in tasks:
                        if t.assigned_developer_id == selected_dev.id and t.status == "IN_PROGRESS":
                            t.assigned_developer_id = None
                            t.status = "TODO"
                    selected_task.assigned_developer_id = selected_dev.id
                    selected_task.status = "IN_PROGRESS"
                    print(f"「{selected_task.name}」を {selected_dev.name} に割り当てました。")
                    
        elif action == "2":
            print("\n--- スプリント面談 (1on1) ---")
            for i, dev in enumerate(project.assigned_developers):
                role_label = "(PL)" if dev.role == "PL" else "(DEV)"
                print(f"{i+1}: {dev.name} {role_label}")
            d_choice = input("面談する相手を選択: ")
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(project.assigned_developers):
                selected_dev = project.assigned_developers[int(d_choice) - 1]
                pl = next(d for d in project.assigned_developers if d.role == "PL")
                
                if selected_dev.role == "PL":
                    # PLとの1on1: 自律管理を活性化
                    selected_dev.reveal_duration = 3
                    selected_dev.morale = min(100.0, selected_dev.morale + 30.0)
                    selected_dev.fatigue = max(0.0, selected_dev.fatigue - 10.0)
                    
                    # 全員のステータスを週報として開示させる
                    for d in project.assigned_developers:
                        if d.role == "DEV":
                            d.reveal_duration = 3
                            
                    print(f"💡 PL {selected_dev.name} と面談しました。週報として現場メンバーの稼働状況が開示されました。")
                    print(f"【PLの信頼度】: {selected_dev.morale:.0f}/100")
                    print("➔ 3スプリントの間、現場メンバーの正確な『疲労・士気』が確認できます。")
                else:
                    # DEVと直接面談: PMの過干渉になりPLの士気が下がる
                    selected_dev.reveal_duration = 3
                    selected_dev.morale = min(100.0, selected_dev.morale + 15.0)
                    selected_dev.fatigue = max(0.0, selected_dev.fatigue - 5.0)
                    
                    # PLのプライドが傷つく
                    pl.morale -= 10.0
                    print(f"💡 DEV {selected_dev.name} と直接面談を行いました。")
                    print(f"⚠️ 【過干渉警告】PL {pl.name} から「直接メンバーと面談をされるのは、私の管理能力を疑われているようで心外です」と難色を示されました。")
                    print(f"({pl.name} の士気 -10 -> 現在: {pl.morale:.0f}/100)")
                input("[Enterキーで戻る]")

        elif action == "3":
            print("\n--- 懇親会（飲み会）開催 ---")
            if project.budget < 30000:
                print("予算が足りません！ (開催費用: ¥30,000)")
                continue
            
            project.budget -= 30000
            print("🍻 懇親会を開催しました！ (費用 ¥30,000 消費)")
            
            sato = next((d for d in project.assigned_developers if "PRIVATE_FIRST" in d.personality_tags), None)
            force_join = False
            if sato:
                print(f"プライベート重視の {sato.name} を強制参加させますか？")
                print("1: 強制参加させる (やる気が下がりストレス増加)")
                print("2: 自由参加にする (本人は不参加、やる気変化なし)")
                join_choice = input("選択 (デフォルト: 2): ")
                if join_choice == "1":
                    force_join = True
            
            for dev in project.assigned_developers:
                if "DRINK_LOVER" in dev.personality_tags:
                    dev.morale += 30.0
                    print(f"😊 {dev.name} (飲み会好き): やる気が大幅にアップしました！ (士気大幅UP)")
                elif "PRIVATE_FIRST" in dev.personality_tags:
                    if force_join:
                        dev.morale -= 20.0
                        dev.fatigue += 10.0
                        print(f"😡 {dev.name} (強制参加): 不満を感じ、疲労が溜まりました。 (士気低下/疲労増)")
                    else:
                        print(f"🏠 {dev.name} (自由参加): 定時で帰宅し、プライベートを満喫しました。")
                else:
                    dev.morale += 10.0
                    print(f"🙂 {dev.name}: チームの親睦が深まりました。")
            input("[Enterキーで戻る]")

        elif action == "4":
            print("\n--- 来週の稼働指示設定 (PL経由) ---")
            devs_list = [d for d in project.assigned_developers if d.role == "DEV"]
            pl = next(d for d in project.assigned_developers if d.role == "PL")
            
            print("指示するメンバーを選択してください:")
            for i, dev in enumerate(devs_list):
                status = "残業予定" if dev.id in overtime_ids else ("休暇予定" if dev.id in resting_ids else "通常稼働")
                print(f"{i+1}: {dev.name} [現在: {status}]")
            d_choice = input("メンバーの番号を入力 (戻るは Enter): ")
            
            if d_choice.isdigit() and 1 <= int(d_choice) <= len(devs_list):
                selected_dev = devs_list[int(d_choice) - 1]
                
                print(f"\n{selected_dev.name} への来週の稼働指示を選択してください:")
                print("1: 残業を指示する (進捗が伸びるが疲労蓄積)")
                print("2: 有給（休暇）を付与する (作業から外れるが疲労回復)")
                print("3: 通常稼働に戻す")
                i_choice = input("指示: ")
                
                # PLの進言と過干渉判定
                warning_triggered = False
                if i_choice == "1":
                    # 疲労がすでに要注意以上の場合、PLから進言が入る
                    if selected_dev.fatigue >= 40.0 and project.pl_active:
                        print(f"\n⚠️ 【PLの進言】")
                        print(f"  {pl.name}: 「PM、{selected_dev.name} さんはかなり疲労が溜まっています。来週の残業は避けるべきです！」")
                        confirm = input("  PLの進言を無視して強行しますか？ (y/n): ")
                        if confirm.lower() != 'y':
                            print("残業指示をキャンセルしました。")
                            input("[Enterキーで戻る]")
                            continue
                        else:
                            warning_triggered = True
                    
                    # 休暇と競合クリア
                    if selected_dev.id in resting_ids:
                        resting_ids.remove(selected_dev.id)
                    overtime_ids.add(selected_dev.id)
                    print(f"➔ {selected_dev.name} に来週の残業を指示しました。")
                    
                elif i_choice == "2":
                    if selected_dev.id in overtime_ids:
                        overtime_ids.remove(selected_dev.id)
                    resting_ids.add(selected_dev.id)
                    print(f"➔ {selected_dev.name} に来週の有給/休暇を付与しました。")
                    
                elif i_choice == "3":
                    if selected_dev.id in overtime_ids:
                        overtime_ids.remove(selected_dev.id)
                    if selected_dev.id in resting_ids:
                        resting_ids.remove(selected_dev.id)
                    print(f"➔ {selected_dev.name} を通常稼働に戻しました。")
                
                # 進言を無視して指示を強行した場合、PLのプライドが傷つく
                if warning_triggered:
                    pl.morale -= 25.0
                    print(f"\n🚨 【過干渉ペナルティ】PLの進言を無視して指示を強行したため、{pl.name} の管理者プライドが傷つきました。")
                    print(f"({pl.name} の管理士気 -25 -> 現在: {pl.morale:.0f}/100)")
                
                input("[Enterキーで戻る]")

        elif action == "5":
            print("\n--- 顧客への定例報告と進捗デモ ---")
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
                project.customer.satisfaction = max(0.0, project.customer.satisfaction - (unreported * 5.0)) # 週単位なので影響大
                project.manager_satisfaction = min(100.0, project.manager_satisfaction + 5.0)
                if project.customer.type == "VAGUE_REQUIREMENTS":
                    project.customer.vague_level = max(0.0, project.customer.vague_level - 20.0)
                    print(f"顧客と仕様について十分な認識合わせを行いました！(あいまい度 -20%)")
                print("✉️ 顧客へバグ状況も含めて詳細な進捗レポートを報告しました。")
            input("[Enterキーで戻る]")

        elif action == "6":
            print("\n--- 上級マネージャーへのエスカレーション交渉 ---")
            if project.manager_satisfaction < 50:
                print("❌ 上司からの信頼が低すぎるため、交渉を聞き入れてもらえません！ (必要信頼度: 50%以上)")
                input("[Enterキーで戻る]")
                continue
            
            print(f"現在の上司信頼度: {project.manager_satisfaction:.1f}%")
            print("1: 予算の追加を要請する (上司信頼度-20%, 予算+¥300,000)")
            print("2: 納期延長の根回しを依頼する (上司信頼度-20%, 納期+1週間)")
            n_choice = input("選択 (戻るは Enter): ")
            if n_choice == "1":
                project.manager_satisfaction -= 20.0
                project.budget += 300000
                print("🤝 上司へ粘り強く交渉し、追加予算 ¥300,000 を獲得しました！ (信頼度が下がりました)")
            elif n_choice == "2":
                project.manager_satisfaction -= 20.0
                project.deadline_weeks += 1
                print("🤝 上司が顧客へ根回しを行ってくれ、納期が 1 週間延長されました！ (信頼度が下がりました)")
            input("[Enterキーで戻る]")

        elif action == "7":
            print("\n--- PLへ開発方針を指示する ---")
            print(f"現在の開発方針: {project.direction}")
            print("1: 進捗優先方針 (NORMAL - 進捗の早いタスク順に割り振る)")
            print("2: バグ修正優先方針 (BUG_FIRST - 発生しているバグの修正を最優先にする)")
            d_choice = input("方針を選択: ")
            pl = next(d for d in project.assigned_developers if d.role == "PL")
            if d_choice == "2":
                project.direction = "BUG_FIRST"
                print(f"📋 {pl.name} に『バグの修正を最優先にしてほしい』と指示しました。")
            else:
                project.direction = "NORMAL"
                print(f"📋 {pl.name} に『基本機能の開発（進捗優先）を進めてほしい』と指示しました。")
            input("[Enterキーで戻る]")

        elif action == "8" and not project.pl_active:
            pl = next(d for d in project.assigned_developers if d.role == "PL")
            print("\n--- PLへ謝罪しケアを行う ---")
            if project.budget < 50000:
                print("予算が足りません！ (謝罪・再教育費用: ¥50,000)")
                continue
            
            project.budget -= 50000
            project.pl_active = True
            pl.morale = 50.0
            print(f"🤝 {pl.name} に自身の介入を謝罪し、改めて現場管理を委ねることで合意しました。(費用 ¥50,000 消費)")
            print(f"➔ {pl.name} が業務に復帰し、自動タスク割り当てが再開されます。(PL士気: 50/100)")
            input("[Enterキーで戻る]")

        elif action == "0":
            # 1週間（スプリント）を進める
            print_header("1週間のスプリント開発を実行中...")
            logs = run_weekly_sprint(project, tasks, overtime_ids, resting_ids)
            for log in logs:
                print(log)
            
            # 翌週のために残業・休暇予定をリセット
            overtime_ids.clear()
            resting_ids.clear()
            
            # 週の終わりのランダムイベント
            event = trigger_event(project, tasks)
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
                event_log = event['choices'][selected_idx]['action'](project, project.assigned_developers, tasks)
                print(f"\n➔ {event_log}")
                print("!" * 53)
            
            input("\n[Enterキーで次のスプリントへ...]")

if __name__ == "__main__":
    main()

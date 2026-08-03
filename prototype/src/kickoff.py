from prototype.src.entities import PM, Project, Team


class KickoffPhase:
    """フェーズ1: キックオフ処理エンジン (自由選択キュー ＆ 納期経過対応版)"""

    def __init__(self, project: Project, team: Team, pm: PM):
        self.project = project
        self.team = team
        self.pm = pm
        self.pl = team.leader

        self.ap = 3  # 今週の事前ネゴ用 AP
        self.max_ap = 3
        self.obtained_knowledge = set()  # 獲得した本音/切り札フラグ
        self.interview_ap_invested = {"PL": 0, "CLIENT": 0, "BOSS": 0}  # 同一相手へのAP投入回数
        self.interview_sequence = []
        self.weeks_spent = 0

    def run(self) -> dict:
        """キックオフフェーズ全体を実行し、診断ステータスを返す"""
        print("\n" + "=" * 60)
        print(" 🚀 PHASE 1: プロジェクトキックオフ ".center(60, "="))
        print("=" * 60)

        # Step 1-1: 上司アサイン
        self._step_1_1_boss_assignment()

        while True:
            # Step 1-2: 事前会議の自由セッティング
            self._step_1_2_setup_meetings()

            # Step 2: 個別事前会議の開催 (アジェンダに沿って順次進行)
            self._step_2_run_meetings()

            # 週経過 ＆ 継続判定
            continue_next_week = self._step_2_9_ask_continue()
            if not continue_next_week:
                break

        # Step 3: キックオフ決起 & 防衛★診断
        defense_result = self._step_3_kickoff_rally()
        return defense_result

    def _step_1_1_boss_assignment(self):
        print("\n📋 【Step 1-1: 上司からの業務アサイン】")
        print("🏢 【上司 (部長)】:")
        print(
            f"  『{self.pm.name}君、今回アサインするプロジェクトは【{self.project.name}】だ。'\n"
            f"  顧客の {self.project.customer.name} 様からのご期待は『{self.project.priority_expectation}』だ。\n"
            f"  現場PLは {self.pl.name if self.pl else '未定'} だ。しっかり関係者と事前調整してキックオフに臨んでくれたまえ。』"
        )
        print("\n📊 【初期案件パラメーター】:")
        print(f"  ・契約納期       : あと {self.project.deadline_weeks} 週間")
        print(
            f"  ・初期クリア度   : 要求具体度 {'🌟' * self.project.clarity_level:<5} (※★5=完全明確。開発初期段階では★5には届かないことが多い)"
        )
        print(f"  ・顧客第一声     : 『{self.project.customer.speak()}』")

        input("\n[Enterキーで「Step 1-2: 事前会議の自由セッティング」へ]")

    def _step_1_2_setup_meetings(self):
        print("\n" + "-" * 60)
        print(
            f"📅 【Step 1-2: 事前会議の自由セッティング】 (第 {self.weeks_spent + 1} ターン目 | 残り納期: {self.project.deadline_weeks} 週間)"
        )
        print("番号を順番に入力して今週行う会議アジェンダ（最大3つ）を組み立ててください：\n")

        self.interview_sequence = []

        mapping = {
            "1": ("CLIENT", "対 顧客との要求すり合わせ会議"),
            "2": ("PL", "対 PLとの現場技術・負荷打ち合わせ会議"),
            "3": ("BOSS", "対 上司との防衛ライン・リソース相談会議"),
        }

        while len(self.interview_sequence) < 3:
            print(f"現在の予定アジェンダ ({len(self.interview_sequence)}/3):")
            if not self.interview_sequence:
                print("  (まだ設定されていません)")
            else:
                for idx, item in enumerate(self.interview_sequence, 1):
                    print(f"  {idx}. {item[1]}")

            print("\n追加する会議を選択:")
            print(" 1: ➕ 👥 顧客とのすり合わせ会議")
            print(" 2: ➕ 🛠️ PLとの打ち合わせ会議")
            print(" 3: ➕ 🏢 上司との相談会議")
            print(" S: 今週の会議をこれで開始して面談へ進む")

            cmd = input("選択 (1-3 または S): ").strip().upper()

            if cmd == "S":
                if self.interview_sequence:
                    break
                else:
                    print("⚠️ 最低1つの会議を追加してください。")
            elif cmd in mapping:
                self.interview_sequence.append(mapping[cmd])
                print(f"➔ 『{mapping[cmd][1]}』を追加しました。")
            else:
                print("⚠️ 有効なキーを選択してください。")

        input("\n[Enterキーで「Step 2: 今週の事前会議」を開始！]")

    def _step_2_run_meetings(self):
        print("\n" + "=" * 60)
        print("🗣️ 【Step 2: 事前会議の開催】 (今週の所持 AP: " + str(self.ap) + ")")
        print("=" * 60)

        for step_idx, (target, meeting_title) in enumerate(self.interview_sequence, 1):
            print(f"\n📌 【第 {step_idx} 会議】: {meeting_title} (対象: {self._get_target_name(target)})")
            self._run_single_meeting(target, step_idx)

    def _get_target_name(self, target: str) -> str:
        if target == "PL":
            return f"PL {self.pl.name}" if self.pl else "PL (現場リーダー)"
        elif target == "CLIENT":
            return f"顧客 {self.project.customer.name}"
        elif target == "BOSS":
            return "上司 (部長)"
        return target

    def _run_single_meeting(self, target: str, meeting_num: int):
        invested = self.interview_ap_invested[target]

        while True:
            print(f"\n--- 面談画面 (相手: {self._get_target_name(target)} | 残り AP: {self.ap}/{self.max_ap}) ---")
            print(
                f"現在の指標: 👥顧客満足度 {self.project.customer.satisfaction:.0f}% | 🔥チーム健全性 {self.pl.morale if self.pl else 50:.0f}% | 🏢上司信頼度 {self.project.manager_satisfaction:.0f}%"
            )

            if invested >= 2:
                print(
                    "⚠️ 【警告】この相手とは既に十分議論しました。これ以上のAP投入は【効果ゼロ (時間浪費)】となります！"
                )

            options = self._get_action_options(target)

            for key, opt_text in options.items():
                print(f" {key}: {opt_text}")

            print(" N: 次のアジェンダへ進む (AP消費なし)")

            cmd = input("アクション選択: ").strip().upper()

            if cmd == "N" or cmd == "":
                print(f"➔ {self._get_target_name(target)} との会議を終了し、次へ進みます。")
                break

            if cmd in options:
                if self.ap <= 0:
                    print("⚠️ 今週のAPを使い切りました。次へ進みます。")
                    break

                self.ap -= 1
                self.interview_ap_invested[target] += 1
                invested = self.interview_ap_invested[target]

                self._execute_action(target, cmd, invested)

                if self.ap <= 0:
                    print("\n⚠️ 今週の AP をすべて使い切りました！")
                    break

    def _get_action_options(self, target: str) -> dict:
        opts = {}
        if target == "PL":
            opts["1"] = "現場の本音・技術懸念のヒアリング (AP 1)"
            opts["2"] = "開発負荷の軽減方針について議論 (AP 1)"
            if "CLIENT_REQUIREMENT" in self.obtained_knowledge:
                opts["★"] = "★【切り札】持ち帰った顧客要望を提示し、現場代替案を相談 (AP 1)"

        elif target == "CLIENT":
            opts["1"] = "顧客の真の要求・優先度 (QCD) のヒアリング (AP 1)"
            opts["2"] = "納期・スコープ調整の事前打診 (AP 1)"
            if "SOLUTION_STAGED_RELEASE" in self.obtained_knowledge:
                opts["★"] = "★【切り札】現場で策定した『段階リリース案』を提案・交渉 (AP 1)"
            if "BOSS_BACKUP" in self.obtained_knowledge:
                opts["★2"] = "★【切り札】『会社（上司）公認の品質担保ライン』を提示して説得 (AP 1)"

        elif target == "BOSS":
            opts["1"] = "追加予算・予備リソースの事前申請 (AP 1)"
            opts["2"] = "炎上時の会社バックアップラインの合意 (AP 1)"

        return opts

    def _execute_action(self, target: str, cmd: str, invested_count: int):
        multiplier = 1.0 if invested_count == 1 else (0.5 if invested_count == 2 else 0.0)

        if multiplier == 0.0:
            print("\n🚨 【時間・APの浪費】")
            print(
                f"  {self._get_target_name(target)} との議論は完全に平行線です……。"
                "\n  時間（AP）だけが無駄に浪費され、パラメータは一切上昇しませんでした (+0%)！"
            )
            return

        if target == "PL":
            if cmd == "1":
                gain = 20.0 * multiplier
                if self.pl:
                    self.pl.morale = min(100.0, self.pl.morale + gain)
                self.obtained_knowledge.add("PL_TECH_ANXIETY")
                print(
                    f"\n🟢 【対PLヒアリング成功】 (効果: +{gain:.0f}%)\n"
                    f"  PL {self.pl.name if self.pl else ''} から『実はこの技術スタックは経験が浅く不安がある』という本音リスクを察知しました！\n"
                    "  [獲得フラグ: PL_TECH_ANXIETY]"
                )
            elif cmd == "2":
                gain = 15.0 * multiplier
                if self.pl:
                    self.pl.morale = min(100.0, self.pl.morale + gain)
                print(
                    f"\n🟢 【負荷軽減の合意】 (効果: +{gain:.0f}%)\n"
                    f"  現場の無理な残業を抑える方針でPLと意気投合し、チームの信頼度が向上しました！"
                )
            elif cmd == "★":
                gain = 25.0 * multiplier
                if self.pl:
                    self.pl.morale = min(100.0, self.pl.morale + gain)
                self.obtained_knowledge.add("SOLUTION_STAGED_RELEASE")
                print(
                    f"\n🌟 【切り札発動: 現場代替案の策定】 (効果: +{gain:.0f}%)\n"
                    f"  顧客の初期要望を持ち込んで膝詰めで相談し、現場から『段階リリースなら実現可能』という説得力ある対案を引き出しました！\n"
                    "  [獲得フラグ: SOLUTION_STAGED_RELEASE]"
                )

        elif target == "CLIENT":
            if cmd == "1":
                gain = 20.0 * multiplier
                self.project.customer.satisfaction = min(100.0, self.project.customer.satisfaction + gain)
                self.obtained_knowledge.add("CLIENT_REQUIREMENT")
                print(
                    f"\n🟢 【顧客ヒアリング成功】 (効果: +{gain:.0f}%)\n"
                    f"  顧客 {self.project.customer.name} から『何よりもまずは主要機能の納期厳守が第一』という真のニーズを聞き出しました！\n"
                    "  [獲得フラグ: CLIENT_REQUIREMENT]"
                )
            elif cmd == "2":
                gain = 15.0 * multiplier
                self.project.clarity_level = min(5, self.project.clarity_level + 1)
                self.project.customer.satisfaction = min(100.0, self.project.customer.satisfaction + gain)
                print(
                    f"\n🟢 【スコープ事前打診】 (効果: +{gain:.0f}%)\n"
                    f"  要件の優先順位付けについて理解を得て、要求具体度が 🌟{self.project.clarity_level} にアップしました！"
                )
            elif cmd == "★":
                gain = 30.0 * multiplier
                self.project.customer.satisfaction = min(100.0, self.project.customer.satisfaction + gain)
                self.project.clarity_level = min(5, self.project.clarity_level + 1)
                self.obtained_knowledge.add("CLIENT_AGREED_STAGED")
                print(
                    f"\n🌟 【切り札発動: 段階リリース最終合意】 (効果: +{gain:.0f}%)\n"
                    f"  現場で揉んだ『段階リリース案』を提示し、顧客 {self.project.customer.name} から『そこまで真剣に考えてくれたなら段階リリースで合意しよう』と絶賛されました！\n"
                    "  [獲得フラグ: CLIENT_AGREED_STAGED]"
                )
            elif cmd == "★2":
                gain = 25.0 * multiplier
                self.project.customer.satisfaction = min(100.0, self.project.customer.satisfaction + gain)
                print(
                    f"\n🌟 【切り札発動: 社内公認ラインの提示】 (効果: +{gain:.0f}%)\n"
                    f"  上司から取り付けた品質担保ラインを毅然と提示し、無理な無茶振り要求を完全にシャットアウトしました！"
                )

        elif target == "BOSS":
            if cmd == "1" or cmd == "2":
                gain = 20.0 * multiplier
                self.project.manager_satisfaction = min(100.0, self.project.manager_satisfaction + gain)
                self.obtained_knowledge.add("BOSS_BACKUP")
                print(
                    f"\n🟢 【上司防衛線ライン確保】 (効果: +{gain:.0f}%)\n"
                    f"  上司との合意を取りつけ、社内評価・防衛バックアップラインが強化されました！\n"
                    "  [獲得フラグ: BOSS_BACKUP]"
                )

    def _step_2_9_ask_continue(self) -> bool:
        print("\n" + "-" * 60)
        print(f"✅ 今週の事前会議がすべて終了しました (事前調整経過: {self.weeks_spent + 1} 週)")
        print(f"   現在の契約納期: 残り {self.project.deadline_weeks} 週間")
        print("\n選択してください:")
        print(" 1: 来週も事前調整を継続する (⚠️ 契約納期が 1 週間減少します)")
        print(" 2: 事前調整を完了し、チームキックオフ (Step 3) へ進む")

        while True:
            ans = input("選択 (1または2): ").strip()
            if ans == "1":
                self.weeks_spent += 1
                self.project.deadline_weeks = max(1, self.project.deadline_weeks - 1)
                self.ap = 3  # AP回復
                print(f"\n➔ 納期を1週消費して事前調整を継続します。(残り納期: {self.project.deadline_weeks}週)")
                return True
            elif ans == "2":
                print("\n➔ 事前調整を終了し、チームキックオフへ進みます。")
                return False
            else:
                print("⚠️ 1または2を入力してください。")

    def _step_3_kickoff_rally(self) -> dict:
        print("\n" + "=" * 60)
        print("🎉 【Step 3: チームキックオフ決起 ＆ 防衛★診断】")
        print("=" * 60)

        print("\n🌊 🔄 デリバリー開発戦略を選択してください:")
        print(" 1: 🌊 ウォーターフォール型 (要件定義・設計を完璧に固めて順次進行)")
        print(" 2: 🔄 アジャイル型 (イテレーションで顧客フィードバックを得ながら柔軟に開発)")

        while True:
            strat = input("選択 (1-2): ").strip()
            if strat == "1":
                self.project.methodology = "WATERFALL"
                print("➔ 開発手法: 🌊 ウォーターフォール型 を宣言しました。")
                break
            elif strat == "2":
                self.project.methodology = "AGILE"
                print("➔ 開発手法: 🔄 アジャイル型 を宣言しました。")
                break
            else:
                print("⚠️ 1または2を入力してください。")

        scope_certainty = min(
            5, self.project.clarity_level + (1 if "CLIENT_AGREED_STAGED" in self.obtained_knowledge else 0)
        )
        expectation_gap = min(100.0, self.project.customer.satisfaction)
        team_safety = min(100.0, self.pl.morale if self.pl else 50.0)

        print("\n📊 【🎉 キックオフ防衛★診断結果】")
        print(f"  ・1. 要件確定度 / スコープ防衛度 : {'★' * scope_certainty} ({scope_certainty}/5)")
        print(f"  ・2. 顧客期待値ギャップ適正度   : {expectation_gap:.0f}%")
        print(f"  ・3. チーム心理的安全性        : {team_safety:.0f}%")
        print(f"  ・4. 上司信頼度               : {self.project.manager_satisfaction:.0f}%")
        print(f"  ・5. 開発本番へ引き継ぐ残り納期 : {self.project.deadline_weeks} 週間")

        print("\n🗣️ 【関係者からの決起セリフ】")
        if self.pl:
            print(
                f"  ・PL {self.pl.name}: 『{self.pm.name}さん、事前調整ありがとうございます！この体制ならチーム一丸で頑張れます！』"
            )
        print(f"  ・顧客 {self.project.customer.name}: 『キックオフでの方針合意、心強いよ。頼んだよ！』")

        input("\n[Enterキーで開発スプリント (Phase 2) へ突入！]")

        return {
            "scope_certainty": scope_certainty,
            "expectation_gap": expectation_gap,
            "team_safety": team_safety,
        }

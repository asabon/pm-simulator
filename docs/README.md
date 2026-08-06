# PM Simulator - ドキュメントマップ (docs/)

本フォルダは、「PMシミュレーター」の仕様書・設計書・ゲームバランスをモジュールごとに分割して管理するディレクトリです。
変更箇所の PR 差分（Files Changed）を見ることで、どのフェーズの仕様やパラメータが更新されたかが一目で把握できるように設計されています。

---

## 📂 ディレクトリ構成 ＆ 役割

### 📖 `spec/` (仕様書ディレクトリ)
プレイヤーが体験するゲームシステム・ルール・全体コンセプトを記述します。

* [spec/overview.md](file:///e:/work/pm-simulator/docs/spec/overview.md): **全体概要・設計思想・統一3大評価指標**
* [spec/career_loop.md](file:///e:/work/pm-simulator/docs/spec/career_loop.md): **年間キャリアマネジメント・人事更新（加齢・退職・新入社員）**
* [spec/phase1_kickoff.md](file:///e:/work/pm-simulator/docs/spec/phase1_kickoff.md): **フェーズ1: キックオフ（ヒアリング ➔ 3AP事前調整 ➔ 手法宣言 ➔ チーム決起）**
* [spec/phase2_sprint.md](file:///e:/work/pm-simulator/docs/spec/phase2_sprint.md): **フェーズ2: 開発スプリント（週進行 ➔ 定期報告 ➔ トラブル割り込み対応）**
* [spec/phase3_closing.md](file:///e:/work/pm-simulator/docs/spec/phase3_closing.md): **フェーズ3: クロージング（最終成果物精算 ➔ 人事・組織更新）**

---

### ⚙️ `design/` (設計・パラメータディレクトリ)
数値バランス・トレードオフ要素・技術データモデルを記述します。

* [design/action_balance.md](file:///e:/work/pm-simulator/docs/design/action_balance.md): **キックオフ全8アクションのメリット・副作用・コンボ設定**
* [design/adv_ui_spec.md](file:///e:/work/pm-simulator/docs/design/adv_ui_spec.md): **ADV風コマンド選択式 Web UI 仕様書 (場所・人物移動型 & イベントシステム)**
* [design/methodology_balance.md](file:///e:/work/pm-simulator/docs/design/methodology_balance.md): **開発手法（🌊 WF vs 🔄 アジャイル）のメリット・デメリット対比**
* [design/data_architecture.md](file:///e:/work/pm-simulator/docs/design/data_architecture.md): **データモデル・データ駆動型エンジン設計 (Python / Web / Godot共通)**

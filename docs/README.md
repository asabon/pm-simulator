# PM Simulator - ドキュメントマップ (docs/)

本フォルダは、「PMシミュレーター」の仕様書・設計書・ゲームバランス・開発ガイドラインを管理するディレクトリです。

---

## 📂 ディレクトリ構成 ＆ 役割

### ☕ [docs/spec/ (カフェ開店編・最新現行仕様)](file:///e:/work/pm-simulator/docs/spec/overview.md)
専門用語を使わず、身近な「カフェの新規開店」を題材にPMの本質（段取り・合意形成・人間関係）を学ぶ最新仕様書群です。
* **[spec/overview.md (全体概要)](file:///e:/work/pm-simulator/docs/spec/overview.md)**: カフェオープン版のゲームシステム、PM概念対応表、登場人物モデル、コアループ
* **spec/pm_commands.md** *(今後作成)*: 各種PMコマンドの詳細と効果・前提条件
* **spec/events.md** *(今後作成)*: オーナーのちゃぶ台返しや保健所検査等のイベント仕様
* **design/balance.md** *(今後作成)*: パラメータ・数値バランス設計

#### 🎯 現行仕様のコアコンセプト
1. **IT専門用語の完全排除**: 動線設計・レシピ・保健所許可など、日常用語でマネジメントを可視化。
2. **PMの本質に純化**: 「誰のために作るか（合意）」「誰がどうやるか（段取り・レシピ）」「トレードオフ（予算・日数・体力）」にフォーカス。
3. **直感的な手戻りと失敗の学び**: 自由なコマンド選択により、「準備不足でいきなり工事・練習をして大炎上」するリアルな学びを提供。

---

### 🛠 [AI開発ガイドライン & 開発ハーネス規約 (AGENTS.md)](file:///e:/work/pm-simulator/AGENTS.md)
プロジェクト共通の開発規約・Git運用・Issue駆動ワークフロー・AI開発ガードレールです。
* [AGENTS.md (リポジトリ直下)](file:///e:/work/pm-simulator/AGENTS.md): Git / GitHub / Issue 運用規約 ＆ ガイドライン

---

### 📦 [docs/old/ (過去バージョンアーカイブ)](file:///e:/work/pm-simulator/docs/old/README.md)
過去に検討・試行錯誤された旧バージョンの仕様・設計アーカイブです。
* **[old/v2/](file:///e:/work/pm-simulator/docs/old/v2/README.md)**: IT開発編ゼロベース仕様アーカイブ
* **[old/v1/](file:///e:/work/pm-simulator/docs/old/v1/README.md)**: 初期バージョン（キックオフ3AP制やWF/アジャイル対比等）のアーカイブ

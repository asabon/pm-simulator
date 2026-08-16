# 🏗️ データモデル ＆ アーキテクチャ設計 (Data Architecture)

## 1. 概要 ＆ アーキテクチャ方針
本プロジェクトは、Python CLI プロトタイプを廃止し **Web プロトタイプ (Vanilla JS / ES Module)** に一本化・再構築されています。  
将来的な **Godot 4 (GDScript) への本格移植** を考慮し、データモデル・コア計算エンジン・サービス層・UI層を分離した **レイヤードアーキテクチャ ＆ データ駆動型設計 (Data-Driven Engine)** を採用しています。

---

## 2. レイヤードクラス構成 (モジュール設計)

```
 [ UI / View Layer ]        web/src/app.js, index.html
         │
         ▼
 [ Service Layer ]          CustomerService, TeamService, SprintService, KickoffService, GameSession
         │
         ▼
 [ Core Engine Layer ]      KickoffEngine
         │
         ▼
 [ Domain Model Layer ]     Project, Person/Developer, Task, Customer, Archetype, CommandResult
```

### 1) 📦 ドメインモデル層 (`web/src/entities.js`, `web/src/command_result.js`)
純粋な状態保持とデータ構造を定義します。UIや特定フレームワークに依存しません。
* `Project`: 案件属性（要件明確度・納期・期待スコープ・顧客満足度初期値等）
* `Person` / `Developer`: メンバー属性（役割・スキル・疲労度・レゾリューション・モチベーション・年齢）
* `Task`: 開発タスク（概算工数・実進捗・潜在バグ数等）
* `Customer` / `Archetype`: 顧客属性・性格アーキタイプ（こだわり・妥協点）
* `CommandResult`: 各アクションの標準返却オブジェクト（成功判定・概要・ログメッセージ・状態変更値）

### 2) ⚙️ コアエンジン層 (`web/src/engine.js`)
シミュレーションのCoreロジックおよび評価方程式を担う純粋な計算エンジンです。
* `KickoffEngine`: キックオフ事前交渉・AP評価・ダイナミクス判定・勝利判定ロジック

### 3) 🛠️ サービス / アプリケーション層 (`web/src/*_service.js`, `web/src/game_session.js`)
特定のドメインコンテキストに閉じたビジネスロジックと状態操作を担当します。
* `CustomerService`: 顧客満足度・期待値の調整・ステークホルダー交渉ロジック
* `TeamService`: チーム全体の疲労度ケア・アサイン委任・ストレス緩和
* `SprintService`: 週次開発スプリントの自動進行・イテレーション精算
* `KickoffService`: キックオフ時におけるPM介入アクションの実行・AP消費管理
* `GameSession`: 現在のゲーム状態・フェーズ遷移・セッション全体のステート管理

### 4) 🎨 プレゼンテーション / UI層 (`web/src/app.js`, `web/index.html`)
ユーザー操作のイベントハンドリングおよびダッシュボード表示の最新化を行います。
* サービス層から返却された `CommandResult` を受け取り、画面描画・ログ表示・アニメーションを制御します。

---

## 3. データフロー ＆ コマンドパターン
1. **ユーザーの操作 (UI)**: プレイヤーが画面上でアクションを選択（例: 顧客事前ネゴ）
2. **サービス呼び出し**: `app.js` ➔ `KickoffService.executeAction()` または `CustomerService.adjustSatisfaction()`
3. **エンジン評価**: サービス層が `KickoffEngine` やエンティティを参照して計算
4. **結果返却**: カプセル化された `CommandResult` が UI に返却され、画面ログおよび各メーターが動的に更新される

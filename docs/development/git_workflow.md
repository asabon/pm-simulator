# Git & GitHub 運用規約ガイドライン

本ドキュメントは、本リポジトリ（PM Simulator）における Git / GitHub のブランチ運用、Issue駆動開発フロー、およびプルリクエスト（PR）作成・クリーンアップの標準ガイドラインを定義します。人間（開発者）および AI（Antigravity）共通の仕様規格として運用します。

---

## 🎯 1. 基本原則

1. **`main` ブランチ保護**: `main` ブランチへの直接のコミットおよび直接プッシュは**厳禁**とします（`.githooks/` で自動ブロック）。
2. **Issue 駆動 ＆ 専用ブランチ必須**: すべての変更（新機能・バグ修正・リファクタリング・仕様策定・保守 `chore`）は、まず `docs/issues/` に Issue を起票し、専用トピックブランチを作成して作業を行います。
3. **シングル・ソース・オブ・トゥルース（Single Source of Truth）**: 開発ルールや仕様の変更は本ドキュメント、`AGENTS.md`、および `docs/` 配下に集約します。

---

## 🌿 2. ブランチ運用 ＆ 命名規則

### 2.1 作業着手前のブランチ自動検証 ＆ 選択判定
ファイルを1文字でも編集・変更する前に、必ず現在のブランチを確認します。
```bash
git branch --show-current
```

#### ブランチ自動選択の判定基準
1. **現在のブランチが `main` の場合**:
   * 直ちに Issue を起票（または専用トピックブランチ作成）し、ブランチを切り替えてから作業を開始します。
2. **現在のブランチが `main` 以外（既に作業ブランチ上にいる）の場合**:
   * **[既存ブランチの継続]**: ユーザーの依頼が「現在の作業の続き」「フィードバックの修正・追加対応」「CI失敗の修正」など同じ文脈である場合 ➔ **現在の作業ブランチを維持**してそのまま作業を続行します。
   * **[新規ブランチの作成]**: ユーザーの依頼が既存作業とは異なる「新しい機能の追加」「まったく別の仕様変更」など新しい文脈である場合 ➔ 一度 `git checkout main` で `main` に戻って `git pull origin main` を行い、**新しい Issue 起票と専用トピックブランチ作成を行ってから**作業を開始します。

### 2.2 ブランチ命名規則 (`<type>/<3桁連番>-<概要>`)
すべてのトピックブランチは、起票した Issue 番号（3桁連番）に基づき以下の形式で作成します。`.githooks/pre-commit` により命名規則が自動検証されます。

| 種別 | ブランチ名の形式 | 例 |
| :--- | :--- | :--- |
| **`feature/`** | 新機能・新規仕様の実装 | `feature/001-cafe-commands` |
| **`fix/`** | バグ・不具合の修正 | `fix/005-status-calc-bug` |
| **`refactor/`** | 仕様を変えない構造改善 | `refactor/008-extract-event-engine` |
| **`docs/`** | ドキュメント類（仕様書、README等）の追加・修正 | `docs/002-cafe-menu-spec` |
| **`chore/`** | ビルド設定・依存関係更新・保守作業 | `chore/004-upgrade-vitest` |
| **`test/`** | 単体テスト等の追加・更新 | `test/006-engine-tests` |

---

## 📝 3. Issue 駆動 ＋ 仕様書先行 ＋ PR 差分レビュー方式

1. **Issue 駆動開発 (`docs/issues/`)**:
   - 作業開始前に、[`docs/issues/TEMPLATE.md`](file:///e:/work/pm-simulator/docs/issues/TEMPLATE.md) を使用して `docs/issues/<3桁連番>-<概要>.md` を作成します（※ `.agents/skills/create-issue/` スキルを活用）。
   - 目的、受け入れ基準（Acceptance Criteria）、設計メモを明文化し、作業の初期コミットとします。
2. **`docs/spec/` 先行更新**:
   - 仕様に関する変更・合意内容は、コード実装前にまず `docs/spec/` 配下の該当仕様書に反映・更新します。コードと仕様書の乖離を防止します。
3. **受け入れ基準の検証と Issue 完了更新**:
   - 作業完了時に動作確認を行い、Issue ファイルの受け入れ基準チェックボックスを埋め、ステータスを `完了` に更新してコミットします。
4. **【AI必須ルール】議論確定からPR発行までの一連作業自動完遂 (End-to-End Auto PR)**:
   - ユーザーとの相談・議論により修正内容や実装計画が確定し作業を開始した後は、**「ファイル修正 ➔ テスト・Lint検証 ➔ `/create-pr` による PR 発行 ➔ CI検証」までを途中で止めず、一連の作業として自動完遂**します。

---

## 🚀 4. PR（プルリクエスト）作成フロー

PRの作成時は、事前品質検証と統一テンプレートを適用するため、必ず `.agents/skills/create-pr/SKILL.md`（または `/create-pr` スラッシュコマンド）のワークフローに従います。

### 4.1 事前品質レビュー ＆ テスト自動実行
PR作成前に、以下の専門スキルによるセルフレビューを実施します。
* **コード変更** ➔ `run-tests` スキル（`npm test`）＆ `code-review` スキル（`npm run lint` / コード品質）
* **ドキュメント変更** ➔ `doc-review` スキル（用語の統一、リンク切れチェック）

### 4.2 統一テンプレートと CLI 発行
* PR タイトルは `[種別] Issue #XXX: 概要` とします。
* PR の説明文は [`.github/pull_request_template.md`](file:///e:/work/pm-simulator/.github/pull_request_template.md) に準拠し、一時ファイル `.git/pr_body.md` に書き出します。
* シェルのエスケープ事故を防ぐため、ワンライナー（`--body "..."`）は禁止し、必ず `--body-file` オプションを使用して発行します。
```powershell
# PR本文を .git/pr_body.md に記述した上で実行
$env:GITHUB_TOKEN=$null; $env:GH_TOKEN=$null; gh pr create --title "[種別] Issue #XXX: 概要" --body-file .git/pr_body.md --base main
```

### 4.3 GitHub Actions CI 結果の確認 ＆ 自動対応
* PR発行後、必ず `gh pr checks` で GitHub Actions CI の実行状況と最終ステータスを確認します。
* CI が成功（Pass）することを確認した上で完了報告を行います。失敗した場合はログを取得して原因箇所を修正し、追加プッシュを行います。

---

## 🧹 5. マージ完了後のクリーンアップフロー

PRがGitHub上でマージされた後は、`.agents/skills/clean-merged-branches/SKILL.md`（または `/clean-merged-branches` / `/clean-branches` / `/merged`）のワークフローに従い、ローカルおよびリモート追跡情報を完全クリーンアップします。

### 実行4ステップ:
1. **`main` へ切り替え**: `git checkout main`
2. **最新の変更を同期**: `git pull origin main`
3. **リモート追跡情報の消去**: `git fetch --prune`
4. **ローカル作業ブランチの削除**: `git branch -d <target_branch>`

---

## 🔗 関連ファイル
* ルール統括: [.agents/AGENTS.md](file:///e:/work/pm-simulator/.agents/AGENTS.md)
* Issue テンプレート: [docs/issues/TEMPLATE.md](file:///e:/work/pm-simulator/docs/issues/TEMPLATE.md)
* PR テンプレート: [.github/pull_request_template.md](file:///e:/work/pm-simulator/.github/pull_request_template.md)
* Issue作成スキル: [.agents/skills/create-issue/SKILL.md](file:///e:/work/pm-simulator/.agents/skills/create-issue/SKILL.md)
* PR作成スキル: [.agents/skills/create-pr/SKILL.md](file:///e:/work/pm-simulator/.agents/skills/create-pr/SKILL.md)
* クリーンアップスキル: [.agents/skills/clean-merged-branches/SKILL.md](file:///e:/work/pm-simulator/.agents/skills/clean-merged-branches/SKILL.md)

# Git & GitHub 運用規約ガイドライン

本ドキュメントは、本リポジトリ（PM Simulator）における Git / GitHub のブランチ運用、開発フロー、およびプルリクエスト（PR）作成・クリーンアップの標準ガイドラインを定義します。人間（開発者）および AI（Antigravity）共通の仕様規格として運用します。

---

## 🎯 1. 基本原則

1. **`main` ブランチ保護**: `main` ブランチへの直接のコミットおよび直接プッシュは**厳禁**とします。
2. **専用ブランチ必須**: すべてのコード変更・テキスト修正・仕様策定・バグ修正は、必ず専用のトピックブランチを作成して作業を行います。
3. **シングル・ソース・オブ・トゥルース（Single Source of Truth）**: 開発ルールや仕様の変更は本ドキュメントおよび `docs/` 配下に集約し、AIスキルや指示書からは本仕様を参照します。

---

## 🌿 2. ブランチ運用 ＆ 命名規則

### 2.1 作業着手前のブランチ自動検証 ＆ 選択判定
ファイルを1文字でも編集・変更する前に、必ず現在のブランチを確認します。
```bash
git branch --show-current
```

#### ブランチ自動選択の判定基準
1. **現在のブランチが `main` の場合**:
   * 直ちに新しい専用トピックブランチ（`feature/...`, `fix/...`, `docs/...`）を作成・切り替えてから作業を開始します。
2. **現在のブランチが `main` 以外（既に作業ブランチ上にいる）の場合**:
   * **[既存ブランチの継続]**: ユーザーの依頼が「現在の作業の続き」「フィードバックの修正・追加対応」「CI失敗の修正」など同じ文脈である場合 ➔ **現在の作業ブランチを維持**してそのまま作業を続行します。
   * **[新規ブランチの作成]**: ユーザーの依頼が既存作業とは異なる「新しい機能の追加」「まったく別の仕様変更」など新しい文脈である場合 ➔ 一度 `git checkout main` で `main` に戻って `git pull origin main` を行い、**新しい専用トピックブランチを新規作成・切り替えてから**作業を開始します。

### 2.2 タイムスタンプ命名規則 (重複衝突防止)
過去のローカル・リモートブランチとの命名衝突を100%防止するため、ブランチ名の末尾には必ず現在日時のタイムスタンプ（`MMDD-HHMM`）を付与します。

| 種別 | ブランチ名の形式 | 例 |
| :--- | :--- | :--- |
| **新機能・拡張** | `feature/<概要>-MMDD-HHMM` | `feature/kickoff-dynamic-engine-0807-1816` |
| **バグ・表記修正** | `fix/<概要>-MMDD-HHMM` | `fix/my-desk-wording-0807-1801` |
| **ドキュメント・ルール** | `docs/<概要>-MMDD-HHMM` | `docs/git-workflow-rule-consolidation-0807-1816` |

---

## 📝 3. 仕様書駆動 ＋ PR 差分レビュー方式

1. **原則 Issue 起票なし（トークン節約＆仕様可視化）**:
   - タスクや仕様変更を行う際は、原則として GitHub Issue を作成せず、直接ブランチを切って作業を開始します。
2. **`docs/` 先行更新**:
   - 変更内容・合意内容を、まず `docs/` 配下の該当ドキュメント（`docs/spec/` や `docs/design/`）に明記・更新した上で、ソースコードの実装を行います。
3. **PR 差分レビュー**:
   - レビュアー（ユーザー）は PR の `docs/` 差分（File Changed）を見ることで、「どのような仕様・設計に変更されたか」を一目瞭然で確認・レビュー・承認できます。
   *※長期的なプロジェクト管理などで明示指示があった場合のみ、例外として `create-issue` スキルで Issue を起票します。*
4. **【AI必須ルール】議論確定からPR発行までの一連作業自動完遂 (End-to-End Auto PR)**:
   - ユーザーとの相談・議論により修正内容や実装計画が確定し作業を開始した後は、**「ファイル修正 ➔ テスト・Lint検証 ➔ `/create-pr` による PR 発行」までを途中で止めず、一連の作業として自動完遂**します。
   - 作業途中で「PRを発行しますか？」などの手動確認を挟まず、作業承認を得た時点で PR 発行までを一括実行します。

---

## 🚀 4. PR（プルリクエスト）作成フロー

PRの作成時は、事前品質検証と統一テンプレートを適用するため、必ず `.agents/skills/create-pr/SKILL.md`（または `/create-pr` スラッシュコマンド）のワークフローに従います。

### 4.1 事前品質レビュー ＆ テスト自動実行
PR作成前に、以下の専門スキルによるセルフレビューを実施します。
* **コード変更** ➔ `run-tests` スキル（`npm test` / `npm run lint` 等）＆ `code-review` スキル
* **ドキュメント変更** ➔ `doc-review` スキル（用語の統一、リンク切れチェック）

### 4.2 統一テンプレートと CLI 発行
* PRの説明文は、`.git/pr_body.md` 一時ファイルに統一フォーマットで生成します。
* ワンライナー文字列指定（`--body "..."`）は禁止し、必ず `--body-file` オプションを使用して `gh` CLI から発行します。
```powershell
# PR本文を .git/pr_body.md に記述した上で実行
$env:GITHUB_TOKEN=$null; $env:GH_TOKEN=$null; gh pr create --title "<タイトル>" --body-file .git/pr_body.md
```

### 4.3 GitHub Actions CI 結果の確認 ＆ 自動対応
* PR発行後、必ず `gh pr checks` 等で GitHub Actions CI の実行状況と最終ステータスを確認します。
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
* PR作成スキル: [.agents/skills/create-pr/SKILL.md](file:///e:/work/pm-simulator/.agents/skills/create-pr/SKILL.md)
* クリーンアップスキル: [.agents/skills/clean-merged-branches/SKILL.md](file:///e:/work/pm-simulator/.agents/skills/clean-merged-branches/SKILL.md)

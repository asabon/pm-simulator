---
name: create-pr
description: ユーザーから「PR出して」「PR作成」「PR提出」「プルリクエスト」等の依頼を受けた際に必ず発動。事前品質レビュー・テスト実行・自動修正を行い、必ず統一テンプレート（.git/pr_body.md）を使用して gh CLI から PR を自動発行し、GitHub Actions CI の実行結果確認まで完了するスキル。
---

# Create PR Skill

本スキルは、ユーザーからプルリクエスト（PR）の作成を依頼された際に、事前品質チェック・自動修正・ブランチ操作・統一テンプレートによるPR生成・GitHub Actions CI結果確認を一括で安全に自動実行するワークフローを定義します。

> 📖 **関連規約**: 本スキルの処理は [docs/development/git_workflow.md](file:///e:/work/pm-simulator/docs/development/git_workflow.md) の「4. PR作成フロー」に準拠します。

## 🛠 実行フロー

### STEP 1: 差分確認 ＆ レビュースキル自動実行
1. `git status` および `git diff` で変更ファイルを確認する。
2. 変更ファイルの種類に応じて、以下の専門スキルを実行する:
   * コード変更（`.js`, `.gd` 等）が含まれる場合 ➔ `run-tests` スキルでテスト実行 ＆ `code-review` スキルで品質チェック。
   * ドキュメント変更（`.md` 等）が含まれる場合 ➔ `doc-review` スキルで整合性・リンク切れチェック。

### STEP 2: AIによる自動修正 ＆ コミット
* レビュー過程で型アノテーション漏れ、軽微な誤字脱字、リンクミス等の**AIが直接修正可能な不備が見つかった場合、その場でファイルを直接自動修正**する。
* 修正した内容をコミットに含める。

### STEP 3: ブランチ切り ＆ リモートプッシュ
1. `main` ブランチから切ったフィーチャーブランチ（例: `feature/xxx` または `fix/xxx`）を作成する。
2. 日本語のコミットメッセージでコミットを作成する。
3. `git push -u origin <branch_name>` でリモートにプッシュする。

### STEP 4: 統一テンプレートによるPRの作成

> [!CAUTION]
> **【CRITICAL】絶対禁止事項**
> `gh pr create --body "..."` などのワンライナー指定で直接 PR を作成することは厳禁とする。
> 必ず事前に `.git/pr_body.md` を作成し、`## 🎯 目的`, `## 📝 変更概要`, `## 🔍 セルフレビュー ＆ テスト実行結果` の全セクションを含む統一テンプレートを記述した上で、`--body-file .git/pr_body.md` を指定して PR を作成しなければならない。

1. 以下の標準PRテンプレートに従って PR の説明文（Body）を一時ファイル `.git/pr_body.md` に作成する:

```markdown
## 🎯 目的
- Closes #<Issue番号> (※関連Issueが存在する場合)
- (今回変更を行った理由・背景・解決する課題)

## 📝 変更概要
- (実施した具体的な変更内容の箇条書き)

## 🔍 セルフレビュー ＆ テスト実行結果
- **実行スキル**: `code-review` / `doc-review` / `run-tests`
- **検証・自動修正結果**:
  - [x] 自動テスト結果: Pass (または該当なし)
  - [x] コード規約 / 品質チェック: クリア (AIが自動修正した項目があれば具体的に記載)
  - [x] ドキュメント整合性・リンクチェック: クリア
```

2. PowerShell環境でのエスケープ事故を防ぐため、事前に環境変数を無効化した上で `--body-file` オプションを使用して `gh` コマンドを実行する:
   ```powershell
   # PR本文を一時ファイル .git/pr_body.md に作成した上で実行
   $env:GITHUB_TOKEN=$null; $env:GH_TOKEN=$null; gh pr create --title "..." --body-file .git/pr_body.md
   ```
3. 生成された PR のリンクをユーザーに報告する。

### STEP 5: GitHub Actions CI ステータスの確認
1. PR 発行後、以下のコマンドで GitHub Actions CI の実行状態を確認・監視する:
   ```powershell
   $env:GITHUB_TOKEN=$null; $env:GH_TOKEN=$null; gh pr checks <pr_number>
   ```
2. CIが実行中の場合（`in_progress`）、必要に応じて少し待機した上でステータスを再確認する。
3. **検証結果の判定**:
   - **Pass (成功)**: CIの成功を確認し、ユーザーにその旨を報告する。
   - **Fail (失敗)**: 万一CIが失敗した場合は、`gh run view <run_id> --log-failed` でエラーログを取得して原因を特定し、自動修正および修正コミットの追加プッシュを行う。

### STEP 6: PRマージ報告後の完全自動クリーンアップ
ユーザーから「マージしました」「マージ完了」や `/clean-branches` (`/merged`) 等の連絡・コマンドを受けた際、直ちに `clean-branches` スキルのワークフローに従い、`main` への同期・リモート追跡消去・作業ブランチ削除の完全クリーンアップを実行すること。

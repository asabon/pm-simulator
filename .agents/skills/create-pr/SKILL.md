---
name: create-pr
description: ユーザーから「PR出して」「PR作成」「PR提出」「プルリクエスト」等の依頼を受けた際に必ず発動。事前品質レビュー・テスト実行・自動修正を行い、必ず統一テンプレート（.git/pr_body.md）を使用して gh CLI から PR を自動発行し、GitHub Actions CI の実行結果確認まで完了するスキル。
---

# Create PR Skill

本スキルは、トピックブランチでの作業完了時に、事前品質チェック・自動修正・統一テンプレート（`.github/pull_request_template.md` 準拠）による PR 生成・GitHub CLI 発行・GitHub Actions CI 結果確認を一括で安全に自動実行するワークフローを定義します。

---

## 🛠 実行フロー

### STEP 1: 差分確認 ＆ レビュースキル自動実行
1. `git status` および `git diff` で変更ファイルを確認する。
2. 変更ファイルの種類に応じて、以下の専門スキルを実行する:
   - コード変更（`.js`, `.gd` 等）が含まれる場合 ➔ `run-tests` スキルでテスト実行（`npm test`）＆ `code-review` スキルで静的解析（`npm run lint`）と品質チェック。
   - ドキュメント変更（`.md` 等）が含まれる場合 ➔ `doc-review` スキルで整合性・リンク切れチェック。
3. 関連する Issue ファイル（`docs/issues/<3桁連番>-<概要>.md`）がある場合は、受け入れ基準・チェックリストがすべて満たされ、ステータスが `完了` に更新されていることを確認する。

### STEP 2: AIによる自動修正 ＆ コミット
- レビュー過程で Lint 警告、軽微な誤字脱字、リンクミス等の**AIが直接修正可能な不備が見つかった場合、その場でファイルを直接自動修正**する。
- 修正した内容をコミットに含める。

### STEP 3: コミット ＆ リモートプッシュ
1. 作業トピックブランチ（例: `<タイプ>/<3桁番号>-<概要>`）であることを確認する。
2. 日本語のコミットメッセージでコミットを作成する。
3. `git push -u origin <branch_name>` でリモートにプッシュする。

### STEP 4: 統一テンプレートによる PR の作成

> [!CAUTION]
> **【CRITICAL】絶対禁止事項**
> `gh pr create --body "..."` などのワンライナー指定で直接 PR を作成することは厳禁とする。
> シェルのエスケープ事故（バッククォートの消失等）を防ぐため、必ず事前に `.git/pr_body.md` を作成し、`--body-file .git/pr_body.md` を指定して PR を作成しなければならない。

1. **PR タイトル形式**:
   - `[種別] Issue #XXX: 概要` （または `[種別] 概要`）
   - 例: `[Feature] Issue #001: カフェ開店編のコアループ・コマンド体系を定義`
   - 種別: `[Feature]`, `[Fix]`, `[Refactor]`, `[Docs]`, `[Chore]`, `[Test]`
2. **PR 本文**:
   - [`.github/pull_request_template.md`](file:///e:/work/pm-simulator/.github/pull_request_template.md) の構成に沿って、`.git/pr_body.md` に書き出す:
     - `## 概要 / Overview`
     - `## 関連 Issue / Related Issue` (例: `docs/issues/001-xxx.md`)
     - `## 変更内容 / Changes`
     - `## 動作確認 / Verification` (テスト結果、Lint結果、レビュー結果)
     - `## 備考 / Notes`
3. **PR 作成コマンドの実行**:
   ```powershell
   $env:GITHUB_TOKEN=$null; $env:GH_TOKEN=$null; gh pr create --title "[種別] Issue #XXX: 概要" --body-file .git/pr_body.md --base main
   ```
4. 生成された PR の URL をユーザーに報告する。

### STEP 5: GitHub Actions CI ステータスの確認
1. PR 発行後、以下のコマンドで GitHub Actions CI の実行状態を確認・監視する:
   ```powershell
   $env:GITHUB_TOKEN=$null; $env:GH_TOKEN=$null; gh pr checks <pr_number>
   ```
2. CIが実行中の場合（`pending` / `in_progress`）、適宜待機して完了まで確認する。
3. **検証結果の判定**:
   - **Pass (成功)**: CIの成功を確認し、ユーザーにその旨を報告する。
   - **Fail (失敗)**: 万一CIが失敗した場合は、エラーログを取得して原因を特定し、自動修正および修正コミットの追加プッシュを行う。

### STEP 6: PRマージ報告後の完全自動クリーンアップ
ユーザーから「マージしました」「マージ完了」や `/clean-merged-branches` (`/merged`) 等の連絡を受けた際、直ちに `clean-merged-branches` スキルのワークフローに従い、`main` への同期・リモート追跡消去・作業ブランチ削除の完全クリーンアップを実行すること。

---
name: create-issue
description: ユーザーと仕様決定後、GitHub Issueを発行（「Issue作成」「Issue出して」等）し、Issue紐付けブランチ（feature/issue-XX-xxx 等）を自動作成するスキル。
---

# Create Issue Skill

本スキルは、ユーザーとチャット上で仕様合意・タスク確定した際に、GitHub Issueの自動起票およびIssue番号に紐付いたGitブランチの作成を一括で安全に自動実行するワークフローを定義します。

## 🛠 実行フロー

### STEP 1: Issue 内容の整理 ＆ ラベル判定
1. チャットでの議論・合意事項から、以下の要素を抽出・整理する：
   - **タイトル**: 簡潔かつ具体的な概要（例: `feat: ヘッダーにフェーズナビゲーション（ステッパー）を追加`）
   - **目的・背景**: なぜこの変更を行うか・解決する課題
   - **仕様・変更内容**: 実施する具体的な変更の箇条書き
   - **完了条件**: チェックリスト (`- [ ] ...`)
2. 変更の種類に応じた GitHub ラベルを選定する：
   - 新機能・改善 ➔ `enhancement`
   - バグ修正 ➔ `bug`
   - ドキュメント更新 ➔ `documentation`

### STEP 2: Issue の起票 (GitHub CLI)
1. PowerShell環境での事故防止（バッククォートエスケープやダミートークン干渉）のため、Issue本文を一時ファイル（`.git/issue_body.md`）に書き出す。
2. 環境変数をリセットした上で GitHub CLI で Issue を作成する：
   ```powershell
   powershell -NoProfile -Command "Remove-Item Env:\GITHUB_TOKEN -ErrorAction SilentlyContinue; Remove-Item Env:\GH_TOKEN -ErrorAction SilentlyContinue; gh issue create --title '...' --label '...' --body-file .git/issue_body.md"
   ```
3. 発行された Issue 番号（例: `#36`）および URL を取得する。

### STEP 3: Issue 紐付けブランチの作成
1. 最新の `main` ブランチから、Issue 番号を含んだフィーチャーブランチを作成・チェックアウトする：
   - 機能追加 ➔ `feature/issue-36-short-name`
   - バグ修正 ➔ `fix/issue-37-short-name`
   - ドキュメント ➔ `docs/issue-38-short-name`
2. 発行された Issue の URL と、切り替えたブランチ名をユーザーに報告し、実装を開始する。

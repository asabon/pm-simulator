---
name: clean-merged-branches
description: スラッシュコマンド `/clean-merged-branches` や `/clean-branches` の実行、ユーザーから「/merged」「マージしました」「マージ完了」「ブランチ削除」等のメッセージを受けた際に必ず自動発動。main への同期・リモート追跡消去・作業ブランチ削除の完全クリーンアップを一貫実行するスキル。
---

# Clean Merged Branches (PR Clean-up) Skill

本スキルは、ユーザーから GitHub PR のマージ完了連絡（スラッシュコマンド `/clean-merged-branches`, `/clean-branches`, `/merged`、「マージしました」「マージ完了」等）を受けた際に、自動的に `main` ブランチへの同期と作業用ブランチの完全クリーンアップを安全かつ迅速に行うワークフローを定義します。

> 📖 **関連規約**: 本スキルの処理は [AGENTS.md](../../../AGENTS.md) の「3. Git / GitHub 開発ワークフロー & コミット規約」に準拠します。

## 🛠 実行フロー

### STEP 1: 現在のブランチ・削除対象ブランチの特定
1. `git branch --show-current` で現在のブランチ名を確認する。
2. もし現在のブランチが `main` 以外（例: `fix/xxx`, `feature/xxx`）の場合は、そのブランチ名を削除対象 `<target_branch>` とする。
3. もし既に `main` にいる場合は、`git branch -a` または `git log` を確認し、直前にマージ・プッシュされたフィーチャー/修正ブランチを特定する。

### STEP 2: main への切り替え ＆ 最新化
1. `git checkout main` で `main` ブランチへ切り替える。
2. `git pull origin main` を実行し、マージされた最新の変更をローカル `main` に同期する。

### STEP 3: リモート追跡情報のクリーンアップ
1. `git fetch --prune` を実行し、リモート（GitHub）で削除されたブランチの追跡情報（`remotes/origin/...`）をローカルから追放する。

### STEP 4: ローカル作業ブランチの削除
1. マージ済みの作業ブランチを `git branch -d <target_branch>` でローカルから安全に削除する。
   *(※万が一 `git branch -d` で未マージ警告等が出た場合でも、GitHub上でのPRマージが完了していることを `git log` で確認の上、`-D` で削除する)*

### STEP 5: 状態の確認 ＆ ユーザーへの報告
1. `git branch -a` を実行し、全ブランチ一覧が綺麗になったことを確認する。
2. クリーンアップ完了メッセージをユーザーに送信する。

---
name: create-issue
description: >-
  Create a new Issue markdown file under docs/issues/ and switch to a corresponding
  topic branch (<type>/<3-digit-number>-<summary>) following the standard workflow.
---

# Issue 起票 & ブランチ作成スキル

新機能開発、バグ修正、リファクタリング、ドキュメント作成、ビルド保守など、**あらゆる作業を開始する際に必ず実行するスキル**です。

## 手順

1. **既存 Issue の確認と採番**
   - `docs/issues/` 配下のファイル一覧を確認し、最大の3桁連番を特定して次の番号を決定する（例: ファイルがなければ `001`、`001` があれば次は `002`）。
   ```powershell
   Get-ChildItem docs/issues/*.md
   ```

2. **Issue ファイルの作成**
   - [`docs/issues/TEMPLATE.md`](file:///e:/work/pm-simulator/docs/issues/TEMPLATE.md) をコピーして `docs/issues/<3桁番号>-<概要>.md` を作成する。
   - タイトル、目的、受け入れ基準（Acceptance Criteria）、設計メモを記述する。
   - ステータスを `進行中`（または `未着手`）にする。

3. **トピックブランチの作成と切り替え**
   - タイプを選定（`feature`, `fix`, `refactor`, `docs`, `chore`, `test`）。
   - `main` ブランチが最新であることを確認した上で、ブランチを作成・切り替えする。
   ```powershell
   git checkout main
   git pull origin main
   git checkout -b <タイプ>/<3桁番号>-<概要>
   ```

4. **Issue ファイルの初期コミット**
   - 作成した Issue ファイルをブランチの初期コミットとして追加する。
   ```powershell
   git add docs/issues/<3桁番号>-<概要>.md
   git commit -m "Issue #<3桁番号>: <タイトル> を起票"
   ```

5. **作業開始の準備完了**
   - 作成した Issue パスとブランチ名をユーザーに提示し、実装に着手する。

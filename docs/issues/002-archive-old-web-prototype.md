# Issue #002: 旧Webプロトタイプのアーカイブ（web/old/v1/）とCIの一時休止

- **ステータス**: 完了
- **作成日**: 2026-09-05
- **対象ブランチ**: `chore/002-archive-old-web-prototype`

---

## 🎯 目的 / 概要

現行仕様（カフェ開店編）と旧プロトタイプ実装（IT開発編）の乖離を解消し、仕様策定中のPRで不要なCI（テスト・リント）が毎回実行されるのを防ぐため、旧プロトタイプコードを `web/old/v1/` へ退避し、CIワークフローを一時休止する。

---

## 📋 要件 / 受け入れ基準 (Acceptance Criteria)

- [x] `web/` 配下の既存コード資産（HTML, JS, tests, package.json等）を `web/old/v1/` へ移動・退避
- [x] `.github/workflows/test.yml` および `deploy-pages.yml` を一時無効化（休止）
- [x] ルートの `README.md` を更新し、旧プロトタイプがアーカイブされた旨を明記
- [x] リポジトリ全体で壊れたリンクや不要な依存がないことを確認

---

## 💡 設計メモ・実装方針

- `git mv` を用いて Git 履歴を保持したまま `web/old/v1/` に移動した。
- ワークフローファイルは `.github/workflows/*.yml.disabled` にリネームして一時休止。新プロトタイプ実装時に容易に復旧可能。
- `vitest.config.js`, `package.json`, `scripts/update_version.js` のパスを更新し、ローカル検証時は引き続きテスト可能とした。

---

## 📝 完了チェックリスト

- [x] 受け入れ基準を満たす実装の完了
- [x] CI が不要にトリガーされないことの確認（ワークフロー無効化）
- [x] ドキュメント整合性の確認

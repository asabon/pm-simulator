# PM Simulator 開発進捗 ＆ 今後のアクション

本ドキュメントは、プロジェクト「PM Simulator」の現在のステータスと、次回開発時に引き継ぐべきタスクを整理したものです。

---

## 🚦 現在のステータス（2026-07-18 時点）

現在、マクロPM視点への移行、要件定義・スキルセット機能の刷新が完了し、さらに人間基底クラスの導入リファクタリングを行い、以下のプルリクエストがオープンされています。

* **オープン中のプルリクエスト**:
  🔗 **[GitHub Pull Request #5 - refactor: 人間(Person)基底クラスを導入し、DeveloperとCustomerの設計をリファクタリング](https://github.com/asabon/pm-simulator/pull/5)**
* **現在の作業ブランチ**: `feature/refactor-entities-with-person-class`

---

## 🛠 今回完了した実装（PR #5 に含まれる内容）

1. **🧑 人間（Person）基底クラスの新規導入**:
   - `id`, `name`, `role` を持った `Person` クラスを [entities.py](file:///e:/work/pm-simulator/prototype/entities.py) に新規定義。
   - `Developer` と `Customer` を `Person` の派生クラスとして再設計。
2. **💬 speak() 多態的インターフェース of Person**:
   - `Person` クラスに発言取得メソッド `speak()` を追加し、`Developer`（従来の `get_sign()` にマッピング）や `Customer` でオーバーライド可能に。
   - [main.py](file:///e:/work/pm-simulator/prototype/main.py) でステータス表示時の発言出力を `speak()` に差し替え。

---

## ⏭ 次回行うアクション（Next Steps）

1. **Pull Request #5 のマージとローカル同期**:
   - ユーザー側で GitHub 上の [PR #5](https://github.com/asabon/pm-simulator/pull/5) をレビュー・マージする。
   - ローカル環境で `main` ブランチに切り替え、最新化を行う。
     ```bash
     git checkout main
     git pull
     ```
2. **ゲームデザイン・仕様の検討と拡張プレイテスト**:
   - CLIプロトタイプを用いてさらなるゲーム性を高める拡張（性格タグの影響、スポット外注、バグの虚偽報告など）について議論し、必要に応じて追加実装・検証を行う。
3. **Godot 4 への移植計画の策定**:
   - Python CLIプロトタイプでのコアループ合意が取れたら、Godot 4 (GDScript) への移植に向けた設計（シーン構成、GDScriptの静的型アノテーション設計、UIレスポンシブコンテナ設計）に着手する。

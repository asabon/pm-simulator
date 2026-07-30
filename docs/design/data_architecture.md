# 🏗️ データモデル ＆ アーキテクチャ設計 (Data Architecture)

## 1. 概念設計
Python CLI プロトタイプ / Web Vanilla JS プロトタイプ / Godot 4 への移植性を見据え、エンジンロジックとデータモデルを分離したデータ駆動型設計 (Data-Driven Engine) を維持します。

---

## 2. コアエンティティ
* `Project`: 案件属性（要件明確さ・優先期待・納期・ステータス等）
* `Person` / `Developer`: メンバー属性（役割・スキル・疲労度・レゾリューション・年齢）
* `Task`: 開発タスク（概算工数・進捗・バグフラグ）
* `KickoffEngine`: キックオフ事前ネゴ・評価判定ロジック

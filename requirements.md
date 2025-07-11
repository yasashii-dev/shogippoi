# 将棋カードゲーム 要件定義書

## 1. ゲーム概要

### 1.1 ゲームタイトル
将棋っぽいカードゲーム（仮）

### 1.2 コンセプト
将棋の駒とルールを基盤としながら、カードによる駒の召喚システムを導入した新しい対戦ゲーム。
初期状態では王将のみで開始し、カードを使って駒を召喚しながら相手の王将を包囲することを目指す。

### 1.3 プラットフォーム
- Webブラウザ（デスクトップ/モバイル対応）

### 1.4 プレイ人数
- 2人対戦（PvP、PvAI）

## 2. ゲームルール

### 2.1 勝利条件
以下のいずれかの条件を満たした場合に勝利：
1. 相手の王将を取る
2. 相手の王将の初期位置（先手: 5九、後手: 5一）およびその周囲5マス（左、右、前、左前、右前）のうち、2マス以上に自分の駒を配置する

### 2.2 初期配置
- 各プレイヤーの王将を自陣の中央（先手: 5九、後手: 5一）に配置
- その他の駒は存在しない

### 2.3 ゲームの流れ

#### 2.3.1 ゲーム開始時
1. 各プレイヤーはデッキからランダムに3枚のカードを引く
2. 先手・後手を決定

#### 2.3.2 ターンの流れ
各ターンで以下のフェーズを実行：

1. **ドローフェーズ**
   - 自動的にデッキから1枚カードを引く

2. **アクションフェーズ**（以下から1つを選択）
   - 駒を移動する（通常の将棋のルールに従う）
   - カードを使用して駒を召喚する（1ターンに1枚まで）

3. **ターン終了**

### 2.4 駒の仕様

#### 2.4.1 使用可能な駒
- 王将（玉将）: 各プレイヤー1枚（初期配置）
- 飛車: 2枚
- 角行: 2枚
- 金将: 4枚
- 銀将: 4枚
- 桂馬: 4枚
- 香車: 4枚
- 歩兵: 18枚

#### 2.4.2 駒の動き
通常の将棋と同じルールを適用

#### 2.4.3 成りのルール
- 敵陣（相手側の3段）に入った時、または敵陣から出る時に成ることができる
- 成りは任意（強制ではない）

#### 2.4.4 特殊ルール
- 王将も他の駒と同様に取ることができる
- 取られた駒は除外される（持ち駒として再利用不可）
- 二歩などの禁じ手は通常の将棋と同様に適用

## 3. カードシステム

### 3.1 カードの種類
各カードは特定の駒を召喚する機能を持つ：
- 飛車カード: 2枚
- 角行カード: 2枚
- 金将カード: 4枚
- 銀将カード: 4枚
- 桂馬カード: 4枚
- 香車カード: 4枚
- 歩兵カード: 18枚

合計: 38枚/プレイヤー

### 3.2 カードの使用ルール
- 1ターンに使用できるカードは1枚まで
- カードの使用にコストは不要
- 召喚位置は自分の王将の周囲8マスのいずれか（空いているマスのみ）
- 使用済みカードは捨て札となる

### 3.3 デッキ管理
- 初期手札: 3枚
- 手札上限: なし
- デッキが0枚になった場合: カードドローは行われない

## 4. 技術仕様

### 4.1 対戦モード
1. **対人戦（ローカル）**
   - 同一画面での交互プレイ

2. **AI対戦**
   - 難易度設定（初級・中級・上級）
   - AI思考ルーチンの実装

### 4.2 画面構成
1. **メインメニュー**
   - ゲーム開始（対人戦/AI戦選択）
   - ルール説明
   - 設定

2. **ゲーム画面**
   - 将棋盤（9×9）
   - 手札表示エリア（両プレイヤー）
   - 現在のターン表示
   - 残りデッキ枚数表示
   - 取られた駒の表示エリア
   - 投了ボタン

3. **結果画面**
   - 勝敗表示
   - リプレイ/メニューに戻る

### 4.3 操作方法
- **駒の移動**: ドラッグ&ドロップまたはクリック選択
- **カードの使用**: カードを選択後、召喚位置をクリック
- **成り選択**: ダイアログで選択

## 5. 非機能要件

### 5.1 パフォーマンス
- ページ読み込み時間: 3秒以内
- 操作レスポンス: 即座に反応

### 5.2 対応ブラウザ
- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

### 5.3 対応デバイス
- デスクトップPC（画面解像度: 1024×768以上）
- タブレット（画面サイズ: 7インチ以上）
- スマートフォン（レスポンシブ対応）

## 6. 開発技術スタック（推奨）

### 6.1 フロントエンド
- HTML5/CSS3
- JavaScript/TypeScript
- フレームワーク: React/Vue.js/Vanilla JS

### 6.2 ゲームロジック
- 将棋エンジンライブラリの活用または独自実装
- 状態管理システム

### 6.3 AI実装
- ミニマックス法 + アルファベータ枝刈り
- 評価関数の設計

## 7. 今後の拡張可能性

1. **オンライン対戦機能**
2. **カードの種類追加**（特殊効果カードなど）
3. **トーナメントモード**
4. **戦績記録機能**
5. **カスタムルール設定**
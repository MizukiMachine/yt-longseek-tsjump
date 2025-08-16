# 重要機能の詳細設計

## 入力フォーム表示方法設計

### 1. 設計方針

時刻ジャンプ機能は、以下のようにしてYouTubeネイティブUIとの自然な統合を図る
- YouTube 既存のギア/字幕ボタン横に “Jump” ボタン 
- それを押すと、小さなドラッグ可能な半透明カードが出現 
- 半透明カードはドラッグ移動・ピン留め可

-> 目的はYouTube仕様変更への耐性を保ちつつ、ユーザーにとって直感的で使いやすいUI

### 2. UI構成

#### (A) Jumpボタン
- **配置位置**: `.ytp-right-controls` 内、設定ボタンの直前
- **スタイル**: YouTube標準の `.ytp-button` クラスを継承
- **動作**: クリックでドラッグ可能カードの表示・非表示を切り替え

#### (B) ドラッグ可能カード
- **配置**: `.html5-video-player` 内に絶対配置
- **初期位置**: Jumpボタンの上方・右寄り（コントロールバー沿い）
- **機能**: 時刻入力・ジャンプ実行・ピン留め・ドラッグ移動
- **字幕回避**: 初回スポーン時は下端90px以上の安全マージンを確保

### 3. ドラッグ・位置管理

#### 位置保存
- `localStorage` キー：`ytls-card-position`
- 保存データ：`{x: number, y: number, pinned: boolean, lastInteraction: number}`
- 範囲制限：プレイヤー境界内にクランプ

#### 自動フェードシステム
- **通常モード**：3秒無操作で半透明化→さらに3秒で非表示
- **ピン留めモード**：常時表示（自動フェードなし）
- **復帰条件**：マウス移動・キーボードショートカット・Jumpボタンクリック

### 4. DOM変更対策（3層防御）

#### 重要な設計判断
YouTubeDOMの仕様変更の対策について
- 最も安定性が高くメンテナンス負荷が少ない方法が必要
- `Improve YouTube` などの人気拡張機能の実装について調べた

##### Layer 1: YouTube SPA Event（最優先）
- **使用イベント**: `yt-navigate-finish`
- **理由**: YouTubeが公式に発火するSPAナビゲーション完了イベント
- **利点**: YouTube側が意図的に削除しない限り安定、SPA遷移を確実に捕捉

##### Layer 2: MutationObserver（補完）
- **監視対象**: `.ytp-right-controls` の追加・削除
- **デバウンス**: 200ms で過剰実行を防止
- **利点**: W3C標準API、YouTubeの仕様変更に影響されない

##### Layer 3: フォールバックポーリング（保険）
- **チェック間隔**: 5秒
- **確認内容**: Jumpボタンの存在確認
- **利点**: 上記2つが失敗してもカバー

#### 実装上の注意点
- `.ytp-right-controls` は数年間変更されていない安定セレクタ
- YouTube内部の実装詳細には依存しない
- 人気YouTube拡張機能（数百万ユーザー）での実績あり

### 5. フルスクリーン・画面変更対応

#### 自動調整
- **監視イベント**: `fullscreenchange`・`resize`
- **調整処理**: カード位置がプレイヤー境界外の場合、境界内にクランプ
- **字幕エリア**: フルスクリーン時も下端90pxマージンを維持

### 6. アクセシビリティ対応

#### ARIA属性
- カード: `role="dialog"`・`aria-label="Time Jump Input"`・`aria-modal="false"`
- 入力欄: `aria-describedby` で説明文と関連付け

#### キーボード操作
- `Alt+Shift+J`: カード表示・非表示、入力フィールドフォーカス
- `Enter`: 時刻ジャンプ実行
- `Esc`: カードを閉じて動画にフォーカス復帰
- `Tab`: カード内要素間の移動

### 7. セキュリティ・パフォーマンス

#### メモリ効率化
- WeakMap使用による循環参照回避
- Event Listenerの適切なクリーンアップ
- DOM要素キャッシュの活用

#### レンダリング最適化
- CSS Transformによる位置調整（reflow回避）
- `will-change`プロパティの適用
- IntersectionObserverによる可視性判定

## 時刻ジャンプ計算設計

### 1. 根本問題の認識
YouTubeライブ配信の時刻ジャンプで発生していた3つの問題：
1. **60分の系統的ズレ**: 約1時間の固定オフセット
2. **1-2分の微細ズレ**: 58-59分への不正確なジャンプ  
3. **累積ドリフト**: ジャンプ毎に10秒ずつズレが蓄積

**根本原因**: 動画の再生時間軸（`video.currentTime`）と現実世界の時刻（タイムゾーン）を直接演算していたこと

### 2. 正しい設計思想
**線形変換によるキャリブレーション方式**を採用：

```
wall_clock_seconds ≈ media_time_seconds + C
```

- `C`: 固定オフセット定数（キャリブレーションで測定）
- `L`: ライブ配信レイテンシ（10-30秒）

### 3. 実装ステップ

#### Step 1: キャリブレーション（初回のみ）
```javascript
// 6秒間、200ms間隔でサンプリング
C = median((now_epoch - L) - seekable.end(0))
```

#### Step 2: UTC統一計算
```javascript
// オランダ時刻を絶対時刻（epoch秒）に変換
target_epoch = convertNLTimeToEpoch(targetTime, 'Europe/Amsterdam')

// 未来の場合は前日に調整
if (target_epoch > now_epoch) target_epoch -= 86400
```

#### Step 3: メディア時間変換
```javascript
target_media = target_epoch - C
```

#### Step 4: DVR範囲クランプ + シーク
```javascript
target_media = Math.min(Math.max(target_media, seekable.start(0)), seekable.end(0) - 1)
video.currentTime = target_media
```

#### Step 5: 微補正（1回のみ）
```javascript
// シーク完了後の誤差測定
error = target_epoch - (video.currentTime + C)
if (Math.abs(error) > 1.5) {
  video.currentTime += error  // 追加補正
}
```

### 4. ドリフト対策
- **定数Cは固定使用**: 毎回再計算しない
- **再キャリブレーション条件**: 
  - ライブ端近く（`end - currentTime < 5s`）
  - 5-10分間隔の定期実行
  - 中央値/移動平均による安定化

### 5. タイムゾーン処理
- **DST対応**: `Intl.DateTimeFormat`で正確なオフセット取得
- **ISO文字列生成**: `YYYY-MM-DDTHH:mm:ss+02:00`形式
- **絶対時刻変換**: `Date.parse()`でepoch秒に統一

### 6. エラー処理
- DVR範囲外ジャンプの制限
- `seekable`範囲が無効な場合の処理
- レイテンシ取得失敗時のフォールバック（L=0）

この設計により、従来の3つの問題すべてが解決される。

## 開発・メンテナンス方針

### 1. YouTubeアップデート耐性
- YouTube内部関数への依存を排除
- 汎用的なセレクタ（`.ytp-right-controls`等）のみ使用
- 3層防御による冗長性確保

### 2. デバッグ・監視
- 各Layer の動作状況をコンソールログで確認可能
- 問題切り分けが容易な設計
- フォールバック動作時の自動復旧


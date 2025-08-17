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

### 1. 基本設計思想

**時刻ジャンプの本質**：
YouTubeDVR配信において、ユーザーが指定したタイムゾーン時刻に対応する動画位置へのジャンプを実現する。

### 2. 核心となる計算ロジック ⚠️ **重要：この計算式を絶対に間違えない**

#### **正しい計算フロー**
```typescript
// Step 1: 現在時刻と目標時刻の差を計算
const nowEpoch = Date.now() / 1000
const targetEpoch = parseTimezoneEpoch(userInput, now, timezone)
const timeDelta = nowEpoch - targetEpoch

// Step 2: DVR最新位置から時間差分だけ巻き戻す
const targetMediaTime = video.seekable.end(0) - timeDelta

// Step 3: DVR範囲内にクランプしてシーク
video.currentTime = Math.max(video.seekable.start(0), targetMediaTime)
```

#### **計算の意味**
- `timeDelta`: 現在時刻から目標時刻までの時間差（秒）
- `video.seekable.end(0)`: DVR配信の最新位置（ライブエッジ）
- `targetMediaTime`: 動画タイムライン上の目標位置

#### **具体例**
```
現在時刻: 2025-08-17 11:05 Amsterdam (epoch: 1755421538)
目標時刻: 2025-08-17 00:00 Amsterdam (epoch: 1755381600)
時間差: 1755421538 - 1755381600 = 39938秒 ≈ 11.1時間

DVR最新位置: 50000秒（動画開始から約13.9時間）
目標位置: 50000 - 39938 = 10062秒（動画開始から約2.8時間）
→ 11時間前の動画位置にジャンプ
```

### 3. 実装コンポーネント

#### **タイムゾーン変換**
```typescript
export function parseTimezoneEpoch(
  timeString: string, 
  baseDate: Date, 
  timezone: string
): number
```
- ユーザー入力時刻を指定タイムゾーンでのepoch秒に変換
- DST（夏時間）を自動考慮
- 今日/昨日の適切な日付選択

#### **DVR範囲管理**
```typescript
async function pickEpochWithinDVR(
  timeString: string, 
  video: HTMLVideoElement, 
  timezone: string
): Promise<{ok: boolean, targetEpoch?: number}>
```
- 目標時刻がDVR範囲内か判定
- 範囲外の場合は適切なフォールバック処理

#### **メイン関数**
```typescript
export async function jumpToTimezoneTime(
  video: HTMLVideoElement,
  targetTime: string,
  timezone: string
): Promise<TimeJumpResult>
```

### 4. エラーハンドリング戦略

#### **00:00特別仕様（距離ベース丸め処理）** ⚠️ **重要な境界時刻処理**

**00:00は特別な時刻**として、DVR範囲外の場合は最も近い境界にジャンプ：

```typescript
function handle00TimeJump(
  video: HTMLVideoElement, 
  targetEpoch: number
): number {
  const dvrStart = video.seekable.start(0)
  const dvrEnd = video.seekable.end(0)
  const nowEpoch = Date.now() / 1000
  
  // DVR範囲をepoch時刻に変換（直接計算方式）
  const dvrDuration = dvrEnd - dvrStart
  const dvrStartEpoch = nowEpoch - dvrDuration
  const dvrEndEpoch = nowEpoch
  
  if (targetEpoch >= dvrStartEpoch && targetEpoch <= dvrEndEpoch) {
    // Case 1: 範囲内 - 正確にジャンプ
    const timeDelta = nowEpoch - targetEpoch
    return dvrEnd - timeDelta
  } else {
    // Case 2: 範囲外 - 距離による丸め処理
    const distToStart = Math.abs(targetEpoch - dvrStartEpoch)
    const distToEnd = Math.abs(targetEpoch - dvrEndEpoch)
    
    if (distToStart < distToEnd) {
      return dvrStart  // 一番過去にジャンプ
    } else {
      return dvrEnd    // 一番未来（現在）にジャンプ
    }
  }
}
```

**処理パターン**:
- **理想**: DVR範囲内に00:00が存在 → 正確な位置にジャンプ
- **過去寄り**: 00:00がDVR開始より過去で近い → DVR開始位置にジャンプ  
- **未来寄り**: 00:00がDVR終端より未来で近い → DVR終端（現在）にジャンプ

#### **一般的な範囲外時刻の処理**
- **範囲内**: 正確な時刻ジャンプ実行
- **範囲外（過去）**: DVR開始位置にジャンプ
- **範囲外（未来）**: 現在のライブエッジにジャンプ
- **無効入力**: エラーメッセージ表示

#### **境界ケース**
- DVR無効動画での適切なエラー
- タイムゾーン変換エラーのハンドリング
- ネットワーク遅延による不安定性の吸収

### 5. テスト設計方針

#### **単体テスト**
- `parseTimezoneEpoch`: 各タイムゾーンでの正確性
- `pickEpochWithinDVR`: 範囲判定ロジック
- 計算フローの数値的正確性

#### **統合テスト**
- 完全な時刻ジャンプフローの検証
- エラーケースの包括的テスト
- 異なるDVR状況での動作確認

### 6. パフォーマンス特性

- **時刻変換**: <10ms（同期処理）
- **DVR範囲チェック**: <5ms
- **シーク実行**: ブラウザ依存（通常100-500ms）
- **メモリ使用量**: 最小限（一時変数のみ）

### 7. デバッグ指針

計算ロジックに問題がある場合、以下を確認：
1. `timeDelta`の符号と値（現在-目標の差）
2. `video.seekable.end(0)`の妥当性
3. DVR範囲内の目標時刻の存在確認
4. タイムゾーン変換の正確性

**❌ 絶対に避けるべき間違った計算**：
```typescript
// これは意味不明な計算 - 絶対に使用禁止
targetMediaTime = targetEpoch - calibratedOffset
```

## 開発・メンテナンス方針

### 1. YouTubeアップデート耐性
- YouTube内部関数への依存を排除
- 汎用的なセレクタ（`.ytp-right-controls`等）のみ使用
- 3層防御による冗長性確保

### 2. デバッグ・監視
- 各Layer の動作状況をコンソールログで確認可能
- 問題切り分けが容易な設計
- フォールバック動作時の自動復旧


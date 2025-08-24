## Daily Routine PWA (24 時間円グラフ予定表)

モバイル向け 24 時間円グラフ型の一日予定管理アプリ。平日/休日をタブで切替し、予定セットを丸ごとテンプレートとして保存/適用できます。オフライン対応 (PWA)。

### 主な仕様

- 24h 円: 0 時=上 (北), 12 時=下
- 15 分粒度 / 重複不可
- 予定属性: タイトル(最大 8 文字), 開始, 終了, グレースケール(10 段階)
- 平日/休日 切替 (曜日自動判定なし)
- 一日分テンプレート保存 & 適用 (localStorage)
- オフライン & インストール (manifest + service worker)

### セットアップ

```
npm install
npm run dev
```

ブラウザで表示される円をタップするとその位置の時間で 15 分予定追加モーダルが開きます。

### ビルド

```
npm run build
npm run preview
```

### PWA

- `public/manifest.webmanifest`
- `public/sw.js` (静的アセット precache + ランタイム Stale-While-Revalidate)
  ホーム画面追加やオフライン起動が可能です。

### データ保存

localStorage キー:

- `weekdaySchedule`
- `weekendSchedule`
- `scheduleTemplates`

### 今後の拡張候補

- 弧ドラッグによる時間調整
- テンプレート削除/リネーム機能
- エクスポート / インポート
- カラー補助 (色覚対応グレーパターン)

### ライセンス

未設定 (内部利用想定)。

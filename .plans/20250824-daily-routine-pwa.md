# Daily Routine PWA Plan (2025-08-24)

## 要件確定

1. 24 時間円グラフ（0 時=上, 12 時=下）
2. 平日 / 休日 2 つの独立スケジュール（今日が何曜日かの自動判定不要）
3. クリック/タップで予定編集（追加/変更/削除）
4. 予定属性: タイトル / 開始-終了 (15 分単位) / グレースケール 10 段階 (1〜10 または 0〜9)
5. 同時刻重複不可（重なりはバリデーションしエラー表示）
6. スケジュールテンプレート: "一日分丸ごと" を保存・適用（平日にも休日にも適用可能）
7. テンプレート & スケジュール保存先: localStorage（バージョン番号不要）
8. 初期: 保存なし → 空円グラフ表示。保存あり → ロードして表示
9. モバイル専用 UI（スマホ前提, 片手操作考慮）
10. 編集 UI: モーダル (タイトル入力 + 開始/終了時刻 + 色濃度スライダー)
11. 時間ラベルは毎正時 (0..23) を円周に配置
12. 削除: 編集モーダル内ボタン
13. UI 言語: 日本語固定
14. Tailwind CSS 導入
15. 円描画は SVG (D3 不使用: D3 はデータビジュアライゼーション向けの JS ライブラリ。今回は軽量要件のため自前実装)
16. 最小予定長: 15 分（粒度単位）
17. PWA: Static asset precache + runtime cache (SW: Stale-While-Revalidate)。これで要件十分。
18. localStorage キー: weekdaySchedule, weekendSchedule, scheduleTemplates

## データモデル

```ts
// 15分粒度: total slots = 96 (index 0..95)
export interface ScheduleEntry {
  id: string; // uuid
  title: string; // 予定名
  start: number; // 分 (0-1439), 15分単位
  end: number; // 分 (start<end), 15分単位
  shade: number; // 1..10 (10段階)
}
export interface DaySchedule {
  entries: ScheduleEntry[]; // 重複不可 & ソート済 (start昇順)
}
export interface DayTemplate {
  // 一日分
  id: string;
  name: string;
  entries: ScheduleEntry[]; // テンプレート保存時に複製
}
```

## localStorage Keys

- weekdaySchedule
- weekendSchedule
- scheduleTemplates

## バリデーション

- start % 15 === 0 & end % 15 === 0
- 0 <= start < end <= 1440
- (end-start) >= 15
- 重複: 任意 2 エントリで時間帯交差禁止
- shade: 1..10
- title: 非空 (最短 1, 最大 32 文字程度)

## 角度計算

- 分 → 角度: deg = (minutes / 1440) \* 360
- 0 分= -90 度方向 (SVG 座標で上)。円弧計算時はラジアン変換。
- 弧 path: 大弧判定 (sweepFlag) 使用。

## UI コンポーネント構成（案）

- App
  - TabSwitcher (平日/休日)
  - SchedulePie (props: entries, onSelectSegment, onAddAtMinute)
  - TemplateBar / ボタン（テンプレ適用 & 保存）
  - EditModal (制御)
  - Toast (バリデーションエラー)

## 主要ロジック

- useSchedulesReducer: state = { mode: 'weekday'|'weekend', weekday: DaySchedule, weekend: DaySchedule, templates: DayTemplate[] }
- actions: addEntry, updateEntry, deleteEntry, applyTemplate, saveTemplate
- persistence: useEffect で state 変更 → debounced save (300ms)

## Tailwind 導入手順

- `npm install -D tailwindcss postcss autoprefixer`
- `tailwind.config.js` 生成 & content 指定
- `postcss.config.js` 追加
- `index.css` に `@tailwind base; @tailwind components; @tailwind utilities;`

## PWA

- manifest.webmanifest (name, short_name, icons, start_url, display=standalone, theme_color)
- service-worker.ts: precache (build 出力の index.html, assets chunk), runtime cache (fetch handler: stale-while-revalidate for GET requests to same-origin)
- registration: `if ('serviceWorker' in navigator)` in `main.tsx`
- Icons: 192x192 / 512x512 placeholder SVG→PNG 生成 (開発中は簡易)

## 操作フロー

1. 初期ロード: localStorage → state。無ければ空。
2. ユーザーが円空白タップ: 角度 → 開始 slot→ 新規予定(1h 案 or 15 分?) 初期長: 1h (=4 slots) ただし 23:30 超える場合は末尾調整
3. 既存弧タップ: その予定を編集モーダルで開く
4. ハンドルドラッグ: start/end 再計算 & バリデーション（重なり回避 → スナップ）
5. 保存時: state 更新 →localStorage
6. テンプレ保存: 現在表示 schedule を名前付け保存
7. テンプレ適用: 確認ダイアログ後、現在 schedule をテンプレ entries に置換

## 最終決定（ユーザー回答反映）

1. 新規予定初期長さ: 15 分
2. タイトル最大文字数: 8 文字
3. グレースケール選択 UI: 10 個の丸ボタン
4. 円グラフサイズ: モバイル幅いっぱい（最大幅制限せず 100%）
5. MVP: ドラッグ調整は後回し（モーダル編集のみ）

これより実装フェーズへ移行可能。

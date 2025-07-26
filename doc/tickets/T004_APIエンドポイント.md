# T004: APIエンドポイント

## 概要
フロントエンドからのPOSTリクエストを受け取り、Webhookに転送するAPIを作成

## 作業内容
- [ ] `/app/api/send-items/route.ts` 作成
- [ ] POSTメソッド実装
- [ ] パスワード検証機能
- [ ] Webhook転送機能
- [ ] エラーハンドリング
- [ ] JSONレスポンス返却

## API仕様
- **エンドポイント**: `/api/send-items`
- **メソッド**: POST
- **リクエスト**: `{password: string, items: string[]}`
- **レスポンス**: `{status: "success"}` or エラー

## Webhook転送先
`https://n8n.smallpiece.jp/webhook-test/22c982ed-e621-45a3-b388-9cec1ff9b5ee`

## 成果物
- app/api/send-items/route.ts

## 依存関係
- T001: 環境構築

## フェーズ
フェーズ1: MVP
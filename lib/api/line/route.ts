import { headers } from 'next/headers';
import * as crypto from 'crypto';

// LINE Bot APIの認証情報
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;


// LINE Webhookの署名を検証する関数
function verifyLineSignature(body: string, signature: string): boolean {
  if (!CHANNEL_SECRET) {
    console.error('LINE Bot APIの認証情報が設定されていません。');
    return false;
  }

  const hash = crypto
    .createHmac('SHA256', CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  
  return hash === signature;
}

// LINEイベントの型定義
export type LineMessageEvent = {
  type: 'message';
  message: {
    type: string;
    text: string;
  };
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
};

export type LineFollowEvent = {
  type: 'follow';
  replyToken: string;
  source: {
    userId: string;
    type: string;
  };
};

export type LineEvent = LineMessageEvent | LineFollowEvent;

export type LineWebhookBody = {
  events: LineEvent[];
};

// メッセージの型定義
type LineMessage = {
  type: string;
  text?: string;
  quickReply?: {
    items: {
      type: string;
      action: {
        type: string;
        label: string;
        text?: string;
        uri?: string;
      }
    }[]
  };
  altText?: string;
  template?: {
    type: string;
    text: string;
    actions: {
      type: string;
      label: string;
      uri?: string;
      text?: string;
    }[]
  };
};

/**
 * LINEメッセージ返信用の関数
 * @param replyToken - LINEから提供される返信用トークン
 * @param messages - 送信するメッセージの配列
 */
async function replyMessage(replyToken: string, messages: LineMessage[]) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken: replyToken,
      messages: messages,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`LINE API Error: ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

/**
 * POSTリクエストを処理するメインハンドラー
 */
export async function POST(request: Request) {
  try {
    // ヘッダーからLINEの署名を取得
    const headersList = await headers();
    const signature = headersList.get('x-line-signature') ?? null;

    if (!signature) {
      // 署名がない場合でも200を返す（LINEの仕様）
      return new Response('OK', { status: 200 });
    }

    // リクエストボディを取得
    const rawBody = await request.text();
    
    // 署名の検証（セキュリティ対策）
    if (!verifyLineSignature(rawBody, signature)) {
      // 署名が無効な場合でも200を返す（LINEの仕様）
      return new Response('OK', { status: 200 });
    }

    // リクエストボディをパース
    const body: LineWebhookBody = JSON.parse(rawBody);
    
    // Webhookイベントを処理
    for (const event of body.events) {
      try {
        // メッセージイベントの場合
        if (event.type === 'message') {
          const messageEvent = event as LineMessageEvent;
          
          // テキストメッセージの場合
          if (messageEvent.message.type === 'text') {
            const text = messageEvent.message.text;
            
            // 特定のテキストに対する応答を設定
            switch (text) {
              case 'ご飯を注文する':
                await replyMessage(messageEvent.replyToken, [{
                  type: 'text',
                  text: '注文を受け付けました。\n以下から希望の日時を選択してください。'
                }]);
                break;
              
              case 'メニューをリクエストする':
                await replyMessage(messageEvent.replyToken, [{
                  type: 'text',
                  text: 'どのようなメニューをご希望ですか？\nご要望をお聞かせください。'
                }]);
                break;
              
              case '予約をキャンセルする':
                await replyMessage(messageEvent.replyToken, [{
                  type: 'text',
                  text: 'キャンセルの理由をお聞かせいただけますか？'
                }]);
                break;
              
              case '使い方':
                await replyMessage(messageEvent.replyToken, [{
                  type: 'text',
                  text: '詳しい使い方はこちらをご覧ください：\nhttps://example.com/shuuchan-shokudo/guide'
                }, {
                  type: 'template',
                  altText: '使い方ページへ',
                  template: {
                    type: 'buttons',
                    text: 'ご利用ガイド',
                    actions: [
                      {
                        type: 'uri',
                        label: '使い方ページを開く',
                        uri: 'https://example.com/shuuchan-shokudo/guide'
                      }
                    ]
                  }
                }]);
                break;
                
              default:
                // デフォルトの応答（認識できないメッセージの場合）
                await replyMessage(messageEvent.replyToken, [{
                  type: 'text',
                  text: '個別メッセージを受付ました。柊人ママに送信されます。',
                  quickReply: {
                    items: [
                      {
                        type: "action",
                        action: {
                          type: "message",
                          label: "使い方",
                          text: "使い方"
                        }
                      }
                    ]
                  }
                }]);
                break;
            }
          }
        }
      } catch (eventError) {
        console.error('Event processing error:', eventError);
        // イベント処理エラーが発生しても次のイベント処理を継続
        continue;
      }
    }

    // 常に200 OKを返す（LINEの仕様）
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    // エラーが発生しても200を返す（LINEの仕様）
    return new Response('OK', { status: 200 });
  }
}
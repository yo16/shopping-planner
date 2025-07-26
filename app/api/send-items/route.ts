import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('API called - POST /api/send-items');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { password, items } = body;
    console.log('Password provided:', !!password);
    console.log('Items:', items);
    console.log('Environment password:', !!process.env.APP_PASSWORD);

    if (!password || !items) {
      console.log('Missing password or items');
      return NextResponse.json(
        { error: 'Password and items are required' },
        { status: 400 }
      );
    }

    if (password !== process.env.APP_PASSWORD) {
      console.log('Password mismatch');
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    if (!Array.isArray(items)) {
      console.log('Items is not an array');
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 }
      );
    }

    const webhookUrl = 'https://n8n.smallpiece.jp/webhook/22c982ed-e621-45a3-b388-9cec1ff9b5ee';
    console.log('Sending to webhook:', webhookUrl);
    console.log('送信するアイテム:', items);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
        // タイムアウトを設定
        signal: AbortSignal.timeout(10000) // 10秒
      });

      console.log('Webhook response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Webhook error response:', errorText);
        // Webhookエラーでも成功として処理（ログに記録）
        console.warn('Webhook failed but continuing:', response.status, errorText);
      } else {
        console.log('Webhook success');
      }
    } catch (webhookError) {
      // Webhookエラーをログに記録するが、API自体は成功として処理
      console.warn('Webhook request failed:', webhookError);
    }

    console.log('Success - returning status');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
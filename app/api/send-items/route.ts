import { NextRequest, NextResponse } from 'next/server';
import { SendItemsRequest, SendItemsResponse, ApiErrorResponse, RateLimitInfo, WebhookPayload } from '@/types';
import { envConfig } from '@/lib/env';

// Rate limiting: IPごとの最後のリクエスト時間を記録
const requestTimestamps = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1分
const MAX_REQUESTS_PER_WINDOW = 5; // 1分間に5回まで

function getRateLimitInfo(ip: string): RateLimitInfo {
  const now = Date.now();
  const timestamps = requestTimestamps.get(ip) || [];
  
  // 1分以内のリクエストのみを保持
  const recentTimestamps = Array.isArray(timestamps) 
    ? timestamps.filter((timestamp: number) => now - timestamp < RATE_LIMIT_WINDOW)
    : [];
  
  return {
    count: recentTimestamps.length,
    timestamps: recentTimestamps
  };
}

function updateRateLimit(ip: string) {
  const now = Date.now();
  const { timestamps } = getRateLimitInfo(ip);
  
  timestamps.push(now);
  requestTimestamps.set(ip, timestamps as any);
}

export async function POST(request: NextRequest): Promise<NextResponse<SendItemsResponse | ApiErrorResponse>> {
  console.log('API called - POST /api/send-items');
  
  // Rate limiting check
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { count } = getRateLimitInfo(ip);
  
  if (count >= MAX_REQUESTS_PER_WINDOW) {
    console.log(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' } as ApiErrorResponse,
      { status: 429 }
    );
  }
  
  updateRateLimit(ip);
  
  try {
    const body: SendItemsRequest = await request.json();
    console.log('Request body:', body);
    
    const { password, items } = body;
    console.log('Password provided:', !!password);
    console.log('Items:', items);
    console.log('Environment password:', !!process.env.APP_PASSWORD);

    if (!password || !items) {
      console.log('Missing password or items');
      return NextResponse.json(
        { error: 'Password and items are required' } as ApiErrorResponse,
        { status: 400 }
      );
    }

    if (password !== envConfig.APP_PASSWORD) {
      console.log('Password mismatch');
      return NextResponse.json(
        { error: 'Invalid password' } as ApiErrorResponse,
        { status: 401 }
      );
    }

    if (!Array.isArray(items)) {
      console.log('Items is not an array');
      return NextResponse.json(
        { error: 'Items must be an array' } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // XSS対策: アイテムの内容をサニタイズ
    const sanitizedItems = items.map(item => {
      if (typeof item !== 'string') {
        return '';
      }
      // HTMLタグを除去し、基本的な文字列のみ許可
      return item.replace(/[<>&"']/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[char] || char;
      }).trim().slice(0, 100); // 最大100文字に制限
    }).filter(item => item.length > 0);

    const webhookUrl = envConfig.WEBHOOK_URL;
    console.log('Sending to webhook:', webhookUrl);
    console.log('送信するアイテム:', items);
    
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: sanitizedItems } as WebhookPayload),
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
    return NextResponse.json({ status: 'success' } as SendItemsResponse);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
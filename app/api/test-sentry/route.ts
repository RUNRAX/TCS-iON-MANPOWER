import * as Sentry from '@sentry/nextjs';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        throw new Error('Sentry test error — delete this route after confirming');
    } catch (err) {
        Sentry.captureException(err);
        return NextResponse.json({ triggered: true }, { status: 500 });
    }
}
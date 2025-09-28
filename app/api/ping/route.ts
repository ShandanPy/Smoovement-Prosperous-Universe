import { NextResponse } from 'next/server';
import { fioClient } from '@/lib/fioClient';
import { isApiError } from '@/lib/errors';

export const runtime = 'edge'; // Edge-compatible

/**
 * GET /api/ping
 * Health check endpoint that verifies FIO API connectivity
 */
export async function GET() {
  try {
    const fioStatus = await fioClient.getStatus();

    if (fioStatus.ok) {
      return NextResponse.json(
        {
          ok: true,
          fio: {
            status: fioStatus.status,
            meta: fioStatus.meta,
          },
        },
        { status: 200 }
      );
    }

    // FIO returned an error status
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: 'FIO API returned an error',
          code: 'FIO_ERROR',
          details: fioStatus.meta,
        },
      },
      { status: fioStatus.status }
    );
  } catch (error) {
    // Handle unexpected errors
    const status = isApiError(error) ? error.status : 500;
    const code = isApiError(error) ? error.code : 'INTERNAL_ERROR';
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';

    return NextResponse.json(
      {
        ok: false,
        error: {
          message,
          code,
        },
      },
      { status }
    );
  }
}

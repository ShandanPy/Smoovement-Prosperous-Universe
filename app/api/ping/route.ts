import { NextResponse } from 'next/server';
import { fioClient } from '@/lib/fioClient';
import { ApiError } from '@/lib/errors';

export const runtime = 'edge'; // Make this edge-compatible

/**
 * GET /api/ping
 * Health check endpoint that verifies FIO API connectivity
 */
export async function GET() {
  try {
    const fioStatus = await fioClient.getStatus();

    if (fioStatus.ok) {
      return NextResponse.json({
        ok: true,
        fio: {
          status: fioStatus.status,
          meta: fioStatus.meta,
        },
      });
    } else {
      // FIO is not reachable but we got a response
      return NextResponse.json(
        {
          ok: false,
          error: {
            message: 'FIO API is not healthy',
            code: 'FIO_UNHEALTHY',
          },
        },
        { status: 503 }
      );
    }
  } catch (error) {
    // Handle errors
    if (error instanceof ApiError) {
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    // Unknown error
    return NextResponse.json(
      {
        ok: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'UNKNOWN_ERROR',
        },
      },
      { status: 500 }
    );
  }
}

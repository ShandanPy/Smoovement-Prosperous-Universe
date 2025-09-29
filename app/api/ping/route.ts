import { NextRequest, NextResponse } from 'next/server';
import { fioClient } from '@/lib/fioClient';
import { ApiError } from '@/lib/errors';

/**
 * Response types for the ping endpoint
 */
interface PingSuccessResponse {
  ok: true;
  fio: {
    status: number;
    meta?: unknown;
  };
}

interface PingErrorResponse {
  ok: false;
  error: {
    message: string;
    code?: string;
  };
}

type PingResponse = PingSuccessResponse | PingErrorResponse;

/**
 * GET /api/ping
 *
 * Verifies connectivity to the FIO service and returns status information.
 * This endpoint is edge-compatible and designed to work in Vercel preview environments.
 */
export async function GET(_request: NextRequest): Promise<NextResponse<PingResponse>> {
  try {
    // Call FIO service to get status
    const fioStatus = await fioClient.getStatus();

    // Return success response
    const response: PingSuccessResponse = {
      ok: true,
      fio: {
        status: fioStatus.status,
        meta: fioStatus.meta,
      },
    };

    // Use appropriate HTTP status code based on FIO status
    const httpStatus = fioStatus.ok ? 200 : 502;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.error('Ping endpoint error:', error);

    // Handle ApiError specifically
    if (error instanceof ApiError) {
      const response: PingErrorResponse = {
        ok: false,
        error: {
          message: error.message,
          code: error.code,
        },
      };

      // Use the error's status code if available, otherwise 500
      const httpStatus = error.status || 500;
      return NextResponse.json(response, { status: httpStatus });
    }

    // Handle generic errors
    const response: PingErrorResponse = {
      ok: false,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };

    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Handle unsupported methods
 */
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

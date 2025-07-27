import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, variables, subgraphUrl, apiKeyEnvVar } = body;

    if (!query || !subgraphUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: query and subgraphUrl.' },
        { status: 400 }
      );
    }

    // Get API key from environment variable
    const apiKey = process.env[apiKeyEnvVar];

    if (!apiKey) {
      return NextResponse.json(
        {
          error: `API key not found for environment variable: ${apiKeyEnvVar}`,
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Make the GraphQL request
    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: variables || {},
      }),
    });

    const data = await response.json();
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      data: data.data,
      error: data.errors ? data.errors[0]?.message : null,
      executionTime,
    });
  } catch (error) {
    console.error('GraphQL API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

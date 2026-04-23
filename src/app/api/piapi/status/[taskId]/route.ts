import { NextResponse } from 'next/server';

export async function GET(request: Request, context: any) {
  // Extract taskId gracefully, supporting Next.js latest app router context structure
  let taskId = "";
  try {
     const params = await context.params;
     taskId = params.taskId;
  } catch (e) {
     taskId = context.params?.taskId || "";
  }

  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  const headerKey = request.headers.get("x-piapi-key");
  const apiKey = headerKey || process.env.PIAPI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing PIAPI_API_KEY in server environment or header" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey
      }
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Internal Status Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

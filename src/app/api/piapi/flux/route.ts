import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, width = 1024, height = 1024 } = body;

    const headerKey = request.headers.get("x-piapi-key");
    const apiKey = headerKey || process.env.PIAPI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing PIAPI_API_KEY in server environment or header" }, { status: 500 });
    }

    const payload = {
      model: "Qubico/flux1-schnell", // Fast flux model
      task_type: "txt2img",
      input: {
        prompt: prompt,
        width: width,
        height: height
      }
    };

    const response = await fetch("https://api.piapi.ai/api/v1/task", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.code !== 200) {
      console.error("PiAPI Flux Error:", data);
      return NextResponse.json({ error: data.message || "Failed to create task" }, { status: 500 });
    }

    return NextResponse.json({ taskId: data.data.task_id });
  } catch (error) {
    console.error("Internal API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

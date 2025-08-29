import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body?.messages;
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    // Get last user message for a simple echo fallback
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user") || messages[messages.length - 1];
    const text = lastUser?.content || "Hello from Stitchbyte";

    // If no Gemini key/endpoint configured, return a safe echo reply so the UI can be tested locally.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const GEMINI_ENDPOINT = process.env.GEMINI_ENDPOINT; // optional custom endpoint
    if (!GEMINI_API_KEY || !GEMINI_ENDPOINT) {
      return NextResponse.json({ reply: `Echo: ${text}` });
    }

    // Proxy request to the configured Gemini endpoint. This code expects the endpoint to accept
    // a JSON body similar to { messages } and return { reply } — adjust as needed for your provider.
    const resp = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({ messages })
    });

    if (!resp.ok) {
      const textErr = await resp.text();
      return NextResponse.json({ reply: `Remote error: ${textErr}` }, { status: 502 });
    }

    const data = await resp.json();
    const reply = data?.reply || data?.outputText || JSON.stringify(data);
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ reply: "Sorry, something went wrong." }, { status: 500 });
  }
}

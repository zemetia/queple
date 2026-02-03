import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

export async function POST(req: Request) {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { userPrompt, systemPrompt } = body;

    // Construct the payload for Gemini API
    const payload: any = {
      contents: [{ parts: [{ text: userPrompt }] }],
    };

    if (systemPrompt) {
      payload.systemInstruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      return NextResponse.json(
        { error: `Gemini API Error: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      ?.replace(/"/g, "")
      .trim();

    if (!text) {
      return NextResponse.json(
        { error: "Empty response from AI" },
        { status: 500 },
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Generate API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

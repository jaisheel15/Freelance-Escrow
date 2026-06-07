// ─────────────────────────────────────────────
// Unified LLM Provider Interface
// ─────────────────────────────────────────────
import {Groq} from 'groq-sdk'


export async function askLLM(prompt: string, systemInstruction: string, jsonMode = false): Promise<string> {
  const nvidiaKey = process.env.NVIDIA_API_KEY || process.env.NEXT_PUBLIC_NVIDIA_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;


  if(groqKey) {
    try {
      const groq = new Groq()
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        response_format: jsonMode ? { type: 'json_object' } : undefined,
        temperature: 0.1,
        max_tokens: 2048,
      })
      const text = res.choices?.[0]?.message?.content;
      if (text) return text;
    } catch { /* fallback */ }
  }
  
  // 1. Try NVIDIA NIM (Priority 1)
  if (nvidiaKey) {
    try {
      const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature: 0.1,
          max_tokens: 2048,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch { /* fallback */ }
  }

  // 2. Try Gemini (Priority 2)
  if (geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            responseMimeType: jsonMode ? 'application/json' : 'text/plain',
            temperature: 0.1,
          },
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch { /* fallback */ }
  }

  // 3. Try OpenRouter (Priority 3)
  if (openRouterKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-flash-1.5',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: prompt }
          ],
          response_format: jsonMode ? { type: 'json_object' } : undefined,
          temperature: 0.1,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch { /* fallback */ }
  }

  throw new Error('All configured LLM providers failed or no keys were provided.');
}

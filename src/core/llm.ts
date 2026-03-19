export async function streamLLM(url: string, prompt: string): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      prompt,
      stream: true,
      n_predict: 256,
      temperature: 0.2
    })
  });

  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let full = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    full += chunk;
    buffer += chunk;

    // EARLY TOOL DETECTION
    // In a real llama.cpp response, the text might be wrapped in JSON like {"content": "..."}
    // For this implementation, we search for the tool call pattern in the raw stream.
    // We return once we have a potentially complete JSON object that starts with {"tool"
    if (buffer.includes('{"tool"')) {
      const start = buffer.indexOf('{"tool"');
      const possibleJson = buffer.slice(start);
      try {
        JSON.parse(possibleJson);
        return buffer; // Found a complete, valid tool call!
      } catch {
        // Not yet complete, keep reading
      }
    }
  }

  return full;
}

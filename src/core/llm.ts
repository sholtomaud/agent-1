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
    if (done) {
      break;
    }

    const chunk = decoder.decode(value);
    full += chunk;
    buffer += chunk;

    // EARLY TOOL DETECTION
    // If we detect a tool call, we must ensure we read until the end of the JSON object
    if (buffer.includes('{"tool"')) {
      const startIdx = buffer.indexOf('{"tool"');
      let braceCount = 0;
      let foundStart = false;
      let endIdx = -1;

      for (let i = startIdx; i < buffer.length; i++) {
        if (buffer[i] === '{') {
          braceCount++;
          foundStart = true;
        } else if (buffer[i] === '}') {
          braceCount--;
        }

        if (foundStart && braceCount === 0) {
          endIdx = i;
          break;
        }
      }

      if (endIdx !== -1) {
        reader.cancel();
        return buffer.slice(0, endIdx + 1);
      }
    }
  }

  return full;
}

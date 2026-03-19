import test from 'node:test';
import assert from 'node:assert';
import { streamLLM } from '../src/core/llm.ts';
import http from 'node:http';

test('streamLLM - should detect tool call early from streaming response', async (t) => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    const chunks = [
      'I will ',
      'call a tool. ',
      '{"tool": "sqlite_query", ',
      '"args": {"query": "SELECT * FROM audit"}}',
      ' and some extra text.'
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < chunks.length) {
        res.write(chunks[i]);
        i++;
      } else {
        res.end();
        clearInterval(interval);
      }
    }, 10);
  });

  await new Promise<void>((resolve) => server.listen(8080, resolve));

  const result = await streamLLM('http://localhost:8080/completion', 'test prompt');

  assert.ok(result.includes('{"tool"'));
  // Ensure it returned early (didn't include " extra text.")
  assert.ok(!result.includes('extra text'));

  server.close();
});

import test from 'node:test';
import assert from 'node:assert';
import { streamLLM } from '../src/core/llm.ts';
import http from 'node:http';

test('streamLLM - should capture full tool call even if chunked', async (t) => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    // Send tool call in chunks
    res.write('{"to');
    setTimeout(() => res.write('ol": "te'), 50);
    setTimeout(() => res.write('st", "args": { "v'), 100);
    setTimeout(() => res.write('al": 42 } } extra text'), 150);
    setTimeout(() => res.end(), 200);
  });

  const port = 8087;
  await new Promise<void>(resolve => server.listen(port, resolve));

  try {
    const result = await streamLLM('http://localhost:' + port, 'test');
    assert.strictEqual(result, '{"tool": "test", "args": { "val": 42 } }');
  } finally {
    server.close();
  }
});

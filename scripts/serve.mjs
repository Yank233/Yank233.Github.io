import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
const port = Number(process.env.PORT || 5173);
const types = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.mp3', 'audio/mpeg'],
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2']
]);

const server = createServer(async (request, response) => {
  try {
    const requested = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const relativePath = decodeURIComponent(requested.pathname).replace(/^\/+/, '');
    let target = await realpath(path.join(root, relativePath || 'index.html'));
    if (target !== root && !target.startsWith(root + path.sep)) throw new Error('Path outside project');
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    response.writeHead(200, {
      'Content-Type': types.get(path.extname(target)) || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    createReadStream(target).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Swarm site available at http://localhost:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}

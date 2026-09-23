import { createServer } from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../',
    import.meta.url)));
const port = Number(process.env.PORT || 4173);

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

function resolveInsideRoot(pathname) {
    const relative = decodeURIComponent(pathname).replace(/^[/\\]+/, '');
    const target = resolve(root, relative);

    const prefix = root.endsWith(sep) ?
        root :
        root + sep;

    if (target === root || target.startsWith(prefix)) {
        return target;
    }

    return null;
}

const server = createServer(async(req, res) => {
    try {
        const url = new URL(
            req.url || '/',
            `http://${req.headers.host || 'localhost'}`
        );

        let pathname = url.pathname || '/';

        if (pathname === '/') {
            pathname = '/index.html';
        }

        const target = resolveInsideRoot(pathname);

        if (!target) {
            res.writeHead(403, {
                'Content-Type': 'text/plain; charset=utf-8'
            });

            res.end('Forbidden');
            return;
        }

        let info;

        try {
            info = await stat(target);
        } catch {
            /*
             * Rotas da aplicação podem usar index.html.
             * Arquivos estáticos inexistentes devem retornar 404.
             */
            if (!extname(target)) {
                const index = join(root, 'index.html');

                res.writeHead(200, {
                    'Content-Type': mime['.html'],
                    'Cache-Control': 'no-store'
                });

                createReadStream(index).pipe(res);
                return;
            }

            res.writeHead(404, {
                'Content-Type': 'text/plain; charset=utf-8'
            });

            res.end('Not Found');
            return;
        }

        if (info.isDirectory()) {
            const index = join(target, 'index.html');

            try {
                await stat(index);
            } catch {
                res.writeHead(404);
                res.end('Not Found');
                return;
            }

            res.writeHead(200, {
                'Content-Type': mime['.html'],
                'Cache-Control': 'no-store'
            });

            createReadStream(index).pipe(res);
            return;
        }

        const extension = extname(target).toLowerCase();

        const contentType =
            mime[extension] ||
            'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-store'
        });

        createReadStream(target).pipe(res);

    } catch (error) {
        console.error(error);

        res.writeHead(500, {
            'Content-Type': 'text/plain; charset=utf-8'
        });

        res.end(`Server error: ${error.message}`);
    }
});

server.listen(port, '127.0.0.1', () => {
    console.log(
        `Lara Iza local server: http://localhost:${port}`
    );

    console.log('Press Ctrl+C to stop.');
});
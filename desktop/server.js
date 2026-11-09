import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const CORS = { "Access-Control-Allow-Origin": "*" };

export function startStatic(rootDir, port, apiPort) {
  const server = http.createServer((request, response) => route(request, response, rootDir, apiPort));
  server.listen(port, "127.0.0.1");

  return server;
}

function route(request, response, rootDir, apiPort) {
  const isApi = request.url.startsWith("/api/");

  if (isApi) {
    proxy(request, response, apiPort);
    return;
  }

  serveFile(request, response, rootDir);
}

function withCors(headers) {
  const rest = Object.entries(headers).filter(([name]) => name.toLowerCase() !== "access-control-allow-origin");

  return { ...Object.fromEntries(rest), ...CORS };
}

function proxy(request, response, apiPort) {
  const options = {
    host: "127.0.0.1",
    port: apiPort,
    path: request.url.replace(/^\/api/, "") || "/",
    method: request.method,
    headers: { ...request.headers, host: `127.0.0.1:${apiPort}` },
  };

  const upstream = http.request(options, (answer) => {
    response.writeHead(answer.statusCode, withCors(answer.headers));
    answer.pipe(response);
  });

  upstream.on("error", () => fail(response, 502, "API недоступен"));
  request.pipe(upstream);
}

function serveFile(request, response, rootDir) {
  const relative = decodeURIComponent(request.url.split("?")[0]);
  const candidate = path.join(rootDir, relative === "/" ? "index.html" : relative);
  const resolved = path.resolve(candidate);

  if (!resolved.startsWith(path.resolve(rootDir))) {
    fail(response, 403, "Запрещено");
    return;
  }

  fs.readFile(resolved, (error, data) => reply(error ? null : data, response, resolved, rootDir));
}

function reply(data, response, resolved, rootDir) {
  if (data) {
    send(response, 200, MIME[path.extname(resolved)] || "application/octet-stream", data);
    return;
  }

  const extension = path.extname(resolved);

  if (extension) {
    fail(response, 404, "Файл не найден");
    return;
  }

  fs.readFile(path.join(rootDir, "index.html"), (error, fallback) => send(response, error ? 404 : 200, "text/html; charset=utf-8", fallback));
}

function send(response, status, type, data) {
  response.writeHead(status, { "Content-Type": type, ...CORS });
  response.end(data);
}

function fail(response, status, message) {
  send(response, status, "text/plain; charset=utf-8", message);
}

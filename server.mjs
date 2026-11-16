import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const root = fileURLToPath(new URL('./dist/', import.meta.url))
const port = Number(process.env.PORT ?? 8091)
const publicHost = process.env.PUBLIC_HOST
const bodyLimit = 2 * 1024 * 1024
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
}

const json = (response, status, message) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify({ error: { message } }))
}

const readBody = async (request) => {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > bodyLimit) throw new Error('Request body too large')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

/** 固定目标、固定三个端点；不接收目标 URL，避免成为开放代理或 SSRF 通道。 */
const proxyFreeApi = async (request, response, pathname) => {
  const endpoint =
    pathname === '/api/freeapi/models'
      ? 'models'
      : pathname === '/api/freeapi/search'
        ? 'search'
        : 'chat/completions'
  const method = endpoint === 'models' ? 'GET' : 'POST'
  if (request.method !== method) {
    json(response, 405, 'Method not allowed')
    return
  }
  const origin = request.headers.origin
  if (origin) {
    try {
      const forwardedHost = request.headers['x-forwarded-host']
      const allowedHosts = [
        request.headers.host,
        typeof forwardedHost === 'string' ? forwardedHost : undefined,
        publicHost,
      ].filter(Boolean)
      if (!allowedHosts.includes(new URL(origin).host)) throw new Error('Origin mismatch')
    } catch {
      json(response, 403, 'Cross-origin proxy access is not allowed')
      return
    }
  }
  const authorization = request.headers.authorization
  if (typeof authorization !== 'string' || !authorization.trim()) {
    json(response, 401, 'Authorization header is required')
    return
  }

  let body
  try {
    body = method === 'POST' ? await readBody(request) : undefined
  } catch {
    json(response, 413, 'Request body too large')
    return
  }
  const controller = new AbortController()
  request.on('aborted', () => controller.abort())
  response.on('close', () => {
    if (!response.writableEnded) controller.abort()
  })

  try {
    const upstream = await fetch(`https://freeapi.cypggs.com/v1/${endpoint}`, {
      method,
      headers: {
        Authorization: authorization,
        Accept: request.headers.accept ?? '*/*',
        ...(method === 'POST'
          ? { 'Content-Type': request.headers['content-type'] ?? 'application/json' }
          : {}),
      },
      body,
      signal: controller.signal,
    })
    response.writeHead(upstream.status, {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    })
    if (upstream.body) {
      await pipeline(Readable.fromWeb(upstream.body), response)
    } else {
      response.end()
    }
  } catch (error) {
    if (!response.headersSent) {
      json(
        response,
        controller.signal.aborted ? 499 : 502,
        'Upstream request failed or was aborted'
      )
    } else if (!response.writableEnded) {
      response.destroy(error)
    }
  }
}

const serveStatic = async (request, response, pathname) => {
  let decoded
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    json(response, 400, 'Invalid path')
    return
  }
  const file = path.resolve(root, decoded === '/' ? 'index.html' : `.${decoded}`)
  if (!file.startsWith(`${path.resolve(root)}${path.sep}`)) {
    json(response, 403, 'Invalid path')
    return
  }
  try {
    const info = await stat(file)
    if (!info.isFile()) throw new Error('Not a file')
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
      'Content-Length': info.size,
      'Cache-Control': file.includes(`${path.sep}static${path.sep}`)
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    })
    if (request.method === 'HEAD') {
      response.end()
    } else {
      await pipeline(createReadStream(file), response)
    }
  } catch {
    if (!response.headersSent) json(response, 404, 'File not found')
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  if (
    pathname === '/api/freeapi/models' ||
    pathname === '/api/freeapi/chat/completions' ||
    pathname === '/api/freeapi/search'
  ) {
    await proxyFreeApi(request, response, pathname)
  } else if (request.method === 'GET' || request.method === 'HEAD') {
    await serveStatic(request, response, pathname)
  } else {
    json(response, 405, 'Method not allowed')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Chat Demo with restricted FreeAPI proxy listening on port ${port}`)
})

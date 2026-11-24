// Local training server for a Teachable Machine-compatible model.
// Serves the training page, the TF.js + @teachablemachine/image bundles and the dataset images,
// and writes the trained model (model.json, weights.bin, metadata.json) to tools/train-tm/out/.
//
//   node tools/train-tm/server.mjs   → open http://localhost:5180
//
// Images never leave this computer: the page trains in the local browser.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const out = path.join(here, 'out')
const PORT = Number(process.env.PORT ?? 5180)

export const CLASSES = ['5 euro', '10 euro', '20 euro', '50 euro', 'geen biljet']
const SOURCES = ['dataset', 'dataset_public']
const TEST_FRACTION = 0.2

/**
 * Train/test split per class and per source. Files are sorted by name, so frames of one video
 * (and augmented copies of one photo) sit next to each other; taking the LAST 20 % as test set
 * keeps near-duplicates out of the test set (a random split would leak them).
 */
function manifest() {
  const result = { classes: CLASSES, train: [], test: [] }
  CLASSES.forEach((cls, c) => {
    for (const src of SOURCES) {
      const dir = path.join(root, src, cls)
      if (!fs.existsSync(dir)) continue
      const files = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort()
      const cut = Math.round(files.length * (1 - TEST_FRACTION))
      files.forEach((f, i) => {
        const item = { c, src, url: `/data/${src}/${encodeURIComponent(cls)}/${encodeURIComponent(f)}` }
        ;(i < cut ? result.train : result.test).push(item)
      })
    }
  })
  return result
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.bin': 'application/octet-stream' }

function sendFile(res, file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return notFound(res)
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream' })
  fs.createReadStream(file).pipe(res)
}
function notFound(res) {
  res.writeHead(404).end('not found')
}
/** Resolve a path under `base` and refuse anything that escapes it. */
function safeJoin(base, rel) {
  const p = path.resolve(base, rel)
  return p.startsWith(path.resolve(base) + path.sep) ? p : null
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    const p = decodeURIComponent(url.pathname)

    if (req.method === 'POST' && p.startsWith('/save/')) {
      const target = safeJoin(out, p.slice('/save/'.length))
      if (!target) return notFound(res)
      const chunks = []
      req.on('data', (d) => chunks.push(d))
      req.on('end', () => {
        fs.mkdirSync(path.dirname(target), { recursive: true })
        fs.writeFileSync(target, Buffer.concat(chunks))
        res.writeHead(200).end('ok')
      })
      return
    }

    if (p === '/' || p === '/index.html') return sendFile(res, path.join(here, 'index.html'))
    if (p === '/manifest.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify(manifest()))
    }
    if (p === '/lib/tf.min.js') return sendFile(res, path.join(root, 'node_modules/@tensorflow/tfjs/dist/tf.min.js'))
    if (p === '/lib/tm.min.js')
      return sendFile(res, path.join(root, 'node_modules/@teachablemachine/image/dist/teachablemachine-image.min.js'))
    if (p.startsWith('/data/')) {
      const [src, ...rest] = p.slice('/data/'.length).split('/')
      if (!SOURCES.includes(src)) return notFound(res)
      const file = safeJoin(path.join(root, src), rest.join('/'))
      return file ? sendFile(res, file) : notFound(res)
    }
    if (p.startsWith('/current-model/')) {
      const file = safeJoin(path.join(root, 'public/model'), p.slice('/current-model/'.length))
      return file ? sendFile(res, file) : notFound(res)
    }
    if (p.startsWith('/out/')) {
      const file = safeJoin(out, p.slice('/out/'.length))
      return file ? sendFile(res, file) : notFound(res)
    }
    notFound(res)
  })
  .listen(PORT, () => console.log(`Training page: http://localhost:${PORT}`))

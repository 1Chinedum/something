import fs from 'fs'
import path from 'path'

const root = process.cwd()
const source = root
const destination = path.join(root, 'public', 'media')
const supported = {
  photos: new Set(['.jpg', '.jpeg', '.png', '.webp']),
  videos: new Set(['.mp4', '.webm', '.mov']),
  audio: new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg']),
}

fs.mkdirSync(destination, { recursive: true })

for (const file of fs.readdirSync(source)) {
  if (file.startsWith('.') || file.includes('__MACOSX')) continue
  const ext = path.extname(file).toLowerCase()
  const allowed = [...supported.photos, ...supported.videos, ...supported.audio]
  if (!allowed.includes(ext)) continue

  const from = path.join(source, file)
  const to = path.join(destination, file)
  if (!fs.existsSync(to)) {
    fs.copyFileSync(from, to)
  }
}

console.log('Copied supported media files into public/media')

const photoExts = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const videoExts = new Set(['.mp4', '.webm', '.mov'])
const audioExts = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg'])

function normalizeFileName(file) {
  return file.replace(/^\/public\/media\//, '').replace(/^\/media\//, '')
}

function naturalSort(a, b) {
  const aBase = a.name || a
  const bBase = b.name || b
  const aMatch = aBase.match(/\d+/)
  const bMatch = bBase.match(/\d+/)
  if (aMatch && bMatch) {
    return Number(aMatch[0]) - Number(bMatch[0])
  }
  return aBase.localeCompare(bBase)
}

export function discoverMedia() {
  const media = import.meta.glob('/public/media/*', { eager: true, import: 'default' })
  const files = Object.keys(media)
  const result = { photos: [], videos: [], audio: [] }

  const unique = new Set()
  files.forEach((filePath) => {
    const name = normalizeFileName(filePath)
    if (!name || name.startsWith('.') || unique.has(name)) return
    unique.add(name)

    const lower = name.toLowerCase()
    const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : ''

    if (photoExts.has(ext)) {
      result.photos.push({ name, file: `/media/${name}`, caption: captionFromName(name) })
    } else if (videoExts.has(ext)) {
      result.videos.push({ name, file: `/media/${name}`, caption: captionFromName(name) })
    } else if (audioExts.has(ext)) {
      result.audio.push({ name, file: `/media/${name}` })
    }
  })

  result.photos.sort((a, b) => naturalSort(a.name, b.name))
  result.videos.sort((a, b) => naturalSort(a.name, b.name))
  result.audio.sort((a, b) => naturalSort(a.name, b.name))

  return result
}

function captionFromName(name) {
  const base = name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
  if (!base.trim()) return 'Some memories deserve their own little space.'
  return `Some little piece of ${base.trim()}.`
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, X, ChevronLeft, ChevronRight, Music2 } from 'lucide-react'
import surpriseConfig from './config/surpriseConfig'
import { discoverMedia } from './utils/mediaLoader'

const media = discoverMedia()

const PHOTOS = media.photos
const VIDEOS = media.videos
const AUDIO = media.audio

function App() {
  const [opened, setOpened] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [videoIndex, setVideoIndex] = useState(0)
  const [videoViewerOpen, setVideoViewerOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('01')
  const [audio] = useState(() => new Audio(AUDIO[0]?.file || ''))
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [progress, setProgress] = useState(0)
  const [audioTrackIndex, setAudioTrackIndex] = useState(0)
  const [audioLoaded, setAudioLoaded] = useState(false)

  const photoSectionRef = useRef(null)
  const storageKey = 'lilybeth-progress'

  useEffect(() => {
    if (!AUDIO.length) return
    try {
      audio.src = AUDIO[0].file
      audio.load()
      audio.volume = volume
      audio.muted = isMuted
      audio.autoplay = true
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {
        setIsPlaying(false)
      })
    } catch (e) {
      setIsPlaying(false)
    }
  }, [])

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) {
      const section = JSON.parse(saved).active || '01'
      setActiveSection(section)
    }
  }, [])

  useEffect(() => {
    const sections = ['01', '02', '03', '04', '05']
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = entry.target.dataset.sectionIndex
            setActiveSection(idx)
            sessionStorage.setItem(storageKey, JSON.stringify({ active: idx }))
          }
        })
      },
      { threshold: 0.45 }
    )

    sections.forEach((s) => {
      const el = document.querySelector(`[data-section-index="${s}"]`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!opened || !AUDIO.length) return
    try {
      audio.src = AUDIO[audioTrackIndex].file
      audio.loop = false
      audio.volume = volume
      audio.muted = isMuted
      audio.onloadedmetadata = () => setAudioLoaded(true)
      audio.ontimeupdate = () => setProgress((audio.currentTime / audio.duration) * 100 || 0)
      audio.onended = () => {
        if (audioTrackIndex < AUDIO.length - 1) {
          playNextTrack()
        } else {
          setAudioTrackIndex(0)
          audio.src = AUDIO[0].file
          audio.play()
        }
      }
    } catch (e) { }
  }, [opened, audioTrackIndex])

  const startExperience = async () => {
    setOpened(true)
    if (AUDIO.length) {
      try {
        audio.src = AUDIO[0].file
        audio.load()
        audio.volume = volume
        audio.muted = isMuted
        audio.autoplay = true
        await audio.play()
        setIsPlaying(true)
      } catch (e) {
        setIsPlaying(false)
      }
    }
  }

  const playPauseAudio = async () => {
    if (!AUDIO.length) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        audio.src = AUDIO[audioTrackIndex].file
        audio.volume = volume
        audio.muted = isMuted
        await audio.play()
        setIsPlaying(true)
      } catch (e) {}
    }
  }

  const playNextTrack = () => {
    if (!AUDIO.length) return
    const next = (audioTrackIndex + 1) % AUDIO.length
    setAudioTrackIndex(next)
    const track = AUDIO[next]
    audio.src = track.file
    audio.load()
    audio.play()
    setIsPlaying(true)
  }

  const playPrevTrack = () => {
    if (!AUDIO.length) return
    const next = audioTrackIndex === 0 ? AUDIO.length - 1 : audioTrackIndex - 1
    setAudioTrackIndex(next)
    const track = AUDIO[next]
    audio.src = track.file
    audio.load()
    audio.play()
    setIsPlaying(true)
  }

  const updateVolume = (e) => {
    const next = Number(e.target.value)
    setVolume(next)
    if (audio) audio.volume = next
  }

  return (
    <div className="app-shell">
      <div className="surprise-bg" />
      <div className="starfield" />
      <JourneyIndicator active={activeSection} />

      {!opened ? (
        <OpeningScreen onOpen={startExperience} />
      ) : (
        <main className="main-story">
          <IntroSection />

          {PHOTOS.length > 0 && (
            <PhotoSection photos={PHOTOS} />
          )}

          {VIDEOS.length > 0 && (
            <VideoTransition />
          )}

          {VIDEOS.length > 0 && (
            <VideoSection videos={VIDEOS} />
          )}

          <SecretTransition />
          <PersonalMessage />
          <FinalReveal />
        </main>
      )}

      {AUDIO.length > 0 && (
        <MusicPlayer
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          progress={progress}
          track={AUDIO[audioTrackIndex]}
          onTogglePlay={playPauseAudio}
          onToggleMute={() => {
            setIsMuted(!isMuted)
            if (audio) audio.muted = !isMuted
          }}
          onVolumeChange={updateVolume}
          onPrev={playPrevTrack}
          onNext={playNextTrack}
          onProgressChange={(e) => {
            const v = Number(e.target.value)
            if (audio && audio.duration) {
              audio.currentTime = (audio.duration * v) / 100
            }
            setProgress(v)
          }}
        />
      )}
    </div>
  )
}

function OpeningScreen({ onOpen }) {
  const [lineIndex, setLineIndex] = useState(0)
  const lines = [
    surpriseConfig.opening.greeting,
    surpriseConfig.opening.line1,
    surpriseConfig.opening.line2,
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex((prev) => Math.min(prev + 1, lines.length - 1))
    }, 900)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="lily-screen">
      <div className="opening-card">
        <div className="opening-dots">
          <span className="opening-dot" />
          <span className="opening-dot" />
          <span className="opening-dot" />
        </div>
        <h1 className="opening-text">{lines[lineIndex] || lines[0]}</h1>
        <div className="opening-subtext">
          {lineIndex >= 2 && surpriseConfig.opening.cta}
        </div>
        {lineIndex >= 2 && (
          <button className="open-cta" onClick={onOpen}>
            {surpriseConfig.opening.cta}
          </button>
        )}
      </div>
    </section>
  )
}

function IntroSection() {
  return (
    <section className="section intro-section" data-section-index="01">
      <div className="stacked-lines">
        <h2 className="intro-title">{surpriseConfig.intro.greeting}</h2>
        <span className="intro-line">{surpriseConfig.intro.line1}</span>
        <span className="intro-line">{surpriseConfig.intro.line2}</span>
        <span className="intro-line">{surpriseConfig.intro.line3}</span>
        <button className="keep-cta">{surpriseConfig.intro.cta}</button>
      </div>
    </section>
  )
}

function PhotoSection({ photos }) {
  const [open, setOpen] = useState(false)
  const [photo, setPhoto] = useState(0)
  const [touchStart, setTouchStart] = useState(0)

  const show = (i) => {
    setPhoto(i)
    setOpen(true)
  }

  return (
    <section className="section gallery-section" data-section-index="02">
      <div className="gallery-title">{surpriseConfig.photoTitle}</div>
      <div className="cinematic-photo">
        <div className="cinematic-photo-grid">
          {photos.slice(0, 3).map((item, i) => (
            <div className="photo-panel" key={item.name} onDoubleClick={() => burst(item.name)}>
              <img src={item.file} alt={item.caption} loading="eager" />
            </div>
          ))}
        </div>
      </div>

      <div className="gallery-strip"
        onTouchStart={(e) => setTouchStart(e.changedTouches[0].clientX)}
        onTouchEnd={(e) => {
          const dist = e.changedTouches[0].clientX - touchStart
          if (Math.abs(dist) > 40) {
            const el = e.currentTarget
            el.scrollLeft += dist > 0 ? -260 : 260
          }
        }}>
        {photos.map((item, i) => (
          <figure className="gallery-item" key={item.name}>
            <span className="gallery-index">{String(i + 1).padStart(2, '0')}</span>
            <img src={item.file} alt={item.caption} loading="lazy" onClick={() => show(i)} />
            <figcaption className="gallery-caption">{item.caption}</figcaption>
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <Lightbox
            photos={photos}
            photo={photo}
            onClose={() => setOpen(false)}
            onPrev={() => setPhoto((photo + photos.length - 1) % photos.length)}
            onNext={() => setPhoto((photo + 1) % photos.length)}
          />
        )}
      </AnimatePresence>
    </section>
  )
}

function PhotoReveal() {
  return null
}

function Lightbox({ photos, photo, onClose, onPrev, onNext }) {
  const current = photos[photo]
  return (
    <div className="lightbox-overlay">
      <div className="lightbox-panel">
        <div className="lightbox-img-wrap">
          <button className="lightbox-close" onClick={onClose}><X size={16} /></button>
          <button className="lightbox-prev" onClick={onPrev}><ChevronLeft /></button>
          <button className="lightbox-next" onClick={onNext}><ChevronRight /></button>
          <img src={current.file} alt={current.caption} />
          <span className="lightbox-counter">{String(photo + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
        </div>
      </div>
    </div>
  )
}

function VideoTransition() {
  return (
    <section className="section secret-transition" data-section-index="03">
      <div className="stacked-lines">
        <span className="intro-line">{surpriseConfig.videoTransition.line1}</span>
        <span className="intro-line">{surpriseConfig.videoTransition.line2}</span>
      </div>
    </section>
  )
}

function VideoSection({ videos }) {
  const [open, setOpen] = useState(false)
  const [video, setVideo] = useState(0)

  return (
    <section className="section video-section" data-section-index="03">
      <div className="video-title">{surpriseConfig.videoTitle}</div>
      <div className="video-grid">
        {videos.map((item, i) => (
          <div className="video-card" key={item.name}>
            <div className="video-frame">
              <video preload="metadata" poster="" muted autoPlay loop playsInline>
                <source src={item.file} type={`video/${item.file.split('.').pop()}`} />
              </video>
              <button className="video-play-button" onClick={() => { setVideo(i); setOpen(true) }}><Play size={20} /></button>
            </div>
            <div className="video-caption">{item.caption}</div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <VideoViewer videos={videos} video={video} onClose={() => setOpen(false)} onPrev={() => setVideo((video + videos.length - 1) % videos.length)} onNext={() => setVideo((video + 1) % videos.length)} />
        )}
      </AnimatePresence>
    </section>
  )
}

function VideoViewer({ videos, video, onClose, onPrev, onNext }) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [progress, setProgress] = useState(0)
  const videoRef = useRef(null)
  const current = videos[video]

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.loop = true
      videoRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }, [video])

  const togglePlay = async () => {
    if (!videoRef.current) return
    if (playing) {
      videoRef.current.pause()
      setPlaying(false)
    } else {
      await videoRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <div className="video-viewer">
      <div className="video-viewer-panel">
        <button className="video-close" onClick={onClose}><X size={16} /></button>
        <div className="video-viewer-video-wrap">
          <video ref={videoRef} autoPlay loop controls={false} playsInline muted={muted} volume={volume} preload="metadata">
            <source src={current.file} />
          </video>
        </div>
        <div className="video-viewer-controls">
          <button onClick={onPrev}><ChevronLeft /></button>
          <button onClick={togglePlay}>{playing ? <Pause size={16} /> : <Play size={16} />}</button>
          <button onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }}>
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input type="range" min="0" max="100" value={volume * 100} onChange={(e) => { setVolume(Number(e.target.value)/100); if(videoRef.current) videoRef.current.volume = Number(e.target.value)/100; }} className="video-progress" />
          <span>{Math.round(progress)}%</span>
          <button onClick={onNext}><ChevronRight /></button>
          <button onClick={onClose}><X /></button>
        </div>
      </div>
    </div>
  )
}

function SecretTransition() {
  return (
    <section className="section secret-transition" data-section-index="04">
      <div className="stacked-lines">
        {surpriseConfig.secretTransition.line1 && <span className="intro-line">{surpriseConfig.secretTransition.line1}</span>}
        {surpriseConfig.secretTransition.line2 && <span className="intro-line">{surpriseConfig.secretTransition.line2}</span>}
        {surpriseConfig.secretTransition.line3 && <span className="intro-line">{surpriseConfig.secretTransition.line3}</span>}
        {surpriseConfig.secretTransition.line4 && <span className="intro-line">{surpriseConfig.secretTransition.line4}</span>}
        {surpriseConfig.secretTransition.line5 && <span className="intro-line">{surpriseConfig.secretTransition.line5}</span>}
        {surpriseConfig.secretTransition.line6 && <span className="intro-line">{surpriseConfig.secretTransition.line6}</span>}
        {surpriseConfig.secretTransition.line7 && <span className="intro-line">{surpriseConfig.secretTransition.line7}</span>}
      </div>
    </section>
  )
}

function PersonalMessage() {
  return (
    <section className="section personal-message" data-section-index="04">
      <div className="personal-box">
        <div className="personal-title">{surpriseConfig.personal.title}</div>
        <div className="personal-body">
          {surpriseConfig.personal.body.map((line, i) => (
            <span key={line}><span className={i === 0 ? 'handwritten' : ''}>{line}</span>{i < surpriseConfig.personal.body.length - 1 ? ' ' : ''}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalReveal() {
  const [clicked, setClicked] = useState(false)
  return (
    <section className="section final-message" data-section-index="05">
      <div className="final-reveal-zone">
        <div className="final-panel">
          <div className="final-message-title">{surpriseConfig.final.line1}</div>
          {!clicked ? (
            <button className="final-button" onClick={() => setClicked(true)}>{surpriseConfig.final.cta}</button>
          ) : (
            <div className="final-reveal-panel">
              <div className="final-message-title">{surpriseConfig.final.title}</div>
              <div className="final-message-text">{surpriseConfig.final.message}</div>
              <div className="final-signature">{surpriseConfig.final.signature}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MusicPlayer({ isPlaying, isMuted, volume, progress, track, onTogglePlay, onToggleMute, onVolumeChange, onPrev, onNext, onProgressChange }) {
  return (
    <div className="music-player">
      <div className="music-title"><Music2 size={16} /> Playing something for you...</div>
      <div className="music-controls">
        {AUDIO.length > 1 && <button onClick={onPrev}><SkipBack size={14} /></button>}
        <button className="play" onClick={onTogglePlay}>{isPlaying ? <Pause size={14} /> : <Play size={14} />}</button>
        {AUDIO.length > 1 && <button onClick={onNext}><SkipForward size={14} /></button>}
        <button onClick={onToggleMute}>{isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}</button>
      </div>
      <input type="range" min="0" max="100" value={progress} onChange={onProgressChange} className="music-progress" />
      <input type="range" min="0" max="1" step="0.01" value={volume} onChange={onVolumeChange} className="music-progress" />
      <div className="music-track">{track?.name || 'Audio'}</div>
    </div>
  )
}

function JourneyIndicator({ active }) {
  const steps = [
    { id: '01', label: '01 — Hello' },
    { id: '02', label: '02 — Memories' },
    { id: '03', label: '03 — Moments' },
    { id: '04', label: '04 — A message' },
    { id: '05', label: '05 — One last thing' },
  ]

  return (
    <nav className="journey">
      {steps.map((step) => (
        <a className={`journey-step ${step.id === active ? 'active' : ''}`} key={step.id} href={'#'}>{step.label}</a>
      ))}
    </nav>
  )
}

function burst(name) {
  const star = document.createElement('div')
  star.innerHTML = '✦'
  star.className = 'secret-star'
  star.style.left = Math.round(50 + Math.random() * 20) + '%'
  star.style.top = Math.round(50 + Math.random() * 10) + '%'
  document.body.appendChild(star)
  setTimeout(() => star.remove(), 900)
}

export default App

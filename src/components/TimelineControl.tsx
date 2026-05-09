import { useEffect, useState } from 'react'

type TimelineControlProps = {
  dates: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

const playbackSpeeds = {
  느림: 900,
  보통: 500,
  빠름: 250,
} as const

type PlaybackSpeed = keyof typeof playbackSpeeds

export function TimelineControl({
  dates,
  selectedIndex,
  onChange,
}: TimelineControlProps) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlaybackSpeed>('보통')

  useEffect(() => {
    if (!playing || dates.length === 0) {
      return
    }

    const intervalId = window.setInterval(() => {
      onChange((selectedIndex + 1) % dates.length)
    }, playbackSpeeds[speed])

    return () => window.clearInterval(intervalId)
  }, [dates.length, onChange, playing, selectedIndex, speed])

  return (
    <section className="timeline-panel" aria-label="시점 재생 컨트롤">
      <div className="timeline-actions">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, selectedIndex - 1))}
          aria-label="이전 시점"
        >
          이전 시점
        </button>
        <button
          type="button"
          onClick={() => setPlaying(true)}
          disabled={playing}
          aria-label="재생"
        >
          재생
        </button>
        <button
          type="button"
          onClick={() => setPlaying(false)}
          disabled={!playing}
          aria-label="일시정지"
        >
          일시정지
        </button>
        <button
          type="button"
          onClick={() => onChange((selectedIndex + 1) % dates.length)}
          aria-label="다음 시점"
        >
          다음 시점
        </button>
      </div>
      <div className="speed-options" aria-label="재생 속도">
        {(Object.keys(playbackSpeeds) as PlaybackSpeed[]).map((speedOption) => (
          <button
            key={speedOption}
            type="button"
            className={speed === speedOption ? 'active' : ''}
            onClick={() => setSpeed(speedOption)}
          >
            {speedOption}
          </button>
        ))}
      </div>
      <input
        type="range"
        min={0}
        max={dates.length - 1}
        value={selectedIndex}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label="날짜 선택"
      />
      <strong className="timeline-date">{dates[selectedIndex]}</strong>
    </section>
  )
}

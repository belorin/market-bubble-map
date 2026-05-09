import { useEffect, useState } from 'react'

type TimelineControlProps = {
  dates: string[]
  selectedIndex: number
  onChange: (index: number) => void
}

export function TimelineControl({
  dates,
  selectedIndex,
  onChange,
}: TimelineControlProps) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) {
      return
    }

    const intervalId = window.setInterval(() => {
      onChange((selectedIndex + 1) % dates.length)
    }, 900)

    return () => window.clearInterval(intervalId)
  }, [dates.length, onChange, playing, selectedIndex])

  return (
    <section className="timeline-panel" aria-label="월별 재생 컨트롤">
      <div className="timeline-actions">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, selectedIndex - 1))}
          aria-label="이전 달"
        >
          이전 달
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
          aria-label="다음 달"
        >
          다음 달
        </button>
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

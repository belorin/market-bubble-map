type SectorFilterProps = {
  sectors: string[]
  selectedSector: string
  onChange: (sector: string) => void
}

export function SectorFilter({
  sectors,
  selectedSector,
  onChange,
}: SectorFilterProps) {
  const options = ['전체 보기', ...sectors]

  return (
    <section className="sector-filter" aria-label="섹터 필터">
      {options.map((sector) => (
        <button
          key={sector}
          type="button"
          className={selectedSector === sector ? 'active' : ''}
          onClick={() => onChange(sector)}
        >
          {sector}
        </button>
      ))}
    </section>
  )
}

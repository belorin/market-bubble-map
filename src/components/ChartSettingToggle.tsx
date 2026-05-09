type ChartSettingToggleProps = {
  label: string
  valueLabel: string
  onToggle: () => void
  ariaLabel: string
}

export function ChartSettingToggle({
  label,
  valueLabel,
  onToggle,
  ariaLabel,
}: ChartSettingToggleProps) {
  return (
    <button
      type="button"
      className="setting-toggle"
      aria-label={ariaLabel}
      onClick={onToggle}
      title="전환"
    >
      <span>{label}:</span>
      <strong>{valueLabel}</strong>
      <b aria-hidden="true">↔</b>
    </button>
  )
}

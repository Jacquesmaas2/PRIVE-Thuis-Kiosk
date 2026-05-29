'use client'

interface PinPadProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
}

export function PinPad({ value, onChange, maxLength = 4 }: PinPadProps) {
  function press(digit: string) {
    if (value.length < maxLength) onChange(value + digit)
  }

  function backspace() {
    onChange(value.slice(0, -1))
  }

  return (
    <div className="space-y-5">
      {/* Indicator dots */}
      <div className="flex justify-center gap-4">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-all ${
              i < value.length
                ? 'bg-primary border-primary scale-110'
                : 'border-muted-foreground/40'
            }`}
          />
        ))}
      </div>

      {/* Numpad grid: 1–9, backspace, 0, (empty) */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => press(d)}
            className="h-14 rounded-xl border border-input text-xl font-semibold
                       hover:bg-muted active:scale-95 transition-all select-none"
          >
            {d}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          disabled={value.length === 0}
          className="h-14 rounded-xl border border-input text-lg font-semibold
                     hover:bg-muted active:scale-95 transition-all disabled:opacity-30 select-none"
          aria-label="Wis laatste cijfer"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={() => press('0')}
          className="h-14 rounded-xl border border-input text-xl font-semibold
                     hover:bg-muted active:scale-95 transition-all select-none"
        >
          0
        </button>
        <div /> {/* placeholder in grid */}
      </div>
    </div>
  )
}

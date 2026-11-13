import { YEARS } from '../../config/indicators';

interface Props { year: number; setYear: (y: number) => void }

export function YearSelector({ year, setYear }: Props) {
  return (
    <div className="yrs" role="group" aria-label="Ano">
      {YEARS.map((y) => (
        <button key={y} className={y === year ? 'on' : ''} aria-pressed={y === year} onClick={() => setYear(y)}>{y}</button>
      ))}
    </div>
  );
}

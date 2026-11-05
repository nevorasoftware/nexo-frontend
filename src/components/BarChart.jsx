import { useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';
import { shortDay } from '../lib/format';

/**
 * Gráfico de barras de una sola serie (ventas por día) en HTML puro.
 * - Barras finas con extremos redondeados de 4px ancladas a la línea base.
 * - Tooltip al pasar el cursor/tocar con ventas, costo y ganancia.
 * - Vista de tabla alternativa para accesibilidad.
 */
export default function BarChart({ data, money }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(...data.map((d) => d.total), 0);
  const peakIndex = max > 0 ? data.findIndex((d) => d.total === max) : -1;

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setAsTable((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-soft hover:bg-rosa-100"
        >
          {asTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
          {asTable ? 'Ver gráfico' : 'Ver tabla'}
        </button>
      </div>

      {asTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-ink-muted">
              <th className="py-1 font-medium">Día</th>
              <th className="py-1 text-right font-medium">Ventas</th>
              <th className="py-1 text-right font-medium">Costo</th>
              <th className="py-1 text-right font-medium">Ganancia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rosa-100">
            {data.map((d) => (
              <tr key={d.date}>
                <td className="py-1.5 capitalize">{shortDay(d.date)}</td>
                <td className="py-1.5 text-right">{money(d.total)}</td>
                <td className="py-1.5 text-right">{money(d.total - d.profit)}</td>
                <td className="py-1.5 text-right font-medium">{money(d.profit)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <div className="flex h-44 items-end gap-[2px] border-b border-rosa-200" role="img" aria-label="Ventas de los últimos 7 días">
            {data.map((d, i) => {
              const pct = max > 0 ? (d.total / max) * 100 : 0;
              return (
                <div
                  key={d.date}
                  className="group relative flex h-full flex-1 cursor-default items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setHover(hover === i ? null : i)}
                >
                  {i === peakIndex && hover === null && (
                    <span className="absolute text-[11px] font-medium text-ink-soft" style={{ bottom: `calc(${pct}% + 4px)` }}>
                      {money(d.total)}
                    </span>
                  )}
                  <div
                    className={`w-full max-w-[28px] rounded-t-[4px] transition-colors ${hover === i ? 'bg-rosa-600' : 'bg-rosa-400'}`}
                    style={{ height: `${pct}%`, minHeight: d.total > 0 ? 2 : 0 }}
                  />
                  {hover === i && (
                    <div
                      className={`pointer-events-none absolute bottom-full z-10 mb-1 w-40 rounded-xl border border-rosa-100 bg-white p-2.5 text-xs shadow-lg ${
                        i < 2 ? 'left-0' : i > data.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2'
                      }`}
                    >
                      <p className="mb-1 font-semibold capitalize text-ink">{shortDay(d.date)}</p>
                      <p className="flex justify-between text-ink-soft"><span>Ventas</span><span className="text-ink">{money(d.total)}</span></p>
                      <p className="flex justify-between text-ink-soft"><span>Costo</span><span className="text-ink">{money(d.total - d.profit)}</span></p>
                      <p className="flex justify-between text-ink-soft"><span>Ganancia</span><span className="font-semibold text-ink">{money(d.profit)}</span></p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-[2px]">
            {data.map((d) => (
              <span key={d.date} className="flex-1 text-center text-[11px] capitalize text-ink-muted">
                {shortDay(d.date)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

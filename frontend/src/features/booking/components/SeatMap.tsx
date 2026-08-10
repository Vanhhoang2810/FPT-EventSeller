import { useCallback, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../../shared/utils/cn';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import type { EventZone, EventSeat } from '../../events/services/eventsApi';

interface SeatMapProps {
  zones: (EventZone & { seats: EventSeat[] })[];
  selectedSeatIds: number[];
  onToggleSeat: (seatId: number, zoneId: number, price: number) => void;
  standingSelections?: Record<number, number>;
  onUpdateStanding?: (zoneId: number, quantity: number, price: number) => void;
  maxTicketsPerUser?: number;
  totalCurrentTickets?: number;
}

const STATUS_COLORS = {
  available: 'bg-primary-600 hover:bg-primary-500 cursor-pointer',
  locked: 'bg-warning/70 cursor-not-allowed opacity-70',
  sold: 'bg-muted-foreground/30 cursor-not-allowed opacity-60',
  disabled: 'bg-muted cursor-not-allowed opacity-30 border border-dashed border-border',
};

const STATUS_ARIA: Record<string, string> = {
  available: 'còn trống',
  locked: 'đang được giữ',
  sold: 'đã bán',
  disabled: 'không khả dụng',
};

interface SeatCellProps {
  seat: EventSeat;
  zone: EventZone;
  isSelected: boolean;
  onToggle: (id: number, zoneId: number, price: number) => void;
  focusRef?: (el: HTMLButtonElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent, seat: EventSeat) => void;
}

function SeatCell({ seat, zone, isSelected, onToggle, focusRef, onKeyDown }: SeatCellProps) {
  const label = `${zone.name}-${seat.row_label}${seat.seat_number}`;
  const selectable = seat.status === 'available';

  return (
    <button
      ref={focusRef}
      role="gridcell"
      aria-label={`Ghế ${label}, giá ${formatCurrency(zone.price)}, ${STATUS_ARIA[seat.status]}`}
      aria-selected={isSelected}
      aria-disabled={!selectable}
      disabled={!selectable}
      tabIndex={selectable ? 0 : -1}
      onClick={() => selectable && onToggle(seat.id, zone.id, Number(zone.price))}
      onKeyDown={(e) => onKeyDown?.(e, seat)}
      className={cn(
        'h-6 w-6 rounded-[4px] text-[9px] font-bold text-white transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400',
        isSelected
          ? 'bg-accent-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] scale-110'
          : STATUS_COLORS[seat.status],
      )}
      title={label}
    />
  );
}

export function SeatMap({ 
  zones, 
  selectedSeatIds, 
  onToggleSeat,
  standingSelections = {},
  onUpdateStanding,
  maxTicketsPerUser = 5,
  totalCurrentTickets = 0
}: SeatMapProps) {
  const [focusedSeat, setFocusedSeat] = useState<{ zoneIdx: number; rowIdx: number; seatIdx: number } | null>(null);
  const cellRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const getFocusKey = (zi: number, ri: number, si: number) => `${zi}-${ri}-${si}`;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, seat: EventSeat, zoneIdx: number, rowIdx: number, seatIdx: number, seatsPerRow: number, totalRows: number) => {
      const zone = zones[zoneIdx];
      const move = (nzi: number, nri: number, nsi: number) => {
        const key = getFocusKey(nzi, nri, nsi);
        const el = cellRefs.current.get(key);
        if (el) { el.focus(); setFocusedSeat({ zoneIdx: nzi, rowIdx: nri, seatIdx: nsi }); }
      };

      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); if (seatIdx < seatsPerRow - 1) move(zoneIdx, rowIdx, seatIdx + 1); break;
        case 'ArrowLeft':  e.preventDefault(); if (seatIdx > 0) move(zoneIdx, rowIdx, seatIdx - 1); break;
        case 'ArrowDown':  e.preventDefault(); if (rowIdx < totalRows - 1) move(zoneIdx, rowIdx + 1, Math.min(seatIdx, seatsPerRow - 1)); break;
        case 'ArrowUp':    e.preventDefault(); if (rowIdx > 0) move(zoneIdx, rowIdx - 1, Math.min(seatIdx, seatsPerRow - 1)); break;
        case 'Escape': onToggleSeat(-1, zone.id, 0); break; // clear all
      }
    },
    [zones, onToggleSeat],
  );

  const seatedZones = [...zones].filter(z => z.type !== 'standing').sort((a, b) => a.sort_order - b.sort_order);
  const standingZones = [...zones].filter(z => z.type === 'standing').sort((a, b) => a.sort_order - b.sort_order);

  const renderStandingZone = (zone: EventZone & { seats: EventSeat[] }) => {
    const availableCount = zone.seats.filter(s => s.status === 'available').length;
    const currentQty = standingSelections[zone.id] || 0;
    const isSelected = currentQty > 0;
    
    // Remove " (Khu đứng)" if it's already in the name, otherwise we don't append it because the user wanted just one legend note.
    const displayName = zone.name.replace(/\(vé đứng\)/i, '').trim();

    return (
      <div key={zone.id} className="w-full h-full flex flex-col">
        <div 
          onClick={() => {
            if (currentQty === 0 && availableCount > 0 && totalCurrentTickets < maxTicketsPerUser) {
              onUpdateStanding?.(zone.id, 1, Number(zone.price));
            }
          }}
          className={cn(
            "relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 flex-1 min-h-[250px] lg:min-h-[350px]",
            isSelected 
              ? "border-accent-500 bg-accent-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]" 
              : "border-border bg-secondary/20 cursor-pointer hover:bg-secondary/40 hover:border-primary-500/50"
          )}
        >
           <div className="absolute top-4 left-4 right-4 flex items-center justify-center gap-2 flex-wrap">
             <div className="h-4 w-4 rounded-md shadow-sm shrink-0" style={{ backgroundColor: zone.color_code }} />
             <span className="text-sm font-bold text-foreground tracking-wide uppercase text-center">{displayName}</span>
           </div>
           
           <div className="mt-6 flex flex-col items-center gap-1">
             <span className="text-2xl font-black text-primary-700 dark:text-primary-400">{formatCurrency(zone.price)}</span>
             <span className="text-sm text-muted-foreground font-medium">Còn lại: {availableCount} vé</span>
           </div>
           
           {isSelected ? (
             <div className="mt-6 flex items-center gap-2 lg:gap-4 bg-background border border-border shadow-sm rounded-xl p-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => onUpdateStanding?.(zone.id, currentQty - 1, Number(zone.price))}
                  className={cn("p-2 lg:p-2.5 rounded-lg transition-colors text-foreground hover:bg-secondary hover:text-error")}
                >
                  <Minus size={18} />
                </button>
                <span className="w-6 lg:w-10 text-center font-bold text-base lg:text-lg">{currentQty}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (currentQty < availableCount && totalCurrentTickets < maxTicketsPerUser) {
                      onUpdateStanding?.(zone.id, currentQty + 1, Number(zone.price));
                    }
                  }}
                  disabled={currentQty >= availableCount || totalCurrentTickets >= maxTicketsPerUser}
                  className={cn(
                    "p-2 lg:p-2.5 rounded-lg transition-colors",
                    (currentQty >= availableCount || totalCurrentTickets >= maxTicketsPerUser) 
                      ? "text-muted-foreground opacity-50 cursor-not-allowed" 
                      : "text-foreground hover:bg-secondary hover:text-success"
                  )}
                >
                  <Plus size={18} />
                </button>
             </div>
           ) : (
             <div className="mt-6 text-sm text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity">
               Nhấn để chọn vé
             </div>
           )}
        </div>
      </div>
    );
  };

  const renderSeatedZone = (zone: EventZone & { seats: EventSeat[] }, zoneIdx: number) => {
    // Group seats by row
    const rowsMap = new Map<string, EventSeat[]>();
    zone.seats.forEach((s) => {
      if (!rowsMap.has(s.row_label)) rowsMap.set(s.row_label, []);
      rowsMap.get(s.row_label)!.push(s);
    });
    const rows = Array.from(rowsMap.entries()).sort(([a], [b]) => a.localeCompare(b));

    return (
      <div key={zone.id} className="w-full max-w-2xl">
        {/* Zone header */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="h-3 w-3 rounded-sm shadow-sm" style={{ backgroundColor: zone.color_code }} />
          <span className="text-sm font-bold tracking-wide uppercase text-foreground">{zone.name}</span>
          <span className="text-xs text-muted-foreground font-medium">— {formatCurrency(zone.price)}/ghế</span>
        </div>

        <div className="flex flex-col gap-1.5" role="rowgroup">
          {rows.map(([rowLabel, seats], rowIdx) => (
            <div key={rowLabel} className="flex items-center justify-center gap-1.5" role="row">
              <span className="w-5 shrink-0 text-center text-xs text-muted-foreground font-mono">{rowLabel}</span>
              <div className="flex flex-wrap gap-1 justify-center">
                {[...seats]
                  .sort((a, b) => a.seat_number - b.seat_number)
                  .map((seat, seatIdx) => (
                    <SeatCell
                      key={seat.id}
                      seat={seat}
                      zone={zone}
                      isSelected={selectedSeatIds.includes(seat.id)}
                      onToggle={onToggleSeat}
                      focusRef={(el) => {
                        const key = getFocusKey(zoneIdx, rowIdx, seatIdx);
                        if (el) cellRefs.current.set(key, el);
                        else cellRefs.current.delete(key);
                      }}
                      onKeyDown={(e, s) => handleKeyDown(e, s, zoneIdx, rowIdx, seatIdx, seats.length, rows.length)}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-auto" role="grid" aria-label="Sơ đồ ghế ngồi">
      {/* Stage — premium gradient bar */}
      <div className="mb-8 mx-auto max-w-2xl">
        <div className="relative flex items-center justify-center rounded-2xl overflow-hidden py-3">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-700/20 via-primary-500/30 to-primary-700/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent" />
          {/* Border */}
          <div className="absolute inset-0 rounded-2xl border border-primary-500/25" />
          {/* Text */}
          <span className="relative text-[10px] font-black uppercase tracking-[0.25em] text-primary-400/80">
            ▲ &nbsp; SÂN KHẤU &nbsp; ▲
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch justify-center w-full max-w-6xl mx-auto">
        {/* Left Standing Zone */}
        {standingZones.length > 0 && (
          <div className="flex flex-col gap-4 w-full lg:w-36 xl:w-44 shrink-0 order-2 lg:order-1">
            {standingZones.slice(0, Math.ceil(standingZones.length / 2)).map(renderStandingZone)}
          </div>
        )}

        {/* Center Seated Zones */}
        <div className="flex flex-col gap-8 items-center flex-1 order-1 lg:order-2">
          {seatedZones.map((zone, idx) => renderSeatedZone(zone, idx))}
        </div>

        {/* Right Standing Zone */}
        {standingZones.length > 1 && (
          <div className="flex flex-col gap-4 w-full lg:w-36 xl:w-44 shrink-0 order-3 lg:order-3">
            {standingZones.slice(Math.ceil(standingZones.length / 2)).map(renderStandingZone)}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-12 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-border bg-secondary/50 p-3 text-xs">
        {standingZones.length > 0 && (
          <div className="flex items-center gap-1.5 mr-4 font-semibold">
            <span className="text-muted-foreground">(vé đứng) áp dụng cho các khu vực ở hai bên hông sân khấu</span>
          </div>
        )}
        {[
          { color: 'bg-primary-600', label: 'Còn trống' },
          { color: 'bg-accent-500', label: 'Đang chọn' },
          { color: 'bg-warning/70', label: 'Đang giữ' },
          { color: 'bg-muted-foreground/30 opacity-60', label: 'Đã bán' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={cn('h-4 w-4 rounded-[3px]', color)} />
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

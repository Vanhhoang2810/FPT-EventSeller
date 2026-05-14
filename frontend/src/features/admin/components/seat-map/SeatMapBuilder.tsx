import { Plus, Trash2 } from 'lucide-react';

export interface ZoneConfig {
  name: string;
  price: number;
  colorCode: string;
  rowsCount: number;
  seatsPerRow: number;
}

const ZONE_COLORS = ['#059669', '#3B82F6', '#F59E0B', '#8B5CF6', '#F97316', '#EC4899'];

interface SeatMapBuilderProps {
  zones: ZoneConfig[];
  onChange: (zones: ZoneConfig[]) => void;
}

export function SeatMapBuilder({ zones, onChange }: SeatMapBuilderProps) {
  const totalSeats = zones.reduce((sum, z) => sum + z.rowsCount * z.seatsPerRow, 0);

  const addZone = () => {
    if (zones.length >= 6) return;
    onChange([...zones, {
      name: `Khu ${String.fromCharCode(65 + zones.length)}`,
      price: 300000,
      colorCode: ZONE_COLORS[zones.length % ZONE_COLORS.length],
      rowsCount: 4,
      seatsPerRow: 15,
    }]);
  };

  const removeZone = (i: number) => onChange(zones.filter((_, idx) => idx !== i));

  const updateZone = (i: number, field: keyof ZoneConfig, value: string | number) => {
    onChange(zones.map((z, idx) => idx === i ? { ...z, [field]: value } : z));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {zones.length} khu — <span className="text-foreground font-medium">{totalSeats.toLocaleString('vi-VN')} ghế</span>
        </p>
        <button
          type="button"
          onClick={addZone}
          disabled={zones.length >= 6}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary disabled:opacity-50"
        >
          <Plus size={14} /> Thêm khu
        </button>
      </div>

      <div className="space-y-3">
        {zones.map((zone, i) => (
          <div key={i} className="rounded-xl border border-border bg-secondary p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded" style={{ backgroundColor: zone.colorCode }} />
                <span className="text-sm font-medium text-foreground">{zone.name}</span>
                <span className="text-xs text-muted-foreground">({zone.rowsCount * zone.seatsPerRow} ghế)</span>
              </div>
              {zones.length > 1 && (
                <button type="button" onClick={() => removeZone(i)} className="text-muted-foreground hover:text-error">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Tên khu', field: 'name' as const, type: 'text', value: zone.name },
                { label: 'Giá (VNĐ)', field: 'price' as const, type: 'number', value: zone.price },
                { label: 'Số hàng', field: 'rowsCount' as const, type: 'number', value: zone.rowsCount, min: 1, max: 26 },
                { label: 'Ghế/hàng', field: 'seatsPerRow' as const, type: 'number', value: zone.seatsPerRow, min: 1, max: 50 },
              ].map(({ label, field, type, value, min, max }) => (
                <div key={field}>
                  <label className="text-xs text-muted-foreground">{label}</label>
                  <input
                    type={type}
                    value={value}
                    min={min}
                    max={max}
                    onChange={(e) => updateZone(i, field, type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="w-full rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-foreground outline-none focus:border-border/60"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview mini */}
      <div className="rounded-xl border border-border bg-card p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Preview</p>
        <div className="flex flex-wrap gap-3">
          {zones.map((z, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: z.colorCode }} />
              <span>{z.name}: {z.rowsCount}×{z.seatsPerRow} = {z.rowsCount * z.seatsPerRow} ghế — {z.price.toLocaleString('vi-VN')}₫</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

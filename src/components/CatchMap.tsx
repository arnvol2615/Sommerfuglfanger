import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCatchHeatmapPoints } from '../services/supabaseApi';

export function CatchMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // StrictMode runs effects twice — skip if Leaflet already owns this element
    if ((el as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

    let map: L.Map;
    try {
      map = L.map(el, { center: [65, 15], zoom: 5, zoomControl: true });
    } catch {
      return;
    }
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    let cancelled = false;

    getCatchHeatmapPoints()
      .then(points => {
        if (cancelled) return;
        setLoading(false);
        setCount(points.length);

        for (const p of points) {
          L.circleMarker([p.lat, p.lng], {
            radius: 22,
            fillColor: '#f97316',
            fillOpacity: 0.13,
            color: '#ea580c',
            weight: 0.5,
            opacity: 0.2,
          }).addTo(map);
        }

        if (points.length > 0) {
          const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number]));
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
        }
      })
      .catch(err => {
        if (cancelled) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Feil ved lasting av kart');
      });

    return () => {
      cancelled = true;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-3">
        <h2 className="text-xl font-bold text-gray-800">Funnkart</h2>
        <p className="text-sm text-gray-500">
          {count !== null
            ? `${count} registrerte funn – posisjoner er avrundet til ~1 km`
            : 'Viser omtrentlige fangstlokasjoner'}
        </p>
      </div>

      <div className="mx-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-[400] bg-white/80">
            <span className="text-sm text-gray-400">Laster kart…</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-[400] p-4">
            <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}
        <div ref={containerRef} style={{ height: '420px' }} />
      </div>

      <p className="mx-4 mt-2 text-xs text-gray-400 text-center">
        Kun tellende funn vises. Eksakte posisjoner er aldri delt.
      </p>
    </div>
  );
}

import React, { useEffect, useRef } from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

export default function TicketLocationMap({ location, technicianName, ticketNumber, submittedAt }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const hasCoords = location && typeof location.lat === "number" && typeof location.lng === "number" && !isNaN(location.lat) && !isNaN(location.lng);

  useEffect(() => {
    if (!hasCoords) return;

    const loadLeaflet = () => {
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!window.L) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => initMap();
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!mapContainerRef.current || !window.L) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const lat = location.lat;
      const lng = location.lng;

      const map = window.L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 15);
      mapInstanceRef.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
      }).addTo(map);

      const customIcon = window.L.divIcon({
        className: "custom-ticket-pin",
        html: `<div style="background-color: #10B981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 13px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(16,185,129,0.5);">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const timeText = submittedAt ? new Date(submittedAt).toLocaleString() : "";
      const popupHtml = `
        <div style="font-family: sans-serif; min-width: 150px; color: #1e293b;">
          <div style="font-weight: bold; color: #059669; font-size: 12px; margin-bottom: 2px;">✓ Work Completed Location</div>
          <div style="font-size: 11px; font-weight: 600;">${ticketNumber || 'Ticket'} • ${technicianName || 'Technician'}</div>
          ${timeText ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">${timeText}</div>` : ''}
          <div style="font-family: monospace; font-size: 10px; color: #475569; margin-top: 4px;">Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}</div>
        </div>
      `;

      window.L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupHtml)
        .openPopup();
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location?.lat, location?.lng, hasCoords, technicianName, ticketNumber, submittedAt]);

  const osmUrl = hasCoords
    ? `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=16/${location.lat}/${location.lng}`
    : null;

  const gmapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
    : null;

  return (
    <div className="bg-slate-850/60 border border-slate-750 p-4 rounded-2xl space-y-3 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-xs">Work Completion GPS Location</h4>
            <p className="text-[10px] text-slate-400">Captured at submission time by technician</p>
          </div>
        </div>
        {hasCoords && (
          <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 font-mono text-[10px] font-bold rounded-full">
            GPS Verified
          </span>
        )}
      </div>

      {hasCoords ? (
        <>
          <div 
            ref={mapContainerRef} 
            className="w-full h-48 rounded-xl overflow-hidden border border-slate-750 bg-slate-950 z-0"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <div className="text-[11px] font-mono text-slate-300 font-semibold flex items-center gap-1.5">
              <span className="text-emerald-400">📍</span>
              <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
              {location.address && <span className="text-slate-400 font-sans truncate max-w-[150px]">({location.address})</span>}
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              {osmUrl && (
                <a
                  href={osmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 hover:text-violet-300 hover:underline flex items-center gap-1 font-bold bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 transition"
                >
                  <span>Open OSM</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {gmapsUrl && (
                <a
                  href={gmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 font-bold bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 transition"
                >
                  <span>Google Maps</span>
                  <Navigation className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-400">No GPS Location Recorded</p>
          <p className="text-[10px] text-slate-500">The technician did not attach GPS coordinates when submitting completion details for this ticket.</p>
        </div>
      )}
    </div>
  );
}

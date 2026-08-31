import React, { useEffect, useRef } from "react";
import { MapPin, X, ExternalLink, Clock, Navigation } from "lucide-react";

export default function LocationMapModal({ isOpen, onClose, attendance }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !attendance) return;

    // Dynamically load Leaflet CSS and JS if not already present
    const loadLeaflet = async () => {
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

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const inLoc = attendance.clockInLocation;
      const outLoc = attendance.clockOutLocation;

      const defaultLat = inLoc?.lat || outLoc?.lat || 20.5937;
      const defaultLng = inLoc?.lng || outLoc?.lng || 78.9629;

      const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);
      mapInstanceRef.current = map;

      // OpenStreetMap standard tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const bounds = [];

      // Custom Clock In Icon (Green)
      if (inLoc?.lat && inLoc?.lng) {
        const inIcon = window.L.divIcon({
          className: "custom-pin",
          html: `<div style="background-color: #10B981; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">IN</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const inTimeStr = attendance.clockInTime ? new Date(attendance.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

        window.L.marker([inLoc.lat, inLoc.lng], { icon: inIcon })
          .addTo(map)
          .bindPopup(`<b>Clock In Location</b><br/>Time: ${inTimeStr}<br/>Lat: ${inLoc.lat.toFixed(5)}<br/>Lng: ${inLoc.lng.toFixed(5)}`)
          .openPopup();

        bounds.push([inLoc.lat, inLoc.lng]);
      }

      // Custom Clock Out Icon (Rose/Red)
      if (outLoc?.lat && outLoc?.lng) {
        const outIcon = window.L.divIcon({
          className: "custom-pin",
          html: `<div style="background-color: #F43F5E; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5);">OUT</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const outTimeStr = attendance.clockOutTime ? new Date(attendance.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

        window.L.marker([outLoc.lat, outLoc.lng], { icon: outIcon })
          .addTo(map)
          .bindPopup(`<b>Clock Out Location</b><br/>Time: ${outTimeStr}<br/>Lat: ${outLoc.lat.toFixed(5)}<br/>Lng: ${outLoc.lng.toFixed(5)}`);

        bounds.push([outLoc.lat, outLoc.lng]);
      }

      if (bounds.length > 1) {
        // Draw line connecting clock in and clock out
        window.L.polyline(bounds, { color: "#8B5CF6", dashArray: "5, 10", weight: 3 }).addTo(map);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, attendance]);

  if (!isOpen || !attendance) return null;

  const inLoc = attendance.clockInLocation;
  const outLoc = attendance.clockOutLocation;
  const inTimeStr = attendance.clockInTime ? new Date(attendance.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";
  const outTimeStr = attendance.clockOutTime ? new Date(attendance.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—";

  const osmInUrl = inLoc?.lat ? `https://www.openstreetmap.org/?mlat=${inLoc.lat}&mlon=${inLoc.lng}#map=16/${inLoc.lat}/${inLoc.lng}` : null;
  const osmOutUrl = outLoc?.lat ? `https://www.openstreetmap.org/?mlat=${outLoc.lat}&mlon=${outLoc.lng}#map=16/${outLoc.lat}/${outLoc.lng}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{attendance.employeeName} ({attendance.employeeId})</h3>
              <p className="text-xs text-slate-400">Attendance Location Map • {attendance.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map View Container */}
        <div className="px-5">
          <div 
            ref={mapContainerRef} 
            className="w-full h-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 z-0"
          />
        </div>

        {/* Coordinates Summary */}
        <div className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Clock In Info */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Clock In: {inTimeStr}
              </span>
              {osmInUrl && (
                <a
                  href={osmInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-violet-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open OSM</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {inLoc?.lat ? (
              <div className="text-xs text-slate-300 font-mono">
                Lat: {inLoc.lat.toFixed(5)}, Lng: {inLoc.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No GPS coordinates recorded</div>
            )}
          </div>

          {/* Clock Out Info */}
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Clock Out: {outTimeStr}
              </span>
              {osmOutUrl && (
                <a
                  href={osmOutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-violet-400 hover:underline flex items-center gap-1 font-bold"
                >
                  <span>Open OSM</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {outLoc?.lat ? (
              <div className="text-xs text-slate-300 font-mono">
                Lat: {outLoc.lat.toFixed(5)}, Lng: {outLoc.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Not clocked out yet</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] text-slate-500">
          <span>Mapping powered by OpenStreetMap contributors & Leaflet</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

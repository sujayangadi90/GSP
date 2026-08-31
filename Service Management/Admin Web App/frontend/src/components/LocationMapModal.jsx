import React, { useEffect, useRef, useState } from "react";
import { MapPin, X, ExternalLink, Clock, Navigation, Layers, CheckCircle2 } from "lucide-react";

export default function LocationMapModal({ isOpen, onClose, attendance }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const inMarkerRef = useRef(null);
  const outMarkerRef = useRef(null);

  const [activeTab, setActiveTab] = useState("in"); // 'in', 'out', or 'all'

  const inLoc = attendance?.clockInLocation;
  const outLoc = attendance?.clockOutLocation;
  const hasIn = typeof inLoc?.lat === "number" && typeof inLoc?.lng === "number";
  const hasOut = typeof outLoc?.lat === "number" && typeof outLoc?.lng === "number";

  useEffect(() => {
    if (isOpen && attendance) {
      if (hasIn && hasOut) {
        setActiveTab("in");
      } else if (hasIn) {
        setActiveTab("in");
      } else if (hasOut) {
        setActiveTab("out");
      }
    }
  }, [isOpen, attendance]);

  useEffect(() => {
    if (!isOpen || !attendance) return;

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

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultLat = inLoc?.lat || outLoc?.lat || 20.5937;
      const defaultLng = inLoc?.lng || outLoc?.lng || 78.9629;

      const map = window.L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 15);
      mapInstanceRef.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);

      const bounds = [];

      // Clock In Marker (Green)
      if (hasIn) {
        const inIcon = window.L.divIcon({
          className: "custom-pin-in",
          html: `<div style="background-color: #10B981; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(16,185,129,0.5); cursor: pointer;">IN</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const inTimeStr = attendance.clockInTime ? new Date(attendance.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
        const inMarker = window.L.marker([inLoc.lat, inLoc.lng], { icon: inIcon, zIndexOffset: 500 })
          .addTo(map)
          .bindPopup(`<div style="font-family: sans-serif; min-width: 140px;"><b style="color: #10B981; font-size: 13px;">🟢 Clock In Location</b><br/><span style="font-size: 11px; color: #475569;">Time: <b>${inTimeStr}</b></span><br/><span style="font-family: monospace; font-size: 10px;">${inLoc.lat.toFixed(5)}, ${inLoc.lng.toFixed(5)}</span></div>`);

        inMarker.on("click", () => setActiveTab("in"));
        inMarkerRef.current = inMarker;
        bounds.push([inLoc.lat, inLoc.lng]);
      }

      // Clock Out Marker (Rose/Red)
      if (hasOut) {
        const outIcon = window.L.divIcon({
          className: "custom-pin-out",
          html: `<div style="background-color: #F43F5E; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 11px; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(244,63,94,0.5); cursor: pointer;">OUT</div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const outTimeStr = attendance.clockOutTime ? new Date(attendance.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";
        const outMarker = window.L.marker([outLoc.lat, outLoc.lng], { icon: outIcon, zIndexOffset: 400 })
          .addTo(map)
          .bindPopup(`<div style="font-family: sans-serif; min-width: 140px;"><b style="color: #F43F5E; font-size: 13px;">🔴 Clock Out Location</b><br/><span style="font-size: 11px; color: #475569;">Time: <b>${outTimeStr}</b></span><br/><span style="font-family: monospace; font-size: 10px;">${outLoc.lat.toFixed(5)}, ${outLoc.lng.toFixed(5)}</span></div>`);

        outMarker.on("click", () => setActiveTab("out"));
        outMarkerRef.current = outMarker;
        bounds.push([outLoc.lat, outLoc.lng]);
      }

      if (bounds.length > 1) {
        window.L.polyline(bounds, { color: "#8B5CF6", dashArray: "6, 8", weight: 3, opacity: 0.8 }).addTo(map);
      }

      // Default focus
      if (hasIn) {
        inMarkerRef.current?.openPopup();
        map.setView([inLoc.lat, inLoc.lng], 16);
      } else if (hasOut) {
        outMarkerRef.current?.openPopup();
        map.setView([outLoc.lat, outLoc.lng], 16);
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

  // Focus view change handler
  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (!mapInstanceRef.current) return;

    if (tab === "in" && hasIn) {
      inMarkerRef.current?.setZIndexOffset(1000);
      outMarkerRef.current?.setZIndexOffset(400);
      inMarkerRef.current?.openPopup();
      mapInstanceRef.current.flyTo([inLoc.lat, inLoc.lng], 16, { animate: true, duration: 0.8 });
    } else if (tab === "out" && hasOut) {
      outMarkerRef.current?.setZIndexOffset(1000);
      inMarkerRef.current?.setZIndexOffset(400);
      outMarkerRef.current?.openPopup();
      mapInstanceRef.current.flyTo([outLoc.lat, outLoc.lng], 16, { animate: true, duration: 0.8 });
    } else if (tab === "all" && hasIn && hasOut) {
      const bounds = [[inLoc.lat, inLoc.lng], [outLoc.lat, outLoc.lng]];
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 });
    }
  };

  if (!isOpen || !attendance) return null;

  const inTimeStr = attendance.clockInTime && !isNaN(new Date(attendance.clockInTime).getTime())
    ? new Date(attendance.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const outTimeStr = attendance.clockOutTime && !isNaN(new Date(attendance.clockOutTime).getTime())
    ? new Date(attendance.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const osmInUrl = hasIn ? `https://www.openstreetmap.org/?mlat=${inLoc.lat}&mlon=${inLoc.lng}#map=16/${inLoc.lat}/${inLoc.lng}` : null;
  const osmOutUrl = hasOut ? `https://www.openstreetmap.org/?mlat=${outLoc.lat}&mlon=${outLoc.lng}#map=16/${outLoc.lat}/${outLoc.lng}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
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

        {/* View Switcher Controls */}
        <div className="px-5 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Location Focus:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {hasIn && (
              <button
                type="button"
                onClick={() => handleSelectTab("in")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "in" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                Clock In
              </button>
            )}
            {hasOut && (
              <button
                type="button"
                onClick={() => handleSelectTab("out")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "out" ? "bg-rose-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-300" />
                Clock Out
              </button>
            )}
            {hasIn && hasOut && (
              <button
                type="button"
                onClick={() => handleSelectTab("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "all" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Both Pins
              </button>
            )}
          </div>
        </div>

        {/* Map View Container */}
        <div className="px-5">
          <div 
            ref={mapContainerRef} 
            className="w-full h-80 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 z-0"
          />
        </div>

        {/* Selectable Interactive Cards */}
        <div className="p-5 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Clock In Card */}
          <div 
            onClick={() => hasIn && handleSelectTab("in")}
            className={`p-4 rounded-2xl space-y-1.5 transition border cursor-pointer relative ${
              activeTab === "in" 
                ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500" 
                : "bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] text-white font-bold">✓</span>
                Clock In: {inTimeStr}
              </span>
              {osmInUrl && (
                <a
                  href={osmInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-violet-400 hover:underline flex items-center gap-1 font-bold"
                  title="Open in OpenStreetMap"
                >
                  <span>Open OSM</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {hasIn ? (
              <div className="text-xs text-slate-200 font-mono font-bold">
                Lat: {inLoc.lat.toFixed(5)}, Lng: {inLoc.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No GPS coordinates recorded</div>
            )}
            <p className="text-[10px] text-slate-400 font-medium">
              {activeTab === "in" ? "● Currently showing on map" : "Click to view Clock In on map"}
            </p>
          </div>

          {/* Clock Out Card */}
          <div 
            onClick={() => hasOut && handleSelectTab("out")}
            className={`p-4 rounded-2xl space-y-1.5 transition border cursor-pointer relative ${
              activeTab === "out" 
                ? "bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-950/50 ring-1 ring-rose-500" 
                : "bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
            } ${!hasOut ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 flex items-center justify-center text-[8px] text-white font-bold">✕</span>
                Clock Out: {outTimeStr}
              </span>
              {osmOutUrl && (
                <a
                  href={osmOutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[11px] text-violet-400 hover:underline flex items-center gap-1 font-bold"
                  title="Open in OpenStreetMap"
                >
                  <span>Open OSM</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            {hasOut ? (
              <div className="text-xs text-slate-200 font-mono font-bold">
                Lat: {outLoc.lat.toFixed(5)}, Lng: {outLoc.lng.toFixed(5)}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">Not clocked out yet</div>
            )}
            <p className="text-[10px] text-slate-400 font-medium">
              {!hasOut ? "Not clocked out" : (activeTab === "out" ? "● Currently showing on map" : "Click to view Clock Out on map")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] text-slate-500">
          <span>Mapping powered by OpenStreetMap & Leaflet</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

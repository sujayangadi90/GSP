import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  LogOut, 
  User, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Eye,
  X
} from "lucide-react";

export default function AttendancePortal() {
  const [employeeToken, setEmployeeToken] = useState(() => {
    try {
      return localStorage.getItem("gsp_emp_token") || "";
    } catch {
      return "";
    }
  });

  const [employee, setEmployee] = useState(() => {
    try {
      const saved = localStorage.getItem("gsp_emp_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login Form
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Portal State
  const [loading, setLoading] = useState(false);
  const [todayData, setTodayData] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("attendance"); // "attendance" | "history"

  // Clock In / Clock Out Action States
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  const fileInputRef = useRef(null);

  // Photo viewer modal
  const [viewPhoto, setViewPhoto] = useState(null);

  const API_BASE = window.location.origin.includes("localhost:5173") || window.location.origin.includes("localhost:3000")
    ? "http://localhost:5050" 
    : "";

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (employeeToken) {
      fetchMyAttendance();
      fetchHistory();
    }
  }, [employeeToken]);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/attendance/me`, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.employee) {
          setEmployee(data.employee);
          localStorage.setItem("gsp_emp_user", JSON.stringify(data.employee));
        }
        setTodayData(data.todayAttendance || null);
      } else {
        if (res.status === 401 || res.status === 403) {
          handleLogout();
        }
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/attendance/my-history`, {
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/attendance/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword })
      });
      const data = await res.json();

      if (res.ok && data.token && data.employee) {
        localStorage.setItem("gsp_emp_token", data.token);
        localStorage.setItem("gsp_emp_user", JSON.stringify(data.employee));
        setEmployeeToken(data.token);
        setEmployee(data.employee);
      } else {
        setLoginError(data.message || "Failed to log in");
      }
    } catch (err) {
      setLoginError("Server connection error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("gsp_emp_token");
      localStorage.removeItem("gsp_emp_user");
    } catch (e) {
      console.error(e);
    }
    setEmployeeToken("");
    setEmployee(null);
    setTodayData(null);
  };

  // Capture GPS Location
  const captureLocation = () => {
    setLocationLoading(true);
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser/device.");
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        });
        setLocationLoading(false);
      },
      (err) => {
        let msg = "Could not retrieve GPS location.";
        if (err.code === 1) msg = "Location permission denied. Please allow location access in your browser settings.";
        else if (err.code === 2) msg = "Position unavailable. Please ensure GPS is turned on.";
        else if (err.code === 3) msg = "Location request timed out. Please try again.";
        setLocationError(msg);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Handle Selfie selection
  const handleSelfieChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelfieFile(file);
      const reader = new FileReader();
      reader.onload = () => setSelfiePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Clock In Action
  const handleClockIn = async () => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      setActionError("Please capture your GPS location before clocking in.");
      return;
    }
    if (!selfieFile) {
      setActionError("Please take a live selfie photo before clocking in.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const formData = new FormData();
      formData.append("lat", location.lat);
      formData.append("lng", location.lng);
      formData.append("selfie", selfieFile);

      const res = await fetch(`${API_BASE}/api/attendance/clock-in`, {
        method: "POST",
        headers: { Authorization: `Bearer ${employeeToken}` },
        body: formData
      });
      const data = await res.json();

      if (res.ok && data.attendance) {
        setActionSuccess("Clock In Successful!");
        setTodayData(data.attendance);
        setSelfieFile(null);
        setSelfiePreview("");
        setLocation(null);
        fetchHistory();
      } else {
        setActionError(data.message || "Failed to clock in");
      }
    } catch (err) {
      setActionError("Connection error while clocking in. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Clock Out Action
  const handleClockOut = async () => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      setActionError("Please capture your GPS location before clocking out.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/attendance/clock-out`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${employeeToken}`
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng
        })
      });
      const data = await res.json();

      if (res.ok && data.attendance) {
        setActionSuccess("Clock Out Successful!");
        setTodayData(data.attendance);
        setLocation(null);
        fetchHistory();
      } else {
        setActionError(data.message || "Failed to clock out");
      }
    } catch (err) {
      setActionError("Connection error while clocking out. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate Elapsed Duration safely
  const getElapsedDuration = () => {
    try {
      if (!todayData || !todayData.clockInTime) return "0h 0m";
      const startTime = new Date(todayData.clockInTime);
      if (isNaN(startTime.getTime())) return "0h 0m";
      const endTime = todayData.clockOutTime ? new Date(todayData.clockOutTime) : currentTime;
      const diffMs = Math.max(0, endTime.getTime() - startTime.getTime());
      const totalMinutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}m`;
    } catch {
      return "0h 0m";
    }
  };

  // Helper for coordinates format
  const formatCoords = (loc) => {
    if (!loc || typeof loc.lat !== "number" || typeof loc.lng !== "number") return null;
    return `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`;
  };

  // Render Login View if not authenticated
  if (!employeeToken || !employee) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
        {/* Background glow ornaments */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-600/30 mb-2">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">GSP Attendance Portal</h1>
            <p className="text-xs text-slate-400 font-medium">Employee Clock In & Attendance System</p>
          </div>

          {loginError && (
            <div className="bg-rose-950/50 border border-rose-900/60 rounded-2xl p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Registered Phone Number</label>
              <input
                required
                type="tel"
                placeholder="Enter 10-digit mobile number"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                value={loginPhone}
                onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
              <input
                required
                type="password"
                placeholder="Enter your login password"
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-violet-600/30 transition duration-150 cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800">
            Powered by Global Service Point (GSP) Management
          </div>
        </div>
      </div>
    );
  }

  // Attendance Status helper
  const isClockedIn = todayData && todayData.status === "clocked_in";
  const isCompleted = todayData && (todayData.status === "completed" || todayData.status === "corrected");
  const notStarted = !todayData;

  const getImgUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const clean = path.replace(/^\//, "");
    return API_BASE ? `${API_BASE}/${clean}` : `/${clean}`;
  };

  const profileImgUrl = getImgUrl(employee?.profilePic);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-violet-600/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight leading-none">GSP ATTENDANCE</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{employee?.employeeId || "EMP"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchMyAttendance(); fetchHistory(); }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-900/40 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        {/* Employee Header Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-violet-500/50 shadow-lg flex items-center justify-center">
                {profileImgUrl ? (
                  <img src={profileImgUrl} alt={employee?.name || "Profile"} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-violet-400">
                    {(employee?.name || "E").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 p-1 rounded-full border-2 border-slate-900">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl font-black text-white">{employee?.name || "Employee"}</h2>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-violet-950/70 text-violet-400 border border-violet-800/60 self-center sm:self-auto">
                  {employee?.employeeId || "EMP"}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{employee?.phone || ""}</p>
              {employee?.address && <p className="text-xs text-slate-400">{employee.address}</p>}
            </div>

            {/* Live Clock Widget */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 text-center sm:text-right w-full sm:w-auto shadow-inner">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center sm:justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-violet-400" />
                <span>{currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="text-2xl font-black text-white font-mono mt-1 tracking-tight">
                {currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Today Attendance / History */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "attendance" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Today's Attendance</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === "history" ? "bg-violet-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Attendance History ({history.length})</span>
          </button>
        </div>

        {actionSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-2xl p-4 text-xs text-emerald-300 flex items-center gap-3 shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="bg-rose-950/60 border border-rose-800/60 rounded-2xl p-4 text-xs text-rose-300 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <span className="font-semibold">{actionError}</span>
          </div>
        )}

        {activeTab === "attendance" ? (
          <div className="space-y-6">
            {/* Status Indicator Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Duty Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isClockedIn 
                    ? "bg-emerald-950/80 text-emerald-400 border border-emerald-700/60 animate-pulse" 
                    : isCompleted 
                    ? "bg-indigo-950/80 text-indigo-400 border border-indigo-700/60" 
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isClockedIn ? "bg-emerald-400" : isCompleted ? "bg-indigo-400" : "bg-slate-400"}`} />
                  {isClockedIn ? "Clocked In (Working)" : isCompleted ? "Shift Completed" : "Not Clocked In"}
                </span>
              </div>

              {/* Time Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Clock In</div>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {todayData?.clockInTime ? new Date(todayData.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                  {formatCoords(todayData?.clockInLocation) && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      {formatCoords(todayData.clockInLocation)}
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Clock Out</div>
                  <div className="text-lg font-black text-white font-mono mt-1">
                    {todayData?.clockOutTime ? new Date(todayData.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </div>
                  {formatCoords(todayData?.clockOutLocation) && (
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                      {formatCoords(todayData.clockOutLocation)}
                    </div>
                  )}
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Working Duration</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-1">
                    {getElapsedDuration()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {isClockedIn ? "Live Timer" : isCompleted ? "Total Hours" : "Not Started"}
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION CARD: CLOCK IN */}
            {notStarted && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-400" />
                    <span>Start Your Working Day</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live selfie and GPS location are required to record your clock-in attendance.
                  </p>
                </div>

                {/* Step 1: Selfie Capture */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Step 1: Take Live Selfie *
                  </label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="hidden"
                    onChange={handleSelfieChange}
                  />

                  {selfiePreview ? (
                    <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                      <img src={selfiePreview} alt="Selfie preview" className="w-20 h-20 rounded-xl object-cover border border-violet-500/50" />
                      <div className="space-y-1.5 flex-1">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selfie Captured</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 cursor-pointer"
                        >
                          Retake Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-700 hover:border-violet-500 bg-slate-950/40 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition text-slate-400 hover:text-white"
                    >
                      <div className="w-12 h-12 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center">
                        <Camera className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-bold">Tap to Open Camera & Take Selfie</span>
                    </button>
                  )}
                </div>

                {/* Step 2: GPS Location */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Step 2: Detect GPS Location *
                  </label>

                  {location && typeof location.lat === "number" && typeof location.lng === "number" ? (
                    <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">
                            Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                          </div>
                          <div className="text-[10px] text-emerald-400">GPS location verified</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={captureLocation}
                        className="text-xs text-violet-400 hover:underline font-bold"
                      >
                        Re-check
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={locationLoading}
                      onClick={captureLocation}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold py-3 px-4 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      {locationLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
                          <span>Acquiring GPS Satellite Signal...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-violet-400" />
                          <span>Fetch Current GPS Location</span>
                        </>
                      )}
                    </button>
                  )}

                  {locationError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{locationError}</span>
                    </p>
                  )}
                </div>

                {/* Clock In Button */}
                <button
                  type="button"
                  disabled={actionLoading || !selfieFile || !location}
                  onClick={handleClockIn}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transition duration-150 cursor-pointer flex items-center justify-center gap-2 text-base tracking-wide"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Recording Clock-In...</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>CLOCK IN NOW</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ACTION CARD: CLOCK OUT */}
            {isClockedIn && (
              <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>You are Clocked In</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ready to complete your shift? Detect your GPS location and clock out.
                  </p>
                </div>

                {/* GPS for Clock Out */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Verify GPS Location for Clock-Out *
                  </label>

                  {location && typeof location.lat === "number" && typeof location.lng === "number" ? (
                    <div className="flex items-center justify-between bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">
                            Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
                          </div>
                          <div className="text-[10px] text-emerald-400">GPS location verified</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={captureLocation}
                        className="text-xs text-violet-400 hover:underline font-bold"
                      >
                        Re-check
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={locationLoading}
                      onClick={captureLocation}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold py-3 px-4 rounded-2xl transition cursor-pointer flex items-center justify-center gap-2 text-xs"
                    >
                      {locationLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>Acquiring GPS Satellite Signal...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span>Fetch Current GPS Location</span>
                        </>
                      )}
                    </button>
                  )}

                  {locationError && (
                    <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{locationError}</span>
                    </p>
                  )}
                </div>

                {/* Clock Out Button */}
                <button
                  type="button"
                  disabled={actionLoading || !location}
                  onClick={handleClockOut}
                  className="w-full bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-xl shadow-rose-600/30 transition duration-150 cursor-pointer flex items-center justify-center gap-2 text-base tracking-wide"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Recording Clock-Out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5" />
                      <span>CLOCK OUT NOW</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {isCompleted && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-600/20 text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white">Attendance Completed for Today</h3>
                  <p className="text-xs text-slate-400">
                    You have successfully clocked in and clocked out for {todayData?.date}.
                  </p>
                </div>

                <div className="inline-flex items-center gap-4 bg-slate-950/60 px-6 py-3 rounded-2xl border border-slate-800 text-sm font-mono">
                  <div>
                    <span className="text-slate-400 text-xs block">IN</span>
                    <strong className="text-white">
                      {todayData?.clockInTime ? new Date(todayData.clockInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </strong>
                  </div>
                  <div className="text-slate-600 font-bold">→</div>
                  <div>
                    <span className="text-slate-400 text-xs block">OUT</span>
                    <strong className="text-white">
                      {todayData?.clockOutTime ? new Date(todayData.clockOutTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </strong>
                  </div>
                  <div className="border-l border-slate-800 pl-4">
                    <span className="text-slate-400 text-xs block">TOTAL</span>
                    <strong className="text-emerald-400">{getElapsedDuration()}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* History Tab */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Recent Attendance Records</h3>

            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                No past attendance records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase bg-slate-950/40">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Clock In</th>
                      <th className="py-3 px-4">Selfie</th>
                      <th className="py-3 px-4">Clock Out</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {history.map((record) => {
                      const inDate = record.clockInTime ? new Date(record.clockInTime) : null;
                      const outDate = record.clockOutTime ? new Date(record.clockOutTime) : null;
                      const selfieUrl = getImgUrl(record.clockInSelfie);

                      const durationText = record.durationMinutes 
                        ? `${Math.floor(record.durationMinutes / 60)}h ${record.durationMinutes % 60}m`
                        : "—";

                      return (
                        <tr key={record._id} className="hover:bg-slate-800/30 transition">
                          <td className="py-3.5 px-4 font-bold text-white font-mono">{record.date}</td>
                          <td className="py-3.5 px-4 font-mono">
                            {inDate && !isNaN(inDate.getTime()) ? inDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            {selfieUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewPhoto(selfieUrl)}
                                className="w-8 h-8 rounded-lg overflow-hidden border border-slate-700 hover:border-violet-500 transition cursor-pointer"
                              >
                                <img src={selfieUrl} alt="Clock-in selfie" className="w-full h-full object-cover" />
                              </button>
                            ) : "—"}
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            {outDate && !isNaN(outDate.getTime()) ? outDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono">
                            {durationText}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              record.status === "completed" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50" :
                              record.status === "clocked_in" ? "bg-amber-950/80 text-amber-400 border border-amber-800/50" :
                              record.status === "corrected" ? "bg-violet-950/80 text-violet-400 border border-violet-800/50" :
                              "bg-slate-800 text-slate-400 border border-slate-700"
                            }`}>
                              {(record.status || "").replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Photo View Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 max-w-sm w-full space-y-3 relative shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Clock-In Selfie Verification</span>
              <button
                onClick={() => setViewPhoto(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={viewPhoto} alt="Clock-in selfie full" className="w-full rounded-2xl object-cover max-h-96" />
          </div>
        </div>
      )}
    </div>
  );
}

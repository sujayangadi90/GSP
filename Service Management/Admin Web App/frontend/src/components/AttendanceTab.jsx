import React from "react";
import { 
  Clock, 
  Calendar, 
  MapPin, 
  Search, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck
} from "lucide-react";

export default function AttendanceTab({
  records = [],
  stats = {},
  employees = [],
  dateFilter = "",
  setDateFilter,
  employeeFilter = "",
  setEmployeeFilter,
  statusFilter = "all",
  setStatusFilter,
  search = "",
  setSearch,
  page = 1,
  setPage,
  onViewMap,
  onViewSelfie,
  onCorrectAttendance,
  loading = false,
  API_BASE
}) {
  const itemsPerPage = 20;

  const filteredRecords = records.filter((rec) => {
    const s = search.toLowerCase().trim();
    const matchesSearch = !s || (
      (rec.employeeName && rec.employeeName.toLowerCase().includes(s)) ||
      (rec.employeeId && rec.employeeId.toLowerCase().includes(s))
    );
    const matchesEmp = !employeeFilter || rec.employeeId === employeeFilter || (rec.employee?._id && rec.employee._id === employeeFilter);
    const matchesStatus = statusFilter === "all" || rec.status === statusFilter;
    return matchesSearch && matchesEmp && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
  const paginatedRecords = filteredRecords.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-emerald-400" />
            <span>Employee Attendance</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Real-time employee clock-in, clock-out, GPS location tracking, and audit log management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            className="bg-slate-900 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono cursor-pointer"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
          />
          <button
            onClick={() => {
              setDateFilter(todayStr);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              dateFilter === todayStr ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Today
          </button>
          {dateFilter && (
            <button
              onClick={() => {
                setDateFilter("");
                setPage(1);
              }}
              className="px-3 py-2 rounded-2xl text-xs font-bold bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              All Dates
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Staff</div>
          <div className="text-2xl font-black text-white font-mono">{stats.totalEmployees || 0}</div>
          <div className="text-[10px] text-slate-500">Active: {stats.activeEmployees || 0}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-violet-400 uppercase tracking-wider">Present</div>
          <div className="text-2xl font-black text-violet-400 font-mono">{stats.presentToday || 0}</div>
          <div className="text-[10px] text-slate-500">For selected date</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Clocked In Now</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{stats.currentlyClockedIn || 0}</div>
          <div className="text-[10px] text-slate-500">Currently on duty</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Completed</div>
          <div className="text-2xl font-black text-indigo-400 font-mono">{stats.completedToday || 0}</div>
          <div className="text-[10px] text-slate-500">Clocked in & out</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Missing Out</div>
          <div className="text-2xl font-black text-rose-400 font-mono">{stats.missingClockOut || 0}</div>
          <div className="text-[10px] text-slate-500">Incomplete shift</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-1">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Not Clocked In</div>
          <div className="text-2xl font-black text-amber-400 font-mono">{stats.notClockedIn || 0}</div>
          <div className="text-[10px] text-slate-500">Absent / Off duty</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col lg:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee Name or Employee ID..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
          {/* Employee Filter */}
          <select
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer w-full sm:w-48"
            value={employeeFilter}
            onChange={(e) => {
              setEmployeeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Employees ({employees.length})</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp.employeeId}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-500 cursor-pointer w-full sm:w-40"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="clocked_in">Clocked In</option>
            <option value="completed">Completed</option>
            <option value="corrected">Corrected</option>
            <option value="missing_clock_out">Missing Clock-Out</option>
          </select>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Clock In</th>
                <th className="py-3.5 px-4">Selfie</th>
                <th className="py-3.5 px-4">Clock Out</th>
                <th className="py-3.5 px-4">Duration</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500 text-xs">
                    {loading ? "Loading attendance records..." : "No attendance logs found for the selected criteria."}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((rec) => {
                  const inDate = rec.clockInTime ? new Date(rec.clockInTime) : null;
                  const outDate = rec.clockOutTime ? new Date(rec.clockOutTime) : null;
                  const selfieUrl = rec.clockInSelfie
                    ? (rec.clockInSelfie.startsWith("http") ? rec.clockInSelfie : `${API_BASE}/${rec.clockInSelfie}`)
                    : null;

                  const durationText = rec.durationMinutes 
                    ? `${Math.floor(rec.durationMinutes / 60)}h ${rec.durationMinutes % 60}m`
                    : (rec.status === "clocked_in" ? "In Progress" : "—");

                  const inLoc = rec.clockInLocation;
                  const outLoc = rec.clockOutLocation;

                  return (
                    <tr key={rec._id} className="hover:bg-slate-800/30 transition">
                      {/* Employee Info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-extrabold text-white text-sm">{rec.employeeName}</div>
                          <div className="text-[11px] text-violet-400 font-mono font-bold">{rec.employeeId}</div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        {rec.date}
                      </td>

                      {/* Clock In */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-white font-bold">
                          {inDate ? inDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </div>
                        {inLoc?.lat ? (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{inLoc.lat.toFixed(4)}, {inLoc.lng.toFixed(4)}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Selfie */}
                      <td className="py-3.5 px-4">
                        {selfieUrl ? (
                          <button
                            type="button"
                            onClick={() => onViewSelfie(selfieUrl)}
                            className="w-9 h-9 rounded-xl overflow-hidden border border-slate-700 hover:border-violet-500 transition cursor-pointer shadow-sm group"
                            title="Click to view full photo"
                          >
                            <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover group-hover:scale-110 transition duration-150" />
                          </button>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Clock Out */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-white font-bold">
                          {outDate ? outDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}
                        </div>
                        {outLoc?.lat ? (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>{outLoc.lat.toFixed(4)}, {outLoc.lng.toFixed(4)}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Duration */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                        {durationText}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rec.status === "completed" ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60" :
                          rec.status === "clocked_in" ? "bg-teal-950/80 text-teal-400 border border-teal-800/60 animate-pulse" :
                          rec.status === "corrected" ? "bg-violet-950/80 text-violet-400 border border-violet-800/60" :
                          rec.status === "missing_clock_out" ? "bg-rose-950/80 text-rose-400 border border-rose-800/60" :
                          "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {rec.status.replace("_", " ")}
                        </span>
                        {rec.isCorrected && (
                          <span className="block text-[9px] text-violet-400 mt-0.5 font-semibold">
                            (Admin Adjusted)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Map Pin Action */}
                          {(inLoc?.lat || outLoc?.lat) && (
                            <button
                              onClick={() => onViewMap(rec)}
                              className="px-2.5 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/40 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              title="View OpenStreetMap Location"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Map</span>
                            </button>
                          )}

                          {/* Correct Attendance Action */}
                          <button
                            onClick={() => onCorrectAttendance(rec)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Correct Attendance / Audit Trail"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredRecords.length > itemsPerPage && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/40 text-xs text-slate-400">
            <span>
              Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 font-mono font-bold text-white">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

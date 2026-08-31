import React, { useState, useEffect } from "react";
import { X, Clock, AlertTriangle, ShieldAlert, History } from "lucide-react";

export default function CorrectAttendanceModal({ isOpen, onClose, attendance, onSaveCorrection, saving }) {
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");
  const [status, setStatus] = useState("completed");
  const [reason, setReason] = useState("");
  const [showAudit, setShowAudit] = useState(false);

  useEffect(() => {
    if (attendance) {
      // Format to datetime-local format YYYY-MM-DDTHH:mm
      const formatDT = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        const pad = (n) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      };

      setInTime(formatDT(attendance.clockInTime));
      setOutTime(formatDT(attendance.clockOutTime));
      setStatus(attendance.status || "completed");
      setReason("");
      setShowAudit(false);
    }
  }, [attendance]);

  if (!isOpen || !attendance) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert("Please provide a reason for correction for the audit trail.");
      return;
    }
    onSaveCorrection({
      id: attendance._id,
      clockInTime: inTime ? new Date(inTime).toISOString() : null,
      clockOutTime: outTime ? new Date(outTime).toISOString() : null,
      status,
      reason: reason.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-amber-600/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Correct Attendance Record</h3>
              <p className="text-xs text-slate-400 font-mono">
                {attendance.employeeName} ({attendance.employeeId}) • {attendance.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-amber-950/40 border border-amber-800/50 rounded-2xl p-3.5 text-xs text-amber-300 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">Admin Audit Trail Policy</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All manual corrections to attendance timestamps are permanently logged with your admin name, previous values, and justification reason.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Clock In Date & Time <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="datetime-local"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                value={inTime}
                onChange={(e) => setInTime(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Clock Out Date & Time
              </label>
              <input
                type="datetime-local"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono"
                value={outTime}
                onChange={(e) => setOutTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Attendance Status
            </label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="completed">Completed</option>
              <option value="clocked_in">Clocked In (Working)</option>
              <option value="corrected">Corrected / Adjusted</option>
              <option value="missing_clock_out">Missing Clock-Out</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Correction Reason (Mandatory for Audit Trail) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Employee forgot to clock out at 6:30 PM due to client on-site visit."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Previous Audit Trail if available */}
          {attendance.corrections && attendance.corrections.length > 0 && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => setShowAudit(!showAudit)}
                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1.5 cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>View Previous Corrections History ({attendance.corrections.length})</span>
              </button>

              {showAudit && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2 text-xs max-h-40 overflow-y-auto">
                  {attendance.corrections.map((corr, idx) => (
                    <div key={idx} className="p-2 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-white">By {corr.correctedBy}</span>
                        <span className="text-slate-500">{new Date(corr.correctedAt).toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] italic">"{corr.reason}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition cursor-pointer"
            >
              {saving ? "Saving Correction..." : "Save Correction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

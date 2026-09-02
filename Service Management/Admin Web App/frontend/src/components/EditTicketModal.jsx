import React, { useState, useEffect } from "react";
import { X, Save, Edit, RefreshCw, User, Phone, MapPin, Package, Shield, Calendar, AlertCircle, CheckCircle2, Upload, DollarSign } from "lucide-react";

export default function EditTicketModal({
  isOpen,
  onClose,
  ticket,
  onSave,
  saving,
  appliances = [],
  brands = [],
  dealers = [],
  technicians = [],
  cities = [],
  API_BASE = ""
}) {
  const [formData, setFormData] = useState(null);
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [invoicePreview, setInvoicePreview] = useState("");

  const safeISOString = (val) => {
    if (!val) return "";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const safeDateString = (val) => {
    if (!val) return "";
    try {
      if (typeof val === "string" && val.includes("T")) {
        return val.split("T")[0];
      }
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (ticket) {
      try {
        const type = ticket.type || "service";
        const currentServiceType = ticket.serviceType || ticket.serviceDetails?.serviceType || "In Warranty";
        const currentInstallationType = ticket.installationType || ticket.installationDetails?.installationType || "Free Installation";
        const currentPriority = ticket.installationDetails?.priority || ticket.serviceDetails?.priority || "medium";

        const rawPrefDate = ticket.preferredVisitDate || ticket.installationDetails?.preferredDate || "";
        const dealerVal = ticket.dealer && typeof ticket.dealer === "object" ? (ticket.dealer._id || "") : (ticket.dealer || "");
        const techVal = ticket.assignedTechnician && typeof ticket.assignedTechnician === "object" ? (ticket.assignedTechnician._id || "") : (ticket.assignedTechnician || "");

        setFormData({
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber || "Ticket",
          type: type,
          // Customer
          customerName: ticket.customer?.name || "",
          customerMobile: ticket.customer?.mobile || "",
          customerAltMobile: ticket.customer?.alternateMobile || "",
          customerAddress: ticket.customer?.address || "",
          customerCity: ticket.customer?.city || "",
          customerPincode: ticket.customer?.pincode || "",
          // Product
          productName: ticket.product?.name || "",
          productCategory: ticket.product?.category || "",
          modelNumber: ticket.product?.modelNumber || "",
          serialNumber: ticket.product?.serialNumber || "",
          invoiceNumber: ticket.product?.invoiceNumber || "",
          purchaseDate: safeDateString(ticket.product?.purchaseDate),
          // Sub-types & Details
          serviceType: currentServiceType,
          installationType: currentInstallationType,
          priority: currentPriority,
          preferredVisitDate: safeISOString(rawPrefDate),
          description: ticket.serviceDetails?.description || "",
          remarks: ticket.remarks || "",
          // Dealer & Tech & Status
          dealer: dealerVal,
          assignedTechnician: techVal,
          status: ticket.status || "new",
          // Fees
          technicianEarning: ticket.technicianEarning !== undefined && ticket.technicianEarning !== null ? ticket.technicianEarning : (ticket.technicianFee !== undefined ? ticket.technicianFee : ""),
          dealerExpense: ticket.dealerExpense !== undefined && ticket.dealerExpense !== null ? ticket.dealerExpense : "",
          customerFee: ticket.customerFee !== undefined && ticket.customerFee !== null ? ticket.customerFee : (type === "installation" ? (ticket.customerInstallationFee ?? ticket.installationFee ?? "") : (ticket.customerServiceFee ?? ticket.serviceFee ?? "")),
          // Invoice
          invoiceImage: ticket.invoiceImage || ""
        });
        setInvoiceFile(null);
        setInvoicePreview("");
      } catch (err) {
        console.error("Error setting up edit form data:", err);
      }
    }
  }, [ticket, isOpen]);

  if (!isOpen || !formData) return null;

  const handleInvoiceChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setInvoiceFile(file);
      try {
        setInvoicePreview(URL.createObjectURL(file));
      } catch {
        setInvoicePreview("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customerName.trim() || !formData.customerMobile.trim()) {
      alert("Customer Name and Mobile Number are required.");
      return;
    }

    const payload = new FormData();
    payload.append("type", formData.type);
    
    // Customer
    payload.append("customer[name]", formData.customerName.trim());
    payload.append("customer[mobile]", formData.customerMobile.trim());
    payload.append("customer[alternateMobile]", formData.customerAltMobile.trim());
    payload.append("customer[address]", formData.customerAddress.trim());
    payload.append("customer[city]", formData.customerCity.trim());
    payload.append("customer[pincode]", formData.customerPincode.trim());

    // Product
    payload.append("product[name]", formData.productName.trim());
    payload.append("product[category]", formData.productCategory.trim());
    payload.append("product[modelNumber]", formData.modelNumber.trim());
    payload.append("product[serialNumber]", formData.serialNumber.trim());
    payload.append("product[invoiceNumber]", formData.invoiceNumber.trim());
    if (formData.purchaseDate) payload.append("product[purchaseDate]", formData.purchaseDate);

    // Types
    if (formData.type === "service") {
      payload.append("serviceType", formData.serviceType);
      payload.append("serviceDetails[serviceType]", formData.serviceType);
      payload.append("serviceDetails[priority]", formData.priority);
      payload.append("serviceDetails[description]", formData.description.trim());
    } else {
      payload.append("installationType", formData.installationType);
      payload.append("installationDetails[installationType]", formData.installationType);
      payload.append("installationDetails[priority]", formData.priority);
    }

    if (formData.preferredVisitDate) {
      payload.append("preferredVisitDate", formData.preferredVisitDate);
    }
    payload.append("remarks", formData.remarks.trim());
    
    if (formData.dealer) payload.append("dealer", formData.dealer);
    else payload.append("dealer", "");

    if (formData.assignedTechnician) payload.append("assignedTechnician", formData.assignedTechnician);
    else payload.append("assignedTechnician", "");

    payload.append("status", formData.status);

    // Fees overrides
    if (formData.technicianEarning !== "") payload.append("technicianEarning", formData.technicianEarning);
    if (formData.dealerExpense !== "") payload.append("dealerExpense", formData.dealerExpense);
    if (formData.customerFee !== "") payload.append("customerFee", formData.customerFee);

    if (invoiceFile) {
      payload.append("invoiceImage", invoiceFile);
    }

    onSave(formData._id, payload);
  };

  const getFullImg = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const clean = path.replace(/^\//, "");
    return API_BASE ? `${API_BASE}/${clean}` : `/${clean}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-850 px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Edit Ticket: <span className="text-violet-400 font-mono">{formData.ticketNumber}</span>
              </h3>
              <p className="text-xs text-slate-400">Update customer details, product scope, assignment & pricing</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(85vh-130px)] overflow-y-auto p-6 space-y-6">
          {/* Section 1: Customer & Venue Details */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Customer & Venue Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Customer Name *
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Primary Mobile *
                </label>
                <input
                  required
                  type="tel"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.customerMobile}
                  onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Alternate Mobile
                </label>
                <input
                  type="tel"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.customerAltMobile}
                  onChange={(e) => setFormData({ ...formData, customerAltMobile: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 cursor-pointer"
                  value={formData.customerCity}
                  onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                >
                  <option value="">-- Choose City --</option>
                  {cities.filter((c) => c.isActive !== false).map((c) => (
                    <option key={c._id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                  {formData.customerCity &&
                    !cities.some(
                      (c) =>
                        c.name &&
                        c.name.trim().toLowerCase() === formData.customerCity.trim().toLowerCase()
                    ) && (
                      <option value={formData.customerCity}>
                        {formData.customerCity}
                      </option>
                    )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Postal Pincode *
                </label>
                <input
                  required
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500 font-mono"
                  value={formData.customerPincode}
                  onChange={(e) => setFormData({ ...formData, customerPincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Product & Scope Details */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span>Product & Scope of Work</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Request Type *
                </label>
                <select
                  required
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="service">Service Request</option>
                  <option value="installation">Installation</option>
                </select>
              </div>

              {formData.type === "service" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Warranty / Billing Subtype
                  </label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  >
                    <option value="In Warranty">In Warranty</option>
                    <option value="Out Warranty">Out Warranty</option>
                    <option value="Paid by Dealer">Paid by Dealer</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Installation Subtype
                  </label>
                  <select
                    className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                    value={formData.installationType}
                    onChange={(e) => setFormData({ ...formData, installationType: e.target.value })}
                  >
                    <option value="Free Installation">Free Installation</option>
                    <option value="Paid Installation">Paid Installation</option>
                    <option value="Paid by Dealer">Paid by Dealer</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Appliance Category
                </label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.productCategory}
                  onChange={(e) => setFormData({ ...formData, productCategory: e.target.value })}
                >
                  <option value="">Select Category...</option>
                  {appliances.map((app) => (
                    <option key={app._id} value={app.name}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Brand / Product Name
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Model Number
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.modelNumber}
                  onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Serial Number
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Invoice Number
                </label>
                <input
                  type="text"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Purchase Date
                </label>
                <input
                  type="date"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Priority Level
                </label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Mid Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Preferred Visit Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.preferredVisitDate}
                  onChange={(e) => setFormData({ ...formData, preferredVisitDate: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Problem / Issue Description
                </label>
                <textarea
                  rows="2"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Dealer / Ticket Remarks
                </label>
                <textarea
                  rows="2"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Assignment & Status Control */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Assignment & Status Control</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Dealer
                </label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.dealer}
                  onChange={(e) => setFormData({ ...formData, dealer: e.target.value })}
                >
                  <option value="">No Dealer (Direct GSP Ticket)</option>
                  {dealers.map((d) => (
                    <option key={d._id} value={d._id}>{d.name} {d.code ? `(${d.code})` : ""}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Assigned Technician
                </label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.assignedTechnician}
                  onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} ({t.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ticket Status
                </label>
                <select
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-violet-500 uppercase font-bold"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="new">NEW (Unassigned)</option>
                  <option value="assigned">ASSIGNED</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="verification_pending">VERIFICATION PENDING</option>
                  <option value="completed">COMPLETED</option>
                  <option value="closed">CLOSED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Fees & Pricing Overrides */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Fee & Expense Overrides (Optional)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Technician Earning (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Auto-calculated from fees"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.technicianEarning}
                  onChange={(e) => setFormData({ ...formData, technicianEarning: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Dealer Expense (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Auto-calculated"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.dealerExpense}
                  onChange={(e) => setFormData({ ...formData, dealerExpense: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Customer Billing Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Auto-calculated"
                  className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-violet-300 font-mono focus:outline-hidden focus:ring-1 focus:ring-violet-500"
                  value={formData.customerFee}
                  onChange={(e) => setFormData({ ...formData, customerFee: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Invoice Attachment */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4">
            <h4 className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4" />
              <span>Invoice Attachment</span>
            </h4>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {(invoicePreview || formData.invoiceImage) && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                  <img
                    src={invoicePreview || getFullImg(formData.invoiceImage)}
                    alt="Invoice"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleInvoiceChange}
                  className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-800 file:text-violet-400 hover:file:bg-slate-700 file:cursor-pointer"
                />
                <p className="text-[11px] text-slate-500">Attach or replace customer purchase invoice document (Image or PDF).</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-violet-600/30 transition cursor-pointer flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Ticket Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Ticket Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

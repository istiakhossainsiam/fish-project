const API_BASE = window.location.port === "5173" ? "http://localhost:8000/api" : "/api";

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to fetch dashboard stats");
  return res.json();
}

export async function fetchPonds() {
  const res = await fetch(`${API_BASE}/ponds`);
  if (!res.ok) throw new Error("Failed to fetch ponds");
  return res.json();
}

export async function createPond(data) {
  const res = await fetch(`${API_BASE}/ponds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create pond");
  return res.json();
}

export async function updatePond(id, data) {
  const res = await fetch(`${API_BASE}/ponds/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update pond");
  return res.json();
}

export async function deletePond(id) {
  const res = await fetch(`${API_BASE}/ponds/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete pond");
  return res.json();
}

// ================= STOCKING =================
export async function fetchStocking() {
  const res = await fetch(`${API_BASE}/stocking`);
  if (!res.ok) throw new Error("Failed to fetch stocking events");
  return res.json();
}

export async function addStocking(data) {
  const res = await fetch(`${API_BASE}/stocking`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to add stocking event");
  return res.json();
}

export async function updateStocking(id, data) {
  const res = await fetch(`${API_BASE}/stocking/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update stocking event");
  return res.json();
}

export async function deleteStocking(id) {
  const res = await fetch(`${API_BASE}/stocking/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete stocking event");
  return res.json();
}

// ================= FEED INVENTORY =================
export async function fetchFeedInventory() {
  const res = await fetch(`${API_BASE}/feed/inventory`);
  if (!res.ok) throw new Error("Failed to fetch feed inventory");
  return res.json();
}

export async function addFeedBatch(data) {
  const res = await fetch(`${API_BASE}/feed/inventory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to add feed batch");
  return res.json();
}

export async function updateFeedBatch(id, data) {
  const res = await fetch(`${API_BASE}/feed/inventory/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update feed batch");
  return res.json();
}

export async function deleteFeedBatch(id) {
  const res = await fetch(`${API_BASE}/feed/inventory/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete feed batch");
  return res.json();
}

// ================= FEED STOCK ADJUSTMENTS & RECONCILIATION =================
export async function fetchFeedAdjustments() {
  const res = await fetch(`${API_BASE}/feed/adjustments`);
  if (!res.ok) throw new Error("Failed to fetch feed adjustments");
  return res.json();
}

export async function addFeedAdjustment(data) {
  const res = await fetch(`${API_BASE}/feed/adjustments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || "Failed to add feed adjustment");
  }
  return res.json();
}

export async function deleteFeedAdjustment(id) {
  const res = await fetch(`${API_BASE}/feed/adjustments/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete feed adjustment");
  return res.json();
}

export async function reconcilePhysicalStock(data) {
  const res = await fetch(`${API_BASE}/feed/reconcile-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || "Failed to reconcile stock");
  }
  return res.json();
}

// ================= DAILY FEEDING =================
export async function fetchDailyFeedings(pondId = null) {
  const url = pondId ? `${API_BASE}/feed/daily?pond_id=${pondId}` : `${API_BASE}/feed/daily`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch daily feedings");
  return res.json();
}

export async function recordDailyFeeding(data) {
  const res = await fetch(`${API_BASE}/feed/daily`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || "Failed to record feeding");
  }
  return res.json();
}

export async function updateDailyFeeding(id, data) {
  const res = await fetch(`${API_BASE}/feed/daily/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || "Failed to update feeding record");
  }
  return res.json();
}

export async function deleteDailyFeeding(id) {
  const res = await fetch(`${API_BASE}/feed/daily/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || "Failed to delete feeding record");
  }
  return res.json();
}

// ================= VAAT TRACKING =================
export async function fetchVaat() {
  const res = await fetch(`${API_BASE}/feed/vaat`);
  if (!res.ok) throw new Error("Failed to fetch vaat logs");
  return res.json();
}

export async function addVaatPrep(data) {
  const res = await fetch(`${API_BASE}/feed/vaat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to add vaat preparation");
  return res.json();
}

// ================= GROWTH SAMPLING =================
export async function fetchGrowth(pondId = null) {
  const url = pondId ? `${API_BASE}/growth?pond_id=${pondId}` : `${API_BASE}/growth`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch growth samplings");
  return res.json();
}

export async function recordGrowth(data) {
  const res = await fetch(`${API_BASE}/growth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to record growth sampling");
  return res.json();
}

export async function updateGrowth(id, data) {
  const res = await fetch(`${API_BASE}/growth/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update growth sampling");
  return res.json();
}

export async function deleteGrowth(id) {
  const res = await fetch(`${API_BASE}/growth/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete growth sampling");
  return res.json();
}

// ================= EXPENSES =================
export async function fetchExpenses(pondId = null, category = null) {
  let url = `${API_BASE}/expenses`;
  const params = new URLSearchParams();
  if (pondId) params.append("pond_id", pondId);
  if (category) params.append("category", category);
  if (params.toString()) url += `?${params.toString()}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch expenses");
  return res.json();
}

export async function addExpense(data) {
  const res = await fetch(`${API_BASE}/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to add expense");
  return res.json();
}

export async function updateExpense(id, data) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update expense");
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${API_BASE}/expenses/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete expense");
  return res.json();
}

// ================= HARVEST =================
export async function fetchHarvest() {
  const res = await fetch(`${API_BASE}/harvest`);
  if (!res.ok) throw new Error("Failed to fetch harvest sales");
  return res.json();
}

export async function recordHarvest(data) {
  const res = await fetch(`${API_BASE}/harvest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to record harvest sale");
  return res.json();
}

export async function updateHarvest(id, data) {
  const res = await fetch(`${API_BASE}/harvest/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update harvest sale");
  return res.json();
}

export async function deleteHarvest(id) {
  const res = await fetch(`${API_BASE}/harvest/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete harvest sale");
  return res.json();
}

// ================= PROFIT & WEATHER =================
export async function fetchProfitAnalysis(targetWeight = 1.2, sellingPrice = 155.0) {
  const res = await fetch(`${API_BASE}/financials/profit-analysis?target_weight_kg=${targetWeight}&selling_price_bdt=${sellingPrice}`);
  if (!res.ok) throw new Error("Failed to fetch profit analysis");
  return res.json();
}

export async function fetchWeather() {
  const res = await fetch(`${API_BASE}/weather`);
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}

export async function workerQuickEntry(data) {
  const res = await fetch(`${API_BASE}/sync/worker-quick-entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.detail || "Failed to submit worker entry");
  }
  return res.json();
}

export async function bulkImportData(data) {
  const res = await fetch(`${API_BASE}/sync/bulk-import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to import bulk sheet");
  return res.json();
}

export async function loginUser(credentials) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Login failed");
  }
  return res.json();
}

export async function fetchUsers() {
  const res = await fetch(`${API_BASE}/auth/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data) {
  const res = await fetch(`${API_BASE}/auth/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create user");
  }
  return res.json();
}

export async function updateUser(id, data) {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update user");
  }
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete user");
  }
  return res.json();
}


export async function fetchCostingReport({ period = "cycle", targetDate = null, startDate = null, endDate = null, pondId = null } = {}) {
  const params = new URLSearchParams();
  if (period) params.append("period", period);
  if (targetDate) params.append("target_date", targetDate);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (pondId) params.append("pond_id", pondId);

  const res = await fetch(`${API_BASE}/reports/costing?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch costing report");
  return res.json();
}

// ================= 6-MONTH CYCLES API =================
export async function fetchCycles(pondId = null, status = null) {
  let url = `${API_BASE}/cycles`;
  const params = new URLSearchParams();
  if (pondId) params.append("pond_id", pondId);
  if (status) params.append("status", status);
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch aquaculture cycles");
  return res.json();
}

export async function createCycle(data) {
  const res = await fetch(`${API_BASE}/cycles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to start new cycle");
  return res.json();
}

export async function endCycle(cycleId, data) {
  const res = await fetch(`${API_BASE}/cycles/${cycleId}/end`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to end cycle");
  return res.json();
}

export async function updateCycle(cycleId, data) {
  const res = await fetch(`${API_BASE}/cycles/${cycleId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update cycle");
  return res.json();
}

export async function deleteCycle(cycleId) {
  const res = await fetch(`${API_BASE}/cycles/${cycleId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete cycle");
  return res.json();
}

// ================= INVESTORS & PROFIT SHARING API =================
export async function fetchInvestors() {
  const res = await fetch(`${API_BASE}/investors`);
  if (!res.ok) throw new Error("Failed to fetch investors");
  return res.json();
}

export async function createInvestor(data) {
  const res = await fetch(`${API_BASE}/investors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to create investor profile");
  return res.json();
}

export async function updateInvestor(id, data) {
  const res = await fetch(`${API_BASE}/investors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update investor profile");
  return res.json();
}

export async function deleteInvestor(id) {
  const res = await fetch(`${API_BASE}/investors/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete investor");
  return res.json();
}

export async function fetchInvestments() {
  const res = await fetch(`${API_BASE}/investments`);
  if (!res.ok) throw new Error("Failed to fetch investments");
  return res.json();
}

export async function createInvestment(data) {
  const res = await fetch(`${API_BASE}/investments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to record investment");
  return res.json();
}

export async function updateInvestment(id, data) {
  const res = await fetch(`${API_BASE}/investments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to update investment");
  return res.json();
}

export async function recordInvestmentPayout(id, data) {
  const res = await fetch(`${API_BASE}/investments/${id}/payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to record investment payout");
  return res.json();
}

export async function deleteInvestment(id) {
  const res = await fetch(`${API_BASE}/investments/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete investment");
  return res.json();
}

export async function simulateInvestorReturns(params = {}) {
  const q = new URLSearchParams();
  if (params.investmentAmount) q.append("investment_amount", params.investmentAmount);
  if (params.cycleId) q.append("cycle_id", params.cycleId);
  if (params.pondId) q.append("pond_id", params.pondId);
  if (params.sharePct) q.append("share_pct", params.sharePct);
  if (params.pangashPrice) q.append("pangash_price_bdt", params.pangashPrice);

  const res = await fetch(`${API_BASE}/investors/simulator?${q.toString()}`);
  if (!res.ok) throw new Error("Failed to simulate returns");
  return res.json();
}


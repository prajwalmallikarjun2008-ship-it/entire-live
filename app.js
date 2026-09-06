// ImpactGuard — Entire Graph Intelligence Engine (Track 2)

const SYMBOL_DATA = {
  "CheckoutService.processPayment": {
    name: "CheckoutService.processPayment",
    file: "services/checkout.ts",
    lines: "42-58",
    kind: "fn",
    blastRadius: 14,
    routesCount: 3,
    coverage: "64% Covered (2 Gaps)",
    risk: "high",
    code: `export async function processPayment(cart: Cart, user: User): Promise<PaymentResult> {
  const verified = await AuthMiddleware.verifyToken(user.token);
  if (!verified) throw new AuthError("Unauthorized");
  
  const total = calculateTotal(cart.items);
  const result = await StripeGateway.charge({ amount: total, user });
  await Database.query("INSERT INTO orders ...", [result.id]);
  return result;
}`,
    nodes: [
      { id: "target", label: "processPayment", kind: "target", x: 220, y: 150 },
      { id: "auth", label: "verifyToken", kind: "caller", x: 80, y: 80 },
      { id: "stripe", label: "StripeGateway.charge", kind: "caller", x: 80, y: 220 },
      { id: "route1", label: "POST /api/v1/checkout", kind: "route", x: 380, y: 70 },
      { id: "route2", label: "POST /api/v1/renew", kind: "route", x: 380, y: 160 },
      { id: "test1", label: "test/checkout.spec.ts", kind: "test", x: 500, y: 70 },
      { id: "test2", label: "test/auth.spec.ts", kind: "test", x: 220, y: 20 }
    ],
    edges: [
      { from: "target", to: "auth" },
      { from: "target", to: "stripe" },
      { from: "route1", to: "target" },
      { from: "route2", to: "target" },
      { from: "test1", to: "route1" },
      { from: "test2", to: "auth" }
    ],
    lineage: [
      { type: "caller", text: "AuthMiddleware.verifyToken", ref: "middleware/auth.ts:18" },
      { type: "caller", text: "StripeGateway.charge", ref: "gateways/stripe.ts:102" },
      { type: "callee", text: "POST /api/v1/checkout", ref: "routes/checkout.route.ts:12" },
      { type: "callee", text: "POST /api/v1/subscriptions/renew", ref: "routes/subscriptions.route.ts:45" },
      { type: "test-link", text: "test/checkout.spec.ts", ref: "test/checkout.spec.ts:15" }
    ]
  },

  "AuthMiddleware.verifyToken": {
    name: "AuthMiddleware.verifyToken",
    file: "middleware/auth.ts",
    lines: "18-35",
    kind: "middleware",
    blastRadius: 28,
    routesCount: 8,
    coverage: "92% Covered",
    risk: "high",
    code: `export async function verifyToken(token: string): Promise<boolean> {
  if (!token) return false;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const session = await Redis.get(\`session:\${decoded.id}\`);
  return Boolean(session);
}`,
    nodes: [
      { id: "target", label: "verifyToken", kind: "target", x: 220, y: 150 },
      { id: "jwt", label: "jwt.verify", kind: "caller", x: 80, y: 100 },
      { id: "redis", label: "Redis.get", kind: "caller", x: 80, y: 200 },
      { id: "route1", label: "ALL Protected Routes", kind: "route", x: 380, y: 150 }
    ],
    edges: [
      { from: "target", to: "jwt" },
      { from: "target", to: "redis" },
      { from: "route1", to: "target" }
    ],
    lineage: [
      { type: "caller", text: "jwt.verify", ref: "node_modules/jsonwebtoken" },
      { type: "caller", text: "Redis.get", ref: "db/redis.ts:14" },
      { type: "callee", text: "Used across 8 Controller routes", ref: "routes/*.ts" }
    ]
  },

  "UserSchema.validate": {
    name: "UserSchema.validate",
    file: "types/user.ts",
    lines: "9-22",
    kind: "type",
    blastRadius: 6,
    routesCount: 2,
    coverage: "100% Covered",
    risk: "med",
    code: `export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'guest'])
});`,
    nodes: [
      { id: "target", label: "UserSchema", kind: "target", x: 220, y: 150 },
      { id: "type1", label: "User Interface", kind: "caller", x: 80, y: 150 },
      { id: "route1", label: "POST /api/v1/users", kind: "route", x: 380, y: 150 }
    ],
    edges: [
      { from: "target", to: "type1" },
      { from: "route1", to: "target" }
    ],
    lineage: [
      { type: "caller", text: "z.object validator", ref: "types/user.ts:9" },
      { type: "callee", text: "POST /api/v1/users", ref: "routes/user.route.ts:10" }
    ]
  },

  "Database.query": {
    name: "Database.query",
    file: "db/connection.ts",
    lines: "88-105",
    kind: "db",
    blastRadius: 42,
    routesCount: 15,
    coverage: "88% Covered",
    risk: "low",
    code: `export async function query<T>(sql: string, params: any[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally { client.release(); }
}`,
    nodes: [
      { id: "target", label: "Database.query", kind: "target", x: 220, y: 150 },
      { id: "pool", label: "pool.connect", kind: "caller", x: 80, y: 150 },
      { id: "services", label: "All Repository Services", kind: "route", x: 380, y: 150 }
    ],
    edges: [
      { from: "target", to: "pool" },
      { from: "services", to: "target" }
    ],
    lineage: [
      { type: "caller", text: "pg.Pool", ref: "db/connection.ts" },
      { type: "callee", text: "Used by 15 Repository methods", ref: "repositories/*.ts" }
    ]
  }
};

let currentSymbolKey = "CheckoutService.processPayment";

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSymbolSelectors();
  renderSymbol(currentSymbolKey);
  initVerificationTrigger();
  initReportCopy();
});

// Tab navigation
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

// Symbol list selection
function initSymbolSelectors() {
  const items = document.querySelectorAll(".symbol-item");
  items.forEach(item => {
    item.addEventListener("click", () => {
      items.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      const key = item.getAttribute("data-symbol");
      renderSymbol(key);
    });
  });

  // Search input filter
  const searchInput = document.getElementById("symbol-search");
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    items.forEach(item => {
      const text = item.innerText.toLowerCase();
      item.style.display = text.includes(term) ? "flex" : "none";
    });
  });
}

// Render selected symbol graph and evidence
function renderSymbol(key) {
  currentSymbolKey = key;
  const data = SYMBOL_DATA[key] || SYMBOL_DATA["CheckoutService.processPayment"];

  // KPI update
  document.getElementById("kpi-symbol-name").innerText = data.name;
  document.getElementById("kpi-blast-radius").innerText = `${data.blastRadius} Nodes Affected`;
  document.getElementById("kpi-affected-routes").innerText = `${data.routesCount} Endpoints`;
  document.getElementById("kpi-test-coverage").innerText = data.coverage;

  // Code snippet update
  document.getElementById("code-preview").innerText = data.code;

  // Lineage update
  const lineageList = document.getElementById("lineage-list");
  lineageList.innerHTML = data.lineage.map(item => `
    <li class="lineage-item">
      <span class="relation-type ${item.type}">${item.type.toUpperCase()}</span>
      <div class="relation-details">
        <span class="node-name">${item.text}</span>
        <span class="source-ref">${item.ref}</span>
      </div>
    </li>
  `).join("");

  // Report update
  updateReportText(data);

  // SVG Graph render
  drawGraphSVG(data);
}

// Draw dynamic graph on SVG canvas
function drawGraphSVG(data) {
  const svg = document.getElementById("graph-svg");
  svg.innerHTML = ""; // Clear canvas

  // Draw edges
  data.edges.forEach(edge => {
    const sourceNode = data.nodes.find(n => n.id === edge.from);
    const targetNode = data.nodes.find(n => n.id === edge.to);
    if (!sourceNode || !targetNode) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", sourceNode.x);
    line.setAttribute("y1", sourceNode.y);
    line.setAttribute("x2", targetNode.x);
    line.setAttribute("y2", targetNode.y);
    line.setAttribute("stroke", "rgba(99, 102, 241, 0.4)");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("stroke-dasharray", "4");
    svg.appendChild(line);
  });

  // Draw nodes
  data.nodes.forEach(node => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("transform", `translate(${node.x}, ${node.y})`);
    group.style.cursor = "pointer";

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("r", node.kind === "target" ? "18" : "14");

    let fill = "#6366F1";
    if (node.kind === "caller") fill = "#38BDF8";
    if (node.kind === "route") fill = "#A855F7";
    if (node.kind === "test") fill = "#10B981";

    circle.setAttribute("fill", fill);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "2");
    if (node.kind === "target") {
      circle.setAttribute("filter", "drop-shadow(0 0 10px rgba(99,102,241,0.8))");
    }

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("y", "28");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "#F8FAFC");
    text.setAttribute("font-size", "11px");
    text.setAttribute("font-family", "JetBrains Mono, monospace");
    text.textContent = node.label;

    group.appendChild(circle);
    group.appendChild(text);

    group.addEventListener("click", () => {
      alert(`Entire Graph Node Selected: ${node.label}\nKind: ${node.kind}\nSource Verification: Linked to line AST node`);
    });

    svg.appendChild(group);
  });
}

// Trigger adjudicated verification
function initVerificationTrigger() {
  const btn = document.getElementById("btn-verify-graph");
  btn.addEventListener("click", () => {
    btn.innerText = "⏳ Executing `entire graph verify`...";
    setTimeout(() => {
      btn.innerText = "⚡ Run Adjudicated Verification (`entire graph verify`)";
      
      // Switch to Adjudication Tab
      document.querySelectorAll(".tab-btn").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      const adjTabBtn = document.querySelector('[data-tab="tab-adjudication"]');
      const adjTabContent = document.getElementById("tab-adjudication");
      
      if (adjTabBtn && adjTabContent) {
        adjTabBtn.classList.add("active");
        adjTabContent.classList.add("active");
      }

      alert("Adjudicated Verification Complete!\nVerdict: 2 passing tests, 1 test gap identified.");
    }, 900);
  });
}

// Copy report
function initReportCopy() {
  const btn = document.getElementById("btn-copy-report");
  const textarea = document.getElementById("report-text");
  btn.addEventListener("click", () => {
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    btn.innerText = "✓ Copied to Clipboard!";
    setTimeout(() => btn.innerText = "📋 Copy Markdown Report", 2000);
  });
}

function updateReportText(data) {
  const report = `## 🛡️ ImpactGuard Audit Report (Entire Graph Intelligence)

- **Target Symbol**: \`${data.name}\`
- **File**: \`${data.file}:${data.lines}\`
- **Blast Radius**: ${data.blastRadius} Nodes | ${data.routesCount} API Endpoints
- **Change Risk Level**: ${data.risk.toUpperCase()}
- **Adjudicated Test Coverage**: ${data.coverage}

### Structural Graph Evidence Lineage
${data.lineage.map(l => `- [${l.type.toUpperCase()}] **${l.text}** (\`${l.ref}\`)`).join("\n")}

*Generated by Entire Graph v0.4.0 (Deterministic No-Egress Engine)*`;

  document.getElementById("report-text").value = report;
}

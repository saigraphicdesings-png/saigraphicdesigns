(() => {
  const run = () => {
    if (location.pathname.endsWith("/admin.html") || location.pathname.endsWith("admin.html")) return;
    const header = document.querySelector(".admin-header");
    if (!header) return;
    const file = location.pathname.split("/").pop() || "";
    const active = file === "admin-customers.html" ? "customers" : file === "admin-payments.html" ? "payments" : file === "admin-analytics.html" ? "analytics" : file === "admin-tasks.html" ? "tasks" : "";
    const navItem = (key, href, icon, label) => `<a class="${active === key ? "nav-active" : ""}" href="${href}">${icon} <span>${label}</span></a>`;
    document.body.classList.add("admin-subpage");
    header.innerHTML = `
      <a class="brand" href="admin.html"><span>SG</span><b>Sai Graphic<br>Designs</b></a>
      <nav class="admin-nav" aria-label="Admin navigation">
        ${navItem("dashboard", "admin.html", "⌘", "Dashboard")}
        ${navItem("products", "admin.html#productForm", "▣", "Products")}
        <p class="nav-label">Management</p>
        ${navItem("customers", "admin-customers.html", "♙", "Customers")}
        ${navItem("tasks", "admin-tasks.html", "✓", "Task Management")}
        ${navItem("payments", "admin-payments.html", "₹", "Payments")}
        ${navItem("analytics", "admin-analytics.html", "↗", "Analytics Report")}
        ${navItem("tools", "admin.html#mockupTitle", "✦", "Design tools")}
      </nav>
      <div class="sidebar-session-actions">
        <p class="nav-label">Quick actions</p>
        <a class="sidebar-btn import-btn" href="admin.html#importBtn">⇩ <span>Import Existing Products</span></a>
        <button class="sidebar-btn" id="sharedRefreshBtn" type="button">↻ <span>Refresh</span></button>
        <button class="sidebar-btn sidebar-logout" id="sharedLogoutBtn" type="button">↗ <span>Log out</span></button>
      </div>
      <div class="header-actions">
        <a class="shop-link" href="shop.html" target="_blank" rel="noopener">View Shop ↗</a>
        <button class="theme-toggle" id="sharedThemeToggle" type="button"><span aria-hidden="true">☾</span><b>Dark</b></button>
      </div>`;
    const root = document.documentElement;
    const theme = document.getElementById("sharedThemeToggle");
    const setTheme = value => {
      root.dataset.theme = value;
      localStorage.setItem("sai-admin-theme", value);
      const dark = value === "dark";
      theme.querySelector("span").textContent = dark ? "☀" : "☾";
      theme.querySelector("b").textContent = dark ? "Light" : "Dark";
      theme.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    };
    setTheme(localStorage.getItem("sai-admin-theme") || "light");
    theme.addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
    document.getElementById("sharedRefreshBtn").addEventListener("click", () => location.reload());
    document.getElementById("sharedLogoutBtn").addEventListener("click", () => {
      sessionStorage.removeItem("saiShopAdminToken");
      location.href = "admin.html";
    });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", run) : run();
})();
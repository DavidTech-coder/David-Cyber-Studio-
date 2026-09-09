// =====================================================
// DAVID CYBER STUDIO - ADMIN DASHBOARD
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    // -------------------------------------------------
    // SUPABASE CHECK
    // -------------------------------------------------

    const supabaseClient = window.supabaseClient;

    if (!supabaseClient) {
        console.error("❌ Supabase client is missing.");
        alert(
            "Supabase is not connected.\n\n" +
            "Make sure supabase.js is loaded before admin.js."
        );
        return;
    }

    console.log("✅ Admin.js connected to Supabase.");

    // -------------------------------------------------
    // ELEMENTS
    // -------------------------------------------------

    const loginScreen = document.getElementById("loginScreen");
    const dashboard = document.getElementById("dashboard");

    const loginForm = document.getElementById("loginForm");
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    const refreshBtn = document.getElementById("refreshBtn");
    const logoutBtn = document.getElementById("logoutBtn");

    const totalCount = document.getElementById("totalCount");
    const newCount = document.getElementById("newCount");
    const reviewingCount = document.getElementById("reviewingCount");
    const progressCount = document.getElementById("progressCount");
    const completedCount = document.getElementById("completedCount");

    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const requestsBody = document.getElementById("requestsBody");

    const requestModal = document.getElementById("requestModal");

    const modalClient = document.getElementById("modalClient");
    const modalEmail = document.getElementById("modalEmail");
    const modalPhone = document.getElementById("modalPhone");
    const modalProject = document.getElementById("modalProject");
    const modalType = document.getElementById("modalType");
    const modalBudget = document.getElementById("modalBudget");
    const modalDeadline = document.getElementById("modalDeadline");
    const modalDescription = document.getElementById("modalDescription");
    const modalStatus = document.getElementById("modalStatus");

    const closeModalBtn = document.getElementById("closeModalBtn");
    const saveStatusBtn = document.getElementById("saveStatusBtn");
    const deleteRequestBtn = document.getElementById("deleteRequestBtn");

    let requests = [];
    let selectedRequestId = null;

    // -------------------------------------------------
    // SCREEN CONTROL
    // -------------------------------------------------

    function showLogin() {
        if (loginScreen) loginScreen.style.display = "flex";
        if (dashboard) dashboard.style.display = "none";
    }

    function showDashboard() {
        if (loginScreen) loginScreen.style.display = "none";
        if (dashboard) dashboard.style.display = "block";
    }

    // -------------------------------------------------
    // LOGIN MESSAGE
    // -------------------------------------------------

    function message(text, success = false) {
        if (!loginMessage) return;

        loginMessage.textContent = text;
        loginMessage.style.color = success ? "#00ff9d" : "#ff5c7a";
    }

    // -------------------------------------------------
    // CHECK ADMIN
    // -------------------------------------------------

    async function verifyAdmin(user) {

        if (!user) return false;

        console.log("Checking admin account:", user.email);

        const { data, error } = await supabaseClient
            .from("admin_users")
            .select("user_id,email")
            .eq("user_id", user.id)
            .maybeSingle();

        if (error) {
            console.error("Admin verification error:", error);
            return false;
        }

        return !!data;
    }

    // -------------------------------------------------
    // LOGIN
    // -------------------------------------------------

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const email = loginEmail.value.trim();
            const password = loginPassword.value;

            if (!email || !password) {
                message("Enter your email and password.");
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = "Signing in...";
            message("Checking account...", true);

            try {

                const { data, error } =
                    await supabaseClient.auth.signInWithPassword({
                        email: email,
                        password: password
                    });

                if (error) {
                    console.error(error);
                    message(error.message);
                    return;
                }

                if (!data.user) {
                    message("Login failed.");
                    return;
                }

                const isAdmin = await verifyAdmin(data.user);

                if (!isAdmin) {

                    await supabaseClient.auth.signOut();

                    message(
                        "This account is not an administrator."
                    );

                    return;
                }

                console.log("✅ Admin login successful.");

                message("Login successful!", true);

                showDashboard();

                await loadRequests();

            } catch (error) {

                console.error("Login error:", error);

                message(
                    "Something went wrong. Check the browser console."
                );

            } finally {

                loginBtn.disabled = false;
                loginBtn.textContent = "Login";

            }

        });

    }

    // -------------------------------------------------
    // LOAD PROJECT REQUESTS
    // -------------------------------------------------

    async function loadRequests() {

        if (!requestsBody) return;

        requestsBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    Loading requests...
                </td>
            </tr>
        `;

        try {

            const { data, error } = await supabaseClient
                .from("project_requests")
                .select("*")
                .order("created_at", {
                    ascending: false
                });

            if (error) {

                console.error("Load requests error:", error);

                requestsBody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align:center;">
                            Failed to load requests.
                        </td>
                    </tr>
                `;

                return;
            }

            requests = data || [];

            console.log(
                `✅ Loaded ${requests.length} project requests.`
            );

            updateStats();

            renderRequests();

        } catch (error) {

            console.error(error);

            requestsBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;">
                        Database error.
                    </td>
                </tr>
            `;

        }
    }

    // -------------------------------------------------
    // UPDATE STATISTICS
    // -------------------------------------------------

    function updateStats() {

        const total = requests.length;

        const newRequests =
            requests.filter(r => r.status === "New").length;

        const reviewing =
            requests.filter(r => r.status === "Reviewing").length;

        const progress =
            requests.filter(r => r.status === "In Progress").length;

        const completed =
            requests.filter(r => r.status === "Completed").length;

        if (totalCount) totalCount.textContent = total;
        if (newCount) newCount.textContent = newRequests;
        if (reviewingCount) reviewingCount.textContent = reviewing;
        if (progressCount) progressCount.textContent = progress;
        if (completedCount) completedCount.textContent = completed;
    }

    // -------------------------------------------------
    // RENDER REQUESTS
    // -------------------------------------------------

    function renderRequests() {

        if (!requestsBody) return;

        const search =
            searchInput
                ? searchInput.value.toLowerCase().trim()
                : "";

        const filter =
            statusFilter
                ? statusFilter.value
                : "All";

        const filtered = requests.filter(request => {

            const searchableText = `
                ${request.name || ""}
                ${request.email || ""}
                ${request.project_name || ""}
                ${request.project_type || ""}
            `.toLowerCase();

            const matchesSearch =
                !search ||
                searchableText.includes(search);

            const matchesStatus =
                filter === "All" ||
                request.status === filter;

            return matchesSearch && matchesStatus;

        });

        if (filtered.length === 0) {

            requestsBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align:center;">
                        No project requests found.
                    </td>
                </tr>
            `;

            return;
        }

        requestsBody.innerHTML = filtered.map(request => {

            const date = request.created_at
                ? new Date(request.created_at)
                    .toLocaleString()
                : "—";

            return `
                <tr>

                    <td>
                        ${escapeHTML(request.name)}
                    </td>

                    <td>
                        ${escapeHTML(request.email)}
                    </td>

                    <td>
                        ${escapeHTML(request.project_name)}
                    </td>

                    <td>
                        ${escapeHTML(request.project_type)}
                    </td>

                    <td>
                        ${escapeHTML(request.budget || "—")}
                    </td>

                    <td>
                        ${date}
                    </td>

                    <td>
                        <span class="status ${getStatusClass(request.status)}">
                            ${escapeHTML(request.status)}
                        </span>
                    </td>

                    <td>
                        <button
                            class="view-btn"
                            data-id="${request.id}">
                            View
                        </button>
                    </td>

                </tr>
            `;

        }).join("");
    }

    // -------------------------------------------------
    // ESCAPE HTML
    // -------------------------------------------------

    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // -------------------------------------------------
    // STATUS CLASS
    // -------------------------------------------------

    function getStatusClass(status) {

        return String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");
    }

    // -------------------------------------------------
    // OPEN REQUEST
    // -------------------------------------------------

    function openRequest(request) {

        if (!requestModal) return;

        selectedRequestId = request.id;

        modalClient.value =
            request.name || "";

        modalEmail.value =
            request.email || "";

        modalPhone.value =
            request.phone || "";

        modalProject.value =
            request.project_name || "";

        modalType.value =
            request.project_type || "";

        modalBudget.value =
            request.budget || "";

        modalDeadline.value =
            request.deadline || "";

        modalDescription.value =
            request.description || "";

        modalStatus.value =
            request.status || "New";

        requestModal.style.display = "flex";
    }

    // -------------------------------------------------
    // VIEW BUTTONS
    // -------------------------------------------------

    if (requestsBody) {

        requestsBody.addEventListener("click", event => {

            const button =
                event.target.closest(".view-btn");

            if (!button) return;

            const id = button.dataset.id;

            const request =
                requests.find(r => r.id === id);

            if (request) {
                openRequest(request);
            }

        });

    }

    // -------------------------------------------------
    // CLOSE MODAL
    // -------------------------------------------------

    function closeModal() {

        selectedRequestId = null;

        if (requestModal) {
            requestModal.style.display = "none";
        }

    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener(
            "click",
            closeModal
        );
    }

    if (requestModal) {

        requestModal.addEventListener("click", event => {

            if (event.target === requestModal) {
                closeModal();
            }

        });

    }

    // -------------------------------------------------
    // SAVE STATUS
    // -------------------------------------------------

    if (saveStatusBtn) {

        saveStatusBtn.addEventListener(
            "click",
            async () => {

                if (!selectedRequestId) {
                    alert("No request selected.");
                    return;
                }

                const newStatus =
                    modalStatus.value;

                saveStatusBtn.disabled = true;
                saveStatusBtn.textContent = "Saving...";

                try {

                    const { error } =
                        await supabaseClient
                            .from("project_requests")
                            .update({
                                status: newStatus
                            })
                            .eq(
                                "id",
                                selectedRequestId
                            );

                    if (error) {

                        console.error(error);

                        alert(
                            "Could not update request."
                        );

                        return;
                    }

                    console.log(
                        "✅ Request status updated."
                    );

                    closeModal();

                    await loadRequests();

                } catch (error) {

                    console.error(error);

                    alert(
                        "Database error while saving."
                    );

                } finally {

                    saveStatusBtn.disabled = false;
                    saveStatusBtn.textContent = "Save Status";

                }

            }
        );

    }

    // -------------------------------------------------
    // DELETE REQUEST
    // -------------------------------------------------

    if (deleteRequestBtn) {

        deleteRequestBtn.addEventListener(
            "click",
            async () => {

                if (!selectedRequestId) {
                    alert("No request selected.");
                    return;
                }

                const confirmed =
                    confirm(
                        "Are you sure you want to delete this project request?"
                    );

                if (!confirmed) return;

                deleteRequestBtn.disabled = true;
                deleteRequestBtn.textContent = "Deleting...";

                try {

                    const { error } =
                        await supabaseClient
                            .from("project_requests")
                            .delete()
                            .eq(
                                "id",
                                selectedRequestId
                            );

                    if (error) {

                        console.error(error);

                        alert(
                            "Could not delete request."
                        );

                        return;
                    }

                    console.log(
                        "✅ Request deleted."
                    );

                    closeModal();

                    await loadRequests();

                } catch (error) {

                    console.error(error);

                    alert(
                        "Database error while deleting."
                    );

                } finally {

                    deleteRequestBtn.disabled = false;
                    deleteRequestBtn.textContent = "Delete Request";

                }

            }
        );

    }

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            renderRequests
        );

    }

    // -------------------------------------------------
    // FILTER
    // -------------------------------------------------

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderRequests
        );

    }

    // -------------------------------------------------
    // REFRESH
    // -------------------------------------------------

    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                refreshBtn.disabled = true;

                await loadRequests();

                refreshBtn.disabled = false;

            }
        );

    }

    // -------------------------------------------------
    // LOGOUT
    // -------------------------------------------------

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            async () => {

                await supabaseClient.auth.signOut();

                showLogin();

                loginForm?.reset();

                message("");

            }
        );

    }

    // -------------------------------------------------
    // CHECK EXISTING SESSION
    // -------------------------------------------------

    async function checkSession() {

        try {

            const {
                data: {
                    session
                }
            } = await supabaseClient.auth.getSession();

            if (!session) {

                console.log(
                    "No active session."
                );

                showLogin();

                return;
            }

            console.log(
                "Existing session found."
            );

            const isAdmin =
                await verifyAdmin(
                    session.user
                );

            if (!isAdmin) {

                await supabaseClient.auth.signOut();

                showLogin();

                message(
                    "This account is not an administrator."
                );

                return;
            }

            showDashboard();

            await loadRequests();

        } catch (error) {

            console.error(
                "Session check failed:",
                error
            );

            showLogin();

        }

    }

    // -------------------------------------------------
    // AUTH STATE CHANGES
    // -------------------------------------------------

    supabaseClient.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Auth event:",
                event
            );

            if (event === "SIGNED_OUT") {

                showLogin();

                return;
            }

            if (
                event === "SIGNED_IN" &&
                session
            ) {

                const isAdmin =
                    await verifyAdmin(
                        session.user
                    );

                if (isAdmin) {

                    showDashboard();

                    await loadRequests();

                } else {

                    await supabaseClient.auth.signOut();

                    showLogin();

                    message(
                        "You are not authorized."
                    );

                }

            }

        }
    );

    // -------------------------------------------------
    // START
    // -------------------------------------------------

    showLogin();

    await checkSession();

});
/**
 * MZO Reports - Auth System 
 * Handles login, session management and hierarchical access control.
 */

const AUTH_SHEET_URL = "https://docs.google.com/spreadsheets/d/1GtWgPMm-WeDNfebubp5ac76waeZGESA2bQ8JkEpHlZ4/export?format=csv&gid=0";

// --- Login Logic ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username');
        const pinInput = document.getElementById('pin');
        const loginBtn = document.getElementById('loginBtn');
        const btnText = document.getElementById('btnText');
        const loader = document.getElementById('loader');
        const errorMsg = document.getElementById('errorMsg');

        const userVal = usernameInput.value.trim();
        const pinVal = pinInput.value.trim();

        // UI Loading state
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        loader.style.display = 'block';
        errorMsg.style.display = 'none';

        try {
            const users = await fetchUsers();
            const user = users.find(u => u.Username === userVal && u.PIN === pinVal);

            if (user) {
                // Success! Store user profile (excluding sensitive/ignored fields)
                const userProfile = {
                    username: user.Username,
                    name: user.Name,
                    role: user.role,
                    zone: user.zone_code,
                    region: user.region_code,
                    division: user.division_code,
                    ccc: user.ccc_code,
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('mzo_user', JSON.stringify(userProfile));

                // Redirect to main page
                window.location.href = 'index.html';
            } else {
                throw new Error("Invalid credentials");
            }
        } catch (error) {
            console.error("Login failed:", error);
            errorMsg.textContent = error.message === "Invalid credentials" ? "Invalid Username or PIN" : "System error. Try again later.";
            errorMsg.style.display = 'block';

            // Re-enable button
            loginBtn.disabled = false;
            btnText.style.display = 'block';
            loader.style.display = 'none';
        }
    });
}

/**
 * Fetches the user list from Google Sheets
 */
async function fetchUsers() {
    return new Promise((resolve, reject) => {
        Papa.parse(AUTH_SHEET_URL, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err)
        });
    });
}


// --- Session Support Functions ---

/**
 * Check if user is logged in
 */
function checkSession() {
    const user = getUser();
    if (!user && !window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * Get current user object
 */
function getUser() {
    const data = localStorage.getItem('mzo_user');
    return data ? JSON.parse(data) : null;
}

/**
 * Logout
 */
function logout() {
    localStorage.removeItem('mzo_user');
    window.location.href = 'login.html';
}

/**
 * Apply hierarchical filtering to any page
 */
function applyAccessControl() {
    const user = getUser();
    if (!user) return;

    console.log("Applying access control for:", user.name, "Role:", user.role);

    // If role is Admin, usually has full access
    if (user.role && user.role.toLowerCase() === 'admin') {
        return;
    }

    // Example logic for index.html card filtering:
    // If user has a specific division_code, we might want to hide 
    // comparative reports or show only division-specific tools.
    // This part is expanded in index.html logic.
}

// Exposure for global use
window.MZO_AUTH = {
    checkSession,
    getUser,
    logout,
    applyAccessControl
};

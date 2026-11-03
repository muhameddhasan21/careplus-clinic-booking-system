
// =========================
// 1. Supabase Configuration
// =========================

const SUPABASE_URL = "https://haersavpmyjsjwjpmikc.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fSG_l9T7eE2gFNHWhO7MKw_h3ha-K3m";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// =========================
// 2. Login Elements
// =========================

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");


// =========================
// 3. Admin Login
// =========================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const loginButton = loginForm.querySelector("button");

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    loginMessage.textContent = "";
    loginMessage.style.color = "";

    try {

        // Step 1: Authenticate user

        const { data, error } =
            await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {
            throw error;
        }


        // Step 2: Check admin permission

        const { data: isAdmin, error: roleError } =
            await supabaseClient.rpc("is_admin");

        if (roleError) {
            throw roleError;
        }


        // Step 3: Allow admins only

        if (!isAdmin) {

            await supabaseClient.auth.signOut();

            loginMessage.textContent =
                "Access denied. You are not an admin.";

            loginMessage.style.color = "#dc3545";

            return;
        }


        // Step 4: Successful login

        loginMessage.textContent =
            "Admin verified successfully!";

        loginMessage.style.color = "#21834a";

        // Redirect to Dashboard

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 1000);


    } catch (error) {

        console.error("Login error:", error);

        loginMessage.textContent = error.message;

        loginMessage.style.color = "#dc3545";

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

    }

});


// =========================
// 4. Forgot Password
// =========================

const forgotPasswordLink = document.getElementById("forgot-password");

forgotPasswordLink.addEventListener("click", async function (event) {

    event.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {

        loginMessage.textContent =
            "Please enter your email address first.";

        loginMessage.style.color = "#dc3545";

        return;
    }

    forgotPasswordLink.textContent = "Sending...";

    const { error } = await supabaseClient.auth.resetPasswordForEmail(
        email,
        {
            redirectTo: window.location.origin + "/admin/reset-password.html"
        }
    );

    if (error) {

        console.error("Password reset error:", error);

        loginMessage.textContent = error.message;

        loginMessage.style.color = "#dc3545";

    } else {

        loginMessage.textContent =
            "Password reset email sent! Please check your inbox.";

        loginMessage.style.color = "#21834a";

    }

    forgotPasswordLink.textContent = "Forgot Password?";

});

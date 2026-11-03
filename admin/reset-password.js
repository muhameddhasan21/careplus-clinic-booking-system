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
// 2. Reset Password Elements
// =========================

const resetForm = document.getElementById("reset-password-form");

const newPasswordInput = document.getElementById("new-password");

const confirmPasswordInput = document.getElementById("confirm-password");

const resetMessage = document.getElementById("reset-message");


// =========================
// 3. Update Password
// =========================

resetForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const submitButton = resetForm.querySelector("button");

    resetMessage.textContent = "";

    // Check password length

    if (newPassword.length < 8) {

        resetMessage.textContent =
            "Password must be at least 8 characters.";

        resetMessage.style.color = "#dc3545";

        return;
    }

    // Check password confirmation

    if (newPassword !== confirmPassword) {

        resetMessage.textContent =
            "Passwords do not match.";

        resetMessage.style.color = "#dc3545";

        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Updating...";

    try {

        // Update password in Supabase

        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw error;
        }

        resetMessage.textContent =
            "Password updated successfully! Redirecting to login...";

        resetMessage.style.color = "#21834a";

        resetForm.reset();

        setTimeout(function () {

            window.location.href = "index.html";

        }, 2000);

    } catch (error) {

        console.error("Password update error:", error);

        resetMessage.textContent =
            error.message || "Unable to update password.";

        resetMessage.style.color = "#dc3545";

        submitButton.disabled = false;
        submitButton.textContent = "Update Password";

    }

});
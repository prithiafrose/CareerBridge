document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "/api/auth";
  const resetForm = document.getElementById("resetForm");
  const codeForm = document.getElementById("resetCodeForm");
  const emailLabel = document.getElementById("resetEmailLabel");

  let resetEmail = "";

  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = resetForm.email.value.trim();
    const error = document.getElementById("resetError");
    const loading = document.getElementById("resetLoading");

    error.textContent = "";
    loading.textContent = "Sending reset code...";

    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      loading.textContent = "";

      if (!res.ok) throw new Error(data.error || "Failed to send reset code");

      resetEmail = email;
      emailLabel.textContent = email;
      resetForm.style.display = "none";
      codeForm.style.display = "block";
      codeForm.resetCode.focus();
    } catch (err) {
      loading.textContent = "";
      error.style.color = "red";
      error.textContent = err.message;
    }
  });

  codeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const code = codeForm.resetCode.value.trim();
    const newPassword = codeForm.newPassword.value;
    const confirmPassword = codeForm.confirmPassword.value;
    const error = document.getElementById("codeError");
    const loading = document.getElementById("codeLoading");

    error.textContent = "";

    if (!code || !newPassword) {
      error.style.color = "red";
      error.textContent = "Code and new password are required";
      return;
    }

    if (newPassword.length < 6) {
      error.style.color = "red";
      error.textContent = "Password must be at least 6 characters";
      return;
    }

    if (newPassword !== confirmPassword) {
      error.style.color = "red";
      error.textContent = "Passwords do not match";
      return;
    }

    loading.textContent = "Resetting password...";

    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail, code, newPassword })
      });

      const data = await res.json();
      loading.textContent = "";

      if (!res.ok) throw new Error(data.error || "Failed to reset password");

      error.style.color = "green";
      error.textContent = "Password updated successfully! Redirecting to login...";
      codeForm.querySelector("button[type='submit']").disabled = true;

      setTimeout(() => {
        window.location.href = "Login.html";
      }, 2000);
    } catch (err) {
      loading.textContent = "";
      error.style.color = "red";
      error.textContent = err.message;
    }
  });

  document.getElementById("backToEmail").addEventListener("click", () => {
    codeForm.style.display = "none";
    resetForm.style.display = "block";
    document.getElementById("resetError").textContent = "";
    document.getElementById("codeError").textContent = "";
    document.getElementById("codeLoading").textContent = "";
  });
});
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

function getAuthMessage(error) {
  const code = error?.code || "";

  if (code === "auth/invalid-credential") return "Email or password is incorrect.";
  if (code === "auth/user-not-found") return "No account was found for that email.";
  if (code === "auth/wrong-password") return "Email or password is incorrect.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/network-request-failed") return "Network issue detected. Check your connection and try again.";

  return error?.message || "Unable to sign in right now.";
}

function getResetMessage(error) {
  const code = error?.code || "";

  if (code === "auth/missing-email") return "Enter your email first so we know where to send the reset link.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/user-not-found") return "No account was found for that email.";
  if (code === "auth/too-many-requests") return "Too many reset attempts. Please wait a bit and try again.";
  if (code === "auth/network-request-failed") return "Network issue detected. Check your connection and try again.";

  return error?.message || "Unable to send a password reset email right now.";
}

function Login() {
  const navigate = useNavigate();
  const { login, resetPassword } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setError("Enter your email and password to continue.");
      setSuccess("");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await login(form.email.trim(), form.password);
      navigate("/app");
    } catch (err) {
      setError(getAuthMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!form.email.trim()) {
      setError("Enter your email first so we can send the reset link there.");
      setSuccess("");
      return;
    }

    setResetLoading(true);
    setError("");
    setSuccess("");

    try {
      await resetPassword(form.email.trim());
      setSuccess(`Password reset email sent to ${form.email.trim()}. Check your inbox and spam folder.`);
    } catch (err) {
      setError(getResetMessage(err));
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-layout">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">Sign in</p>
          <h1>Welcome back</h1>

          <div className="auth-form-grid">
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </div>

          <div className="auth-inline-action">
            <button
              type="button"
              className="auth-link-button"
              onClick={handleForgotPassword}
              disabled={resetLoading}
            >
              {resetLoading ? "Sending reset link..." : "Forgot password?"}
            </button>
          </div>

          {error && <div className="error-banner">{error}</div>}
          {success && <div className="success-banner">{success}</div>}

          <button type="submit">{loading ? "Signing in..." : "Sign in"}</button>

          <p className="auth-switch">
            New here? <Link to="/register">Create account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;

import { Link } from "react-router-dom";
import logoImage from "../assets/logo.jpeg";

function Splash() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-copy">
          <div className="landing-logo-wrap">
            <img src={logoImage} alt="Roamio logo" className="landing-logo" />
          </div>
          <p className="eyebrow">Roamio</p>
          <h1>Travel, simplified.</h1>
          <p className="landing-text">Plan better routes, save places, and move lightly.</p>
          <div className="landing-actions">
            <Link className="primary-link" to="/register">
              Create account
            </Link>
            <Link className="secondary-link" to="/login">
              Sign in
            </Link>
          </div>
        </div>

        <div className="landing-showcase">
          <article className="hero-card accent-card landing-minimal-card">
            <span>travel safe</span>
            <strong>AI planning, map, chat, and matching in one calm space.</strong>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Splash;

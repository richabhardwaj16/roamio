import { useEffect, useMemo, useState } from "react";
import logoImage from "../assets/logo.jpeg";
import splashImage from "../assets/splash.jpeg";
import Splash from "./Splash";

function IntroSplash() {
  const [percent, setPercent] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [displayText, setDisplayText] = useState("");

  const fullText = "Your trip, your vibe.";
  const angle = useMemo(() => `${percent * 3.6 - 90}deg`, [percent]);
  const loadingText = useMemo(() => {
    if (percent < 40) {
      return "Analyzing your travel DNA...";
    }

    if (percent < 80) {
      return "Finding your tribe...";
    }

    return "Welcome to Roamio.";
  }, [percent]);

  useEffect(() => {
    if (phase !== "loading") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setPercent((current) => {
        if (current >= 100) {
          window.clearInterval(interval);
          window.setTimeout(() => setPhase("brand"), 600);
          return 100;
        }

        return current + 2;
      });
    }, 40);

    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== "brand") {
      return undefined;
    }

    let index = 0;
    const typingInterval = window.setInterval(() => {
      setDisplayText(fullText.slice(0, index));
      index += 1;

      if (index > fullText.length) {
        window.clearInterval(typingInterval);
        window.setTimeout(() => setPhase("complete"), 2200);
      }
    }, 60);

    return () => window.clearInterval(typingInterval);
  }, [fullText, phase]);

  if (phase === "complete") {
    return <Splash />;
  }

  return (
    <div
      className={`intro-splash intro-splash-photo ${phase === "brand" ? "intro-brand-phase" : ""}`}
      style={{
        backgroundImage: `linear-gradient(rgba(11, 19, 32, 0.72), rgba(11, 19, 32, 0.84)), url(${splashImage})`,
      }}
    >
      {phase === "loading" && (
        <div className="intro-loader-stage">
          <div className="intro-progress-shell">
            <div className="intro-progress-circle">
              <span className="intro-percent">{percent}%</span>
            </div>
            <div className="intro-orbit" style={{ transform: `rotate(${angle})` }}>
              <div className="intro-plane">✈</div>
            </div>
            <span className="intro-sparkle intro-sparkle-one" />
            <span className="intro-sparkle intro-sparkle-two" />
            <span className="intro-sparkle intro-sparkle-three" />
          </div>
          <p className="intro-loading-text">{loadingText}</p>
        </div>
      )}

      {phase === "brand" && (
        <>
          <div className="intro-brand-shell">
            <div className="intro-logo">
              <img src={logoImage} alt="Roamio logo" className="brand-image" />
              <span className="intro-sweep" />
            </div>
            <h1 className="intro-title">Roamio</h1>
            <p className="intro-tagline">{displayText}</p>
          </div>
        </>
      )}
    </div>
  );
}

export default IntroSplash;

import { useEffect, useRef, useState } from "react";

const SPLASH_VIDEO_SRC = "/STGP%20ANIMATION.mp4";
const SPLASH_FALLBACK_MS = 9000;

export default function SplashScreen({ onDone }) {
  const videoRef = useRef(null);
  const finishedRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fallbackTimer = window.setTimeout(() => {
      finishSplash();
    }, SPLASH_FALLBACK_MS);

    const video = videoRef.current;
    if (video) {
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          finishSplash();
        });
      }
    }

    return () => window.clearTimeout(fallbackTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finishSplash = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLeaving(true);
    window.setTimeout(() => {
      onDone?.();
    }, 320);
  };

  return (
    <div className={`app-splash${leaving ? " app-splash--leaving" : ""}`} aria-hidden="true">
      <video
        ref={videoRef}
        className="app-splash__video"
        src={SPLASH_VIDEO_SRC}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={finishSplash}
      />
    </div>
  );
}

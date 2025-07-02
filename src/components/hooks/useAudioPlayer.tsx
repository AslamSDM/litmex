"use client";

import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
  volume?: number;
  playOnMount?: boolean;
}

export const useAudioPlayer = ({
  src,
  volume = 0.2,
  playOnMount = false,
}: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Create audio element if we're in browser environment
    if (typeof window !== "undefined") {
      audioRef.current = new Audio(src);
      audioRef.current.volume = volume;
      audioRef.current.preload = "auto";

      // When audio is loaded and ready to play
      audioRef.current.addEventListener("canplaythrough", () => {
        setIsReady(true);

        if (playOnMount) {
          audioRef.current?.play().catch((error) => {
            // This is often due to browser autoplay policy
            console.log("Error auto-playing audio:", error);
          });
        }
      });

      // Clean up
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
      };
    }
  }, [src, volume, playOnMount]);

  const play = () => {
    if (audioRef.current && isReady) {
      // Reset to start if already finished
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }

      audioRef.current.play().catch((error) => {
        console.log("Error playing audio:", error);
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const setAudioVolume = (newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, newVolume));
    }
  };

  return {
    play,
    pause,
    stop,
    setVolume: setAudioVolume,
    isReady,
    audioRef,
  };
};

export default useAudioPlayer;

'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  targetDate: string;
  onExpire?: () => void;
  clockOffsetMs?: number;
}

export default function Timer({ targetDate, onExpire, clockOffsetMs = 0 }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    hasExpiredRef.current = false;

    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - (Date.now() + clockOffsetMs);

      if (difference <= 0) {
        setTimeLeft('Transicionando');

        if (!hasExpiredRef.current && onExpire) {
          hasExpiredRef.current = true;
          onExpire();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [clockOffsetMs, targetDate, onExpire]);

  return <span className="font-mono text-yellow-400">{timeLeft}</span>;
}

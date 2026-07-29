'use client';

import { useState, useEffect } from 'react';

interface TimerProps {
  targetDate: string;
  onExpire?: () => void;
}

export default function Timer({ targetDate, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    let isRetrying = false;

    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setTimeLeft('Transicionando');
        
        // Quando zerar, avisa o pai imediatamente e tenta de segundo em segundo até atualizar
        if (!isRetrying && onExpire) {
          isRetrying = true;
          onExpire();
          
          const retryInterval = setInterval(() => {
            onExpire();
          }, 1000);

          return () => clearInterval(retryInterval);
        }
        return;
      }

      isRetrying = false;

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
  }, [targetDate, onExpire]);

  return <span className="font-mono text-yellow-400">{timeLeft}</span>;
}
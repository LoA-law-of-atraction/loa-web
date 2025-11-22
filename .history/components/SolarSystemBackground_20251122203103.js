"use client";

import { useEffect, useRef } from "react";

const SolarSystemBackground = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const scale = 1.3;
    const coreSize = 40.0 * scale;

    // Planet sizes
    const orbSizes = [8, 12, 12, 10, 22, 20, 16, 16].map((s) => s * scale);

    // Calculate orbit radii with proper spacing
    const baseRadius = 45.0;
    const minGap = 18.0;
    const gap = minGap * scale;
    const orbitRadii = [];
    for (let i = 0; i < orbSizes.length; i++) {
      if (i === 0) {
        orbitRadii.push(baseRadius * scale);
      } else {
        const prev = i - 1;
        const nextRadius =
          orbitRadii[prev] + (orbSizes[prev] + orbSizes[i]) / 2.0 + gap;
        orbitRadii.push(nextRadius);
      }
    }

    // Orbital speeds (relative to Earth)
    const orbitSpeeds = [4.17, 1.62, 1.0, 0.53, 0.084, 0.034, 0.012, 0.006];

    // Planet colors
    const planetColors = [
      "#8C7853", // Mercury
      "#FFC649", // Venus
      "#4A90E2", // Earth
      "#E74C3C", // Mars
      "#F39C12", // Jupiter
      "#E6C79C", // Saturn
      "#4FD0E7", // Uranus
      "#4166F5", // Neptune
    ];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
    };

    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Expand orbit radii
      const viewportWidth = width;
      const refIndex = orbitRadii.length > 3 ? 3 : orbitRadii.length - 1;
      const currentRef = orbitRadii[refIndex];
      const lastOriginal = orbitRadii[orbitRadii.length - 1];
      const desiredRefReach = viewportWidth * 0.75;
      const desiredLastReach = viewportWidth * 1.6;
      const sA = currentRef > 0 ? desiredRefReach / currentRef : 1.0;
      const sB = lastOriginal > 0 ? desiredLastReach / lastOriginal : 1.0;
      const orbitStretch = Math.max(Math.max(sA, sB), 1.0, 3.0);
      
      const stretchedRadii = orbitRadii.map((r) => r * orbitStretch);

      const centerX = width / 2;
      const centerY = height / 2;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Time-based animation
      timeRef.current += 16.67; // ~60fps
      const time = timeRef.current;
      const baseAngle = time * 0.0005;
      const pulseValue = Math.sin(time * 0.0015) * 0.5 + 0.5;
      const corePulseSize = coreSize + pulseValue * 8 * scale;
      const orbitSpeedBoost = 3.0;

      // Draw orbit rings
      stretchedRadii.forEach((radius) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Draw sun with glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        corePulseSize * 2
      );
      gradient.addColorStop(0, "rgba(255, 165, 0, 0.8)");
      gradient.addColorStop(0.3, "rgba(255, 200, 0, 0.6)");
      gradient.addColorStop(0.6, "rgba(255, 165, 0, 0.3)");
      gradient.addColorStop(1, "rgba(255, 165, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulseSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Draw sun core
      ctx.fillStyle = "#FFA500";
      ctx.shadowBlur = 30 * scale;
      ctx.shadowColor = "rgba(255, 165, 0, 0.8)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, corePulseSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw planets
      stretchedRadii.forEach((radius, i) => {
        const angle = baseAngle * orbitSpeeds[i] * orbitSpeedBoost + i * 1.5;
        const px = centerX + radius * Math.cos(angle);
        const py = centerY + radius * Math.sin(angle);
        const planetScale = 1.0 + Math.sin(time * 0.004 + i) * 0.08;
        const size = (orbSizes[i] * planetScale) / 2;

        // Planet glow
        const glowGradient = ctx.createRadialGradient(px, py, 0, px, py, size * 2);
        glowGradient.addColorStop(0, planetColors[i] + "80");
        glowGradient.addColorStop(0.5, planetColors[i] + "40");
        glowGradient.addColorStop(1, planetColors[i] + "00");

        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(px, py, size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Planet body
        ctx.fillStyle = planetColors[i];
        ctx.shadowBlur = i === 4 || i === 5 ? 16 : 12;
        ctx.shadowColor = planetColors[i];
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default SolarSystemBackground;

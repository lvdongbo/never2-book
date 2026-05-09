"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface HandwritingCanvasProps {
  onDataChange: (dataUrl: string | null) => void;
  initialData?: string;
  height?: number;
}

interface Stroke {
  points: { x: number; y: number }[];
}

export default function HandwritingCanvas({
  onDataChange,
  initialData,
  height = 200,
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasContent, setHasContent] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(400);

  // Use refs for drawing state so touch handlers don't recreate
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  // Resize
  useEffect(() => {
    const resize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Redraw helper
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    for (const stroke of strokesRef.current) {
      if (stroke.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, []);

  // Init canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = canvasWidth + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvasWidth, height);
        setHasContent(true);
      };
      img.src = initialData;
    }
  }, [canvasWidth, height, initialData]);

  const getCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  const emitData = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      onDataChange(canvas.toDataURL("image/png"));
    }
  }, [onDataChange]);

  // Touch event handlers (stable, no deps on isDrawing)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      const coords = getCoords(touch.clientX, touch.clientY);
      currentStrokeRef.current = { points: [coords] };
      isDrawingRef.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const coords = getCoords(touch.clientX, touch.clientY);
      currentStrokeRef.current.points.push(coords);

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const pts = currentStrokeRef.current.points;
      if (pts.length < 2) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    };

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current) return;
      if (
        currentStrokeRef.current &&
        currentStrokeRef.current.points.length > 0
      ) {
        strokesRef.current.push(currentStrokeRef.current);
      }
      currentStrokeRef.current = null;
      isDrawingRef.current = false;
      setHasContent(true);
      emitData();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [getCoords, emitData, canvasWidth, height]);

  // Mouse handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const coords = getCoords(e.clientX, e.clientY);
      currentStrokeRef.current = { points: [coords] };
      isDrawingRef.current = true;
    },
    [getCoords]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      const coords = getCoords(e.clientX, e.clientY);
      currentStrokeRef.current.points.push(coords);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const pts = currentStrokeRef.current.points;
      if (pts.length < 2) return;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.beginPath();
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    },
    [getCoords]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    if (
      currentStrokeRef.current &&
      currentStrokeRef.current.points.length > 0
    ) {
      strokesRef.current.push(currentStrokeRef.current);
    }
    currentStrokeRef.current = null;
    isDrawingRef.current = false;
    setHasContent(true);
    emitData();
  }, [emitData]);

  const clearCanvas = useCallback(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    setHasContent(false);
    onDataChange(null);
  }, [onDataChange]);

  const undoStroke = useCallback(() => {
    strokesRef.current.pop();
    redrawAll();

    const stillHasContent = strokesRef.current.length > 0;
    setHasContent(stillHasContent);
    if (!stillHasContent) {
      onDataChange(null);
    } else {
      emitData();
    }
  }, [redrawAll, onDataChange, emitData]);

  return (
    <div ref={containerRef}>
      <div
        className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden"
        style={{ height }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-300 text-sm">在此手写</span>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2 mt-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          清空
        </button>
        <button
          type="button"
          onClick={undoStroke}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          disabled={strokesRef.current.length === 0}
        >
          撤销
        </button>
      </div>
    </div>
  );
}

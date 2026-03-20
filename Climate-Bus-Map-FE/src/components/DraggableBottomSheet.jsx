import { useRef, useState, useCallback, useEffect } from 'react';

export default function DraggableBottomSheet({
  snapPoints,
  snapIndex = 1,
  onSnapChange,
  onClose,
  hidden = false,
  children,
}) {
  const handleRef = useRef(null);
  const scrollRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartH = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);
  const isDraggingRef = useRef(false);
  const wasDraggedRef = useRef(false);

  // 렌더링용 state
  const [liveH, setLiveH] = useState(null);
  const [dragging, setDragging] = useState(false);

  // 핸들러에서 최신 값을 읽기 위한 ref (콜백 재생성 없이)
  const liveHRef = useRef(null);
  const snapIndexRef = useRef(snapIndex);
  const snapPointsRef = useRef(snapPoints);
  const onSnapChangeRef = useRef(onSnapChange);
  const onCloseRef = useRef(onClose);

  useEffect(() => { snapIndexRef.current = snapIndex; }, [snapIndex]);
  useEffect(() => { snapPointsRef.current = snapPoints; }, [snapPoints]);
  useEffect(() => { onSnapChangeRef.current = onSnapChange; }, [onSnapChange]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const targetH = snapPoints[snapIndex] ?? snapPoints[0] ?? 100;
  const targetHRef = useRef(targetH);
  useEffect(() => { targetHRef.current = targetH; }, [targetH]);

  // snapIndex 외부 변경 시 liveH 리셋
  useEffect(() => {
    liveHRef.current = null;
    setLiveH(null);
  }, [snapIndex]);

  // 모든 핸들러 deps [] → stable reference 유지
  const onTouchStart = useCallback((e) => {
    const isHandle = handleRef.current?.contains(e.target);
    const scroll = scrollRef.current;
    if (!isHandle && scroll && scroll.scrollTop > 0) return;

    isDraggingRef.current = true;
    wasDraggedRef.current = false;
    setDragging(true);
    const currentH = liveHRef.current ?? targetHRef.current;
    touchStartY.current = e.touches[0].clientY;
    touchStartH.current = currentH;
    lastY.current = e.touches[0].clientY;
    lastT.current = Date.now();
    vel.current = 0;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const y = e.touches[0].clientY;
    const delta = touchStartY.current - y;
    if (Math.abs(delta) > 5) wasDraggedRef.current = true;
    const newH = Math.max(60, touchStartH.current + delta);

    const now = Date.now();
    const dt = now - lastT.current;
    if (dt > 0) vel.current = (lastY.current - y) / dt;
    lastY.current = y;
    lastT.current = now;

    liveHRef.current = newH;
    setLiveH(newH);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);

    const h = liveHRef.current ?? targetHRef.current;
    const v = vel.current;
    const snapIdx = snapIndexRef.current;
    const snaps = snapPointsRef.current;

    if (v < -0.5) {
      liveHRef.current = null;
      setLiveH(null);
      if (snapIdx === 0) {
        onCloseRef.current?.();
      } else {
        onSnapChangeRef.current?.(snapIdx - 1);
      }
      return;
    }

    if (v > 0.5) {
      liveHRef.current = null;
      setLiveH(null);
      onSnapChangeRef.current?.(Math.min(snaps.length - 1, snapIdx + 1));
      return;
    }

    let closestIdx = 0;
    let minDist = Infinity;
    snaps.forEach((s, i) => {
      const d = Math.abs(h - s);
      if (d < minDist) { minDist = d; closestIdx = i; }
    });

    liveHRef.current = null;
    setLiveH(null);
    if (closestIdx !== snapIdx) onSnapChangeRef.current?.(closestIdx);
  }, []);

  const onTouchCancel = useCallback(() => {
    isDraggingRef.current = false;
    setDragging(false);
    liveHRef.current = null;
    setLiveH(null);
  }, []);

  const displayH = liveH ?? targetH;
  const isPeek = snapIndex === 0 && !dragging;

  return (
    <div
      className={`draggable-sheet${dragging ? ' draggable-sheet--dragging' : ''}${isPeek ? ' draggable-sheet--peek' : ''}${hidden ? ' draggable-sheet--hidden' : ''}`}
      style={{ height: hidden ? 0 : displayH }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <div
        className="drag-handle"
        ref={handleRef}
        onClick={() => {
          if (wasDraggedRef.current) return;
          const next = snapIndex < snapPoints.length - 1 ? snapIndex + 1 : snapIndex - 1;
          onSnapChange?.(next);
        }}
      >
        <div className="drag-handle-bar" />
      </div>
      <div className="sheet-inner" ref={scrollRef}>
        {children}
      </div>
    </div>
  );
}

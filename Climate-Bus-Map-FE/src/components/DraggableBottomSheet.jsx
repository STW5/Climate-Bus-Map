import { useRef, useState, useCallback, useEffect } from 'react';

/**
 * 드래그 가능한 바텀 시트
 * snapPoints: px 높이 배열 e.g. [100, 340, 680]
 * snapIndex: 현재 스냅 인덱스 (부모가 관리)
 * onSnapChange(idx): 스냅 변경 콜백
 * onClose(): peek 아래로 내릴 때 호출
 */
export default function DraggableBottomSheet({
  snapPoints,
  snapIndex = 1,
  onSnapChange,
  onClose,
  hidden = false,
  children,
}) {
  const sheetRef = useRef(null);
  const handleRef = useRef(null);
  const scrollRef = useRef(null);
  const touchStartY = useRef(0);
  const touchStartH = useRef(0);
  const lastY = useRef(0);
  const lastT = useRef(0);
  const vel = useRef(0);
  const isDraggingRef = useRef(false);
  const wasDraggedRef = useRef(false);

  const [liveH, setLiveH] = useState(null);
  const [dragging, setDragging] = useState(false);

  const targetH = snapPoints[snapIndex] ?? snapPoints[0] ?? 100;
  const displayH = liveH ?? targetH;

  // snapIndex가 외부에서 변경되면 liveH 리셋
  useEffect(() => { setLiveH(null); }, [snapIndex]);

  const onTouchStart = useCallback((e) => {
    const isHandle = handleRef.current?.contains(e.target);
    const scroll = scrollRef.current;
    // 핸들이 아니고, 내부 스크롤이 위가 아니면 드래그 시작 안 함
    if (!isHandle && scroll && scroll.scrollTop > 0) return;

    isDraggingRef.current = true;
    wasDraggedRef.current = false;
    setDragging(true);
    const currentH = liveH ?? targetH;
    touchStartY.current = e.touches[0].clientY;
    touchStartH.current = currentH;
    lastY.current = e.touches[0].clientY;
    lastT.current = Date.now();
    vel.current = 0;
  }, [liveH, targetH]);

  const onTouchMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const y = e.touches[0].clientY;
    const delta = touchStartY.current - y;
    if (Math.abs(delta) > 5) wasDraggedRef.current = true;
    const newH = Math.max(60, touchStartH.current + delta);

    const now = Date.now();
    const dt = now - lastT.current;
    if (dt > 0) vel.current = (lastY.current - y) / dt; // 양수=위, 음수=아래
    lastY.current = y;
    lastT.current = now;

    setLiveH(newH);
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setDragging(false);

    const h = liveH ?? targetH;
    const v = vel.current;

    // 빠른 아래 스와이프
    if (v < -0.5) {
      if (snapIndex === 0) {
        setLiveH(null);
        onClose?.();
      } else {
        onSnapChange?.(snapIndex - 1);
        setLiveH(null);
      }
      return;
    }

    // 빠른 위 스와이프
    if (v > 0.5) {
      const next = Math.min(snapPoints.length - 1, snapIndex + 1);
      onSnapChange?.(next);
      setLiveH(null);
      return;
    }

    // 가장 가까운 스냅 포인트
    let closestIdx = 0;
    let minDist = Infinity;
    snapPoints.forEach((s, i) => {
      const d = Math.abs(h - s);
      if (d < minDist) { minDist = d; closestIdx = i; }
    });

    if (closestIdx !== snapIndex) onSnapChange?.(closestIdx);
    setLiveH(null);
  }, [liveH, targetH, snapIndex, snapPoints, onClose, onSnapChange]);

  const onTouchCancel = useCallback(() => {
    isDraggingRef.current = false;
    setDragging(false);
    setLiveH(null);
  }, []);

  // peek 상태(snap 0)에서는 pointer-events: none → 지도 터치 통과
  const isPeek = snapIndex === 0 && !dragging;

  return (
    <div
      ref={sheetRef}
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

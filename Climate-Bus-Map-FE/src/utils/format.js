export function secToMin(sec) {
  if (!sec || sec <= 0) return '정보없음';
  const min = Math.floor(sec / 60);
  return min < 1 ? '곧 도착' : `${min}분 후`;
}

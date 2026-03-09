export default function FilterToggle({ active, onToggle }) {
  return (
    <button
      className={`filter-toggle ${active ? 'filter-toggle--active' : ''}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      🌱 {active ? '기후동행 가능만' : '전체 정류소'}
    </button>
  );
}

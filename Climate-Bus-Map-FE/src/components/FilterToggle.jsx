export default function FilterToggle({ active, onToggle }) {
  return (
    <button
      className={`filter-toggle${active ? ' filter-toggle--active' : ''}`}
      onClick={onToggle}
      aria-pressed={active}
    >
      <span className="filter-toggle__dot" />
      {active ? '기후동행만' : '전체'}
    </button>
  );
}

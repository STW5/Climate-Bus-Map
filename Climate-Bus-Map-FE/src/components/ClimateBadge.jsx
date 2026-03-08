export default function ClimateBadge({ eligible }) {
  return (
    <span className={`climate-badge ${eligible ? 'eligible' : 'ineligible'}`}>
      {eligible ? '🟢 기후동행 가능' : '🔴 기후동행 불가'}
    </span>
  );
}

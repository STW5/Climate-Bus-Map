export default function ClimateBadge({ eligible }) {
  return (
    <span className={`climate-badge ${eligible ? 'eligible' : 'ineligible'}`}>
      {eligible ? '기후동행' : '해당없음'}
    </span>
  );
}

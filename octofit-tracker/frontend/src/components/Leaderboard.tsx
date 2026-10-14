import { CapabilityCard } from './CapabilityCard.js';

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      emptyText="No leaderboard available."
      renderItem={(entry) => (
        <>
          <strong>{String(entry.teamName ?? 'Team')}</strong>
          <span> · {String(entry.totalPoints ?? 0)} pts</span>
          <span> · rank {String(entry.rank ?? 0)}</span>
        </>
      )}
    />
  );
}

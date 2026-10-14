import { CapabilityCard } from './CapabilityCard.js';

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      emptyText="No teams available."
      renderItem={(team) => (
        <>
          <strong>{String(team.name ?? 'Team')}</strong>
          <span> · {Array.isArray(team.members) ? team.members.length : 0} members</span>
        </>
      )}
    />
  );
}

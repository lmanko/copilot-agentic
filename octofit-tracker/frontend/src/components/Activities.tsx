import { CapabilityCard } from './CapabilityCard.js';

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      emptyText="No activities available."
      renderItem={(activity) => (
        <>
          <strong>{String(activity.type ?? 'Activity')}</strong>
          <span> · {String(activity.minutes ?? 0)} min</span>
          <span> · {String(activity.points ?? 0)} pts</span>
        </>
      )}
    />
  );
}

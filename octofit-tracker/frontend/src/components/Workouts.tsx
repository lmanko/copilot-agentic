import { CapabilityCard } from './CapabilityCard.js';

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path="/api/workouts/suggestions/mona%40example.com"
      emptyText="No workout suggestions available."
      renderItem={(workout) => (
        <>
          <strong>{String(workout.title ?? 'Workout')}</strong>
          <span> · {String(workout.focus ?? 'general')}</span>
          <span> · {String(workout.reason ?? 'Match based on recent activity')}</span>
        </>
      )}
    />
  );
}

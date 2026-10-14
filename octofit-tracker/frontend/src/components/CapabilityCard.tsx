import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type Props = {
  title: string;
  description: string;
  path: string;
  emptyText: string;
  renderItem: (item: Record<string, unknown>, index: number) => ReactNode;
};

export function CapabilityCard({ title, description, path, emptyText, renderItem }: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getJson<Record<string, unknown>>(path);
        const collection = Array.isArray(payload)
          ? payload
          : ['activities', 'teams', 'leaderboard', 'suggestions', 'items', 'records']
              .map((key) => payload[key])
              .find((value): value is Record<string, unknown>[] => Array.isArray(value)) ?? [];

        if (!cancelled) {
          setItems(collection as Record<string, unknown>[]);
        }
      } catch {
        if (!cancelled) {
          setError(`Unable to load ${title.toLowerCase()}.`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [path, title]);

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p role="status">Loading...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <div role="alert">{error}</div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">{title}</h2>
          <p>{description}</p>
          <p>{emptyText}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        <ul className="list-group list-group-flush">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="list-group-item">
              {renderItem(item, index)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

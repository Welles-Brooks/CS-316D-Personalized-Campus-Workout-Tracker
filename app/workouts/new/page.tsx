import { Suspense } from 'react';
import { WorkoutForm } from '@/app/components/workout-ui';
async function SessionForm({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <WorkoutForm key={from ?? 'new'} mode="session" fromId={from ?? ''} />;
}
export default function Page(props: { searchParams: Promise<{ from?: string }> }) {
  return <Suspense fallback={<main className="page-shell" role="status">Loading workout form…</main>}><SessionForm {...props} /></Suspense>;
}

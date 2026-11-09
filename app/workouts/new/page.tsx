import { WorkoutForm } from '@/app/components/workout-ui';
export default async function Page({ searchParams }: { searchParams: Promise<{ from?: string }> }) {
  const { from } = await searchParams;
  return <WorkoutForm mode="session" fromId={from ?? ''} />;
}
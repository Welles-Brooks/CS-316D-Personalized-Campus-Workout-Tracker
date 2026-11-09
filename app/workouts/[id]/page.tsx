import { Suspense } from 'react';
import { WorkoutDetail } from '@/app/components/workout-ui';
export default function Page() { return <Suspense fallback={<main className="page-shell" role="status">Loading workout…</main>}><WorkoutDetail /></Suspense>; }

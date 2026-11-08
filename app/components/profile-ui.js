'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarPicker, Field, Icon, Notice, ResidenceField } from './profile-elements';

export async function api(url, method = 'GET', data) {
  const response = await fetch(url, { method, cache: 'no-store', ...(data === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
function useProfile() {
  const [state, setState] = useState({ loading: true, user: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api('/api/profile').then(data => { if (active) setState({ loading: false, user: data.user, error: '' }); }).catch(e => { if (active) setState({ loading: false, user: null, error: e.message }); });
    return () => { active = false; };
  }, [attempt]);
  return { ...state, retry: () => setAttempt(x => x + 1) };
}
function ProfileGate({ state }) {
  return <main className="page-shell"><section className="card gate">{state.loading ? <><div className="skeleton" /><h2>Loading your profile…</h2></> : <><Icon name="user" size={36} /><h1>Let’s get you connected.</h1><Notice error={state.error} /><Link className="button" href="/login">Log in</Link><button className="button button-secondary" onClick={state.retry}>Try again</button></>}</section></main>;
}
export function AuthForm({ register = false }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault(); setPending(true); setError('');
    try {
      await api(`/api/auth/${register ? 'register' : 'login'}`, 'POST', Object.fromEntries(new FormData(event.currentTarget)));
      router.replace('/profile'); router.refresh();
    } catch (e) { setError(e.message); } finally { setPending(false); }
  }
  return <main className="auth-shell"><aside className="auth-story"><span className="eyebrow">YOUR CAMPUS. YOUR PACE.</span><h1>Make room<br />for a<br /><em>stronger you.</em></h1><p>Your goals, your workouts, your people.<br />Find your rhythm at Wilson.</p><div className="track-art" aria-hidden="true"><div /><div /><div /><span><Icon name="weight" size={50} /></span></div><span className="story-footer">BUILT FOR LIFE AT DUKE</span></aside><section className="auth-panel"><div className="auth-heading"><span className="eyebrow">WILSON FITNESS</span><h2>{register ? 'Find your starting point.' : 'Good to see you again.'}</h2><p className="muted">{register ? 'Create an account and make your next move.' : 'Log in and pick up where you left off.'}</p></div>
    <form onSubmit={submit}>
      {register && <><div className="form-grid"><Field label="Full name" name="full_name" required maxLength={120} autoComplete="name" placeholder="Your full name" /><Field label="Username" name="username" required maxLength={30} pattern="[a-zA-Z0-9_]+" autoComplete="username" placeholder="Choose a username" /></div><ResidenceField /></>}
      <Field label="Email address" name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@duke.edu" />
      <Field label="Password" name="password" type="password" required minLength={register ? 8 : undefined} autoComplete={register ? 'new-password' : 'current-password'} placeholder={register ? 'Create a password' : 'Enter your password'} hint={register ? 'At least 8 characters; at most 72 UTF-8 bytes.' : undefined} />
      <Notice error={error} /><button className="button auth-submit" disabled={pending}>{pending ? 'Please wait…' : register ? 'Create account' : 'Log in'}<Icon name="arrow" size={18} /></button>
    </form><p className="auth-switch">{register ? 'Already part of the crew?' : 'New to Wilson Fitness?'} <Link href={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create an account'}</Link></p>
  </section></main>;
}
export function WorkoutList({ saved = false, limit }) {
  const [state, setState] = useState({ loading: true, workouts: [], error: '' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    api(`/api/profile/${saved ? 'saved-workouts' : 'workouts'}`).then(data => { if (active) setState({ loading: false, workouts: data.workouts, error: '' }); }).catch(e => { if (active) setState({ loading: false, workouts: [], error: e.message }); });
    return () => { active = false; };
  }, [saved, attempt]);
  if (state.loading) return <div className="card loading-card" role="status">Loading workouts…</div>;
  if (state.error) return <div className="card"><Notice error={state.error} /><button className="button button-secondary" onClick={() => setAttempt(attempt + 1)}>Try again</button> <Link href="/login">Log in</Link></div>;
  return <div className="workout-list">{!state.workouts.length && <div className="empty-state"><span className="empty-icon"><Icon name={saved ? 'bookmark' : 'weight'} size={28} /></span><h3>{saved ? 'Keep your favorites close.' : 'Your next chapter starts here.'}</h3><p>{saved ? 'Workouts you save will be ready for you here.' : 'Your completed workouts will appear here once you start logging.'}</p></div>}
    {state.workouts.slice(0, limit).map(w => <article className="card workout-card" key={w.id}>
      <div className="workout-heading"><span className="workout-icon"><Icon name={saved ? 'bookmark' : 'weight'} size={23} /></span><div><h3>{new Date(`${w.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</h3><p>{w.start_time || 'Time not recorded'} · {w.location || 'Location not recorded'}</p></div><span className="pill">{w.duration_minutes == null ? 'No duration' : `${w.duration_minutes} min`}</span></div>
      {saved && <p className="workout-owner">@{w.owner_username} <span className="dot">·</span> {w.is_template ? 'Planned workout' : 'Completed workout'}</p>}
      {w.exercises.length ? <div className="exercise-rows">{w.exercises.map(e => <div className="exercise-row" key={e.id}><div><strong>{e.name}</strong><span>{e.equipment_name || 'Equipment not recorded'}</span></div><span>{e.is_cardio ? `${e.reps ?? '—'} min` : `${e.sets ?? '—'} × ${e.reps ?? '—'} reps${e.weight == null ? '' : ` · ${e.weight} lb`}`}</span></div>)}</div> : <p className="muted">No exercises recorded.</p>}
      {(w.feel != null || w.effort != null) && <div className="workout-tags">{w.feel != null && <span>Feeling <strong>{w.feel}/10</strong></span>}{w.effort != null && <span>Effort <strong>{w.effort}/10</strong></span>}</div>}{w.notes && <p className="workout-note">{w.notes}</p>}
    </article>)}
  </div>;
}
export function Profile() {
  const state = useProfile();
  if (!state.user) return <ProfileGate state={state} />;
  const user = state.user;
  return <main className="page-shell"><div className="page-heading"><div><span className="eyebrow">YOUR SPACE</span><h1>My profile<span className="blue-dot">.</span></h1><p>A little about you. A lot of possibility.</p></div><Link className="button button-secondary" href="/profile/edit"><Icon name="edit" size={17} />Edit profile</Link></div>
    <section className="card identity-card"><div className="profile-banner"><span>SHOW UP FOR YOURSELF.</span><div className="banner-rings" aria-hidden="true" /></div><div className="identity-body"><div className="identity-avatar"><Avatar id={user.avatar} size={112} /></div><div className="identity-name"><h2>{user.full_name}</h2><p>@{user.username}</p></div><span className="residence-pill"><Icon name="pin" size={16} />{user.address || 'Residence not set'}</span></div></section>
    <div className="overview-grid"><section className="card goals-card"><span className="section-icon"><Icon name="target" size={23} /></span><span className="eyebrow">THE BIG PICTURE</span><h2>What I’m working toward</h2><p className="goals-text">{user.fitness_goals || 'Every routine starts with a goal. Add yours when you’re ready.'}</p><span className="goal-caption">ONE WORKOUT AT A TIME.</span></section><section className="card preferences-card"><div className="section-title"><h2>My fitness rhythm</h2><Icon name="weight" size={20} /></div><dl><div><dt><Icon name="user" size={18} />Experience</dt><dd>{user.experience_level || 'Not set yet'}</dd></div><div><dt><Icon name="history" size={18} />Workout length</dt><dd>{user.preferred_workout_minutes ? <>{user.preferred_workout_minutes}<small> min</small></> : 'Not set yet'}</dd></div><div><dt><Icon name="calendar" size={18} />Weekly goal</dt><dd>{user.workouts_per_week ? <>{user.workouts_per_week}<small> workouts / week</small></> : 'Not set yet'}</dd></div></dl></section></div>
    <section className="profile-section"><div className="section-heading"><div><span className="eyebrow">KEEP MOVING</span><h2>Recent workouts</h2></div><Link className="text-link" href="/history">View history<Icon name="arrow" size={17} /></Link></div><WorkoutList limit={2} /></section>
    <section className="profile-section"><div className="section-heading"><div><span className="eyebrow">READY WHEN YOU ARE</span><h2>Saved workouts</h2></div><Icon name="bookmark" size={22} /></div><WorkoutList saved /></section>
    <footer className="profile-footer"><span>YOUR PACE. YOUR PROGRESS.</span><Link href="/profile/security">Account security<Icon name="shield" size={15} /></Link></footer>
  </main>;
}
export function EditProfile() {
  const router = useRouter();
  const state = useProfile();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  async function save(event) {
    event.preventDefault(); setPending(true); setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['preferred_workout_minutes', 'workouts_per_week']) data[key] = data[key] === '' ? null : Number(data[key]);
    try { await api('/api/profile', 'PATCH', data); router.push('/profile'); router.refresh(); }
    catch (e) { setError(e.message); } finally { setPending(false); }
  }
  if (!state.user) return <ProfileGate state={state} />;
  const user = state.user;
  return <main className="page-shell edit-shell"><Link className="back-link" href="/profile"><Icon name="back" size={16} />Back to profile</Link><div className="page-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h1>Edit profile<span className="blue-dot">.</span></h1><p>The details that make you, you.</p></div></div><form onSubmit={save}><section className="card form-section"><AvatarPicker initial={user.avatar} /></section><section className="card form-section"><div className="form-section-heading"><span className="section-icon"><Icon name="user" /></span><div><h2>Personal details</h2><p>Your name and your corner of campus.</p></div></div><div className="form-grid"><Field label="Full name" name="full_name" defaultValue={user.full_name} required maxLength={120} autoComplete="name" /><Field label="Username" name="username" defaultValue={user.username} required maxLength={30} pattern="[a-zA-Z0-9_]+" autoComplete="username" /><Field label="Email address" name="email" type="email" defaultValue={user.email} required maxLength={254} autoComplete="email" /><ResidenceField initial={user.address} /></div><p className="field-footnote">Account ID {user.id} · Assigned automatically</p></section>
    <section className="card form-section"><div className="form-section-heading"><span className="section-icon"><Icon name="target" /></span><div><h2>Fitness preferences</h2><p>Build a routine that fits your life.</p></div></div><label className="field"><span>Fitness goals</span><textarea name="fitness_goals" defaultValue={user.fitness_goals || ''} maxLength={2000} rows={3} placeholder="What would you like to work toward?" /></label><div className="form-grid"><label className="field"><span>Experience level</span><select name="experience_level" defaultValue={user.experience_level || ''}><option value="">Select experience level</option>{['Beginner', 'Intermediate', 'Advanced'].map(x => <option key={x}>{x}</option>)}</select></label><Field label="Workout length (minutes)" name="preferred_workout_minutes" type="number" min={1} max={1440} defaultValue={user.preferred_workout_minutes ?? ''} /><Field label="Workouts per week" name="workouts_per_week" type="number" min={1} max={21} defaultValue={user.workouts_per_week ?? ''} /></div></section><Notice error={error} /><div className="form-actions"><Link className="button button-secondary" href="/profile">Cancel</Link><button className="button" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}<Icon name="check" size={18} /></button></div></form><p className="security-link"><Icon name="shield" size={16} />Need to change your password? <Link href="/profile/security">Account security</Link></p></main>;
}
export function Security() {
  const state = useProfile();
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [pending, setPending] = useState(false);
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    setError(''); setMessage('');
    if (data.new_password !== data.confirm_password) { setError('New passwords do not match.'); return; }
    setPending(true);
    try { await api('/api/profile/password', 'PATCH', data); form.reset(); setMessage('Your password has been changed.'); }
    catch (e) { setError(e.message); } finally { setPending(false); }
  }
  if (!state.user) return <ProfileGate state={state} />;
  return <main className="page-shell edit-shell"><Link className="back-link" href="/profile"><Icon name="back" size={16} />Back to profile</Link><div className="page-heading"><div><span className="eyebrow">ACCOUNT SETTINGS</span><h1>Stay secure<span className="blue-dot">.</span></h1><p>Keep your account in good shape.</p></div></div><form className="card form-section" onSubmit={submit}><h2>Change password</h2><Field label="Current password" name="current_password" type="password" required autoComplete="current-password" /><div className="form-grid"><Field label="New password" name="new_password" type="password" minLength={8} required autoComplete="new-password" /><Field label="Confirm new password" name="confirm_password" type="password" minLength={8} required autoComplete="new-password" /></div><p className="field-footnote">Use at least 8 characters (at most 72 UTF-8 bytes).</p><Notice error={error} message={message} /><button className="button" disabled={pending}>{pending ? 'Changing…' : 'Update password'}</button></form></main>;
}
export function History() {
  return <main className="page-shell"><Link className="back-link" href="/profile"><Icon name="back" size={16} />Back to profile</Link><div className="page-heading"><div><span className="eyebrow">THE WORK YOU PUT IN</span><h1>Workout history<span className="blue-dot">.</span></h1><p>Every session counts. Here’s yours, newest first.</p></div></div><WorkoutList /></main>;
}

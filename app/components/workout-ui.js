'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api } from './profile-ui';
import { Field, Icon, Notice } from './profile-elements';

const blankRow = { exercise_id: '', equipment_id: '', sets: '3', reps: '10', weight: '' };
const isCardioType = t => /cardio/i.test(t || '');

export function WorkoutForm({ mode = 'session', fromId = '' }) {
  const router = useRouter();
  const isTemplate = mode === 'template';
  const [options, setOptions] = useState({ exercises: [], equipment: [] });
  const [rows, setRows] = useState([{ ...blankRow }]);
  const [meta, setMeta] = useState({
    date: new Date().toLocaleDateString('en-CA'), start_time: '', duration_minutes: '',
    location: 'Wilson Rec Center', feel: '', effort: '', notes: '',
  });
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const jobs = [api('/api/exercises')];
    if (fromId) jobs.push(api(`/api/workouts/${fromId}`));
    Promise.all(jobs).then(([opts, src]) => {
      if (!active) return;
      setOptions(opts);
      if (src) { // prefill from a saved workout
        const w = src.workout;
        setRows(w.exercises.map(e => ({
          exercise_id: String(e.exercise_id), equipment_id: e.equipment_id ? String(e.equipment_id) : '',
          sets: String(e.sets ?? ''), reps: String(e.reps ?? ''), weight: String(e.weight ?? ''),
        })));
        setMeta(m => ({ ...m, location: w.location || m.location, duration_minutes: String(w.duration_minutes ?? '') }));
      }
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [fromId]);

  const setRow = (i, patch) => setRows(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const cardio = id => isCardioType(options.exercises.find(x => String(x.id) === id)?.equipment_type);

  async function submit(event) {
    event.preventDefault(); setPending(true); setError('');
    try {
      const data = await api('/api/workouts', 'POST', { ...meta, is_template: isTemplate, save_as_template: saveTemplate, exercises: rows });
      router.push(`/workouts/${data.id}`); router.refresh();
    } catch (e) { setError(e.message); setPending(false); }
  }

  return <main className="page-shell edit-shell">
    <Link className="back-link" href="/profile"><Icon name="back" size={16} />Back to profile</Link>
    <div className="page-heading"><div>
      <span className="eyebrow">{isTemplate ? 'PLAN AHEAD' : fromId ? 'ROUND TWO' : 'LOG YOUR WORK'}</span>
      <h1>{isTemplate ? 'Create a workout' : 'Track a workout'}<span className="blue-dot">.</span></h1>
      <p>{isTemplate ? 'Build a routine you can reuse any time.' : 'Add what you did. Adjust the numbers as you go.'}</p>
    </div></div>
    <form onSubmit={submit}>
      <section className="card form-section">
        <div className="form-section-heading"><span className="section-icon"><Icon name="calendar" /></span><div><h2>The basics</h2></div></div>
        <div className="form-grid">
          {!isTemplate && <Field label="Date" name="date" type="date" required value={meta.date} onChange={e => setMeta({ ...meta, date: e.target.value })} />}
          {!isTemplate && <Field label="Start time" name="start_time" type="time" value={meta.start_time} onChange={e => setMeta({ ...meta, start_time: e.target.value })} />}
          <Field label="Length (minutes)" name="duration_minutes" type="number" min={1} max={1440} value={meta.duration_minutes} onChange={e => setMeta({ ...meta, duration_minutes: e.target.value })} />
          <Field label="Location" name="location" maxLength={100} value={meta.location} onChange={e => setMeta({ ...meta, location: e.target.value })} />
        </div>
        {isTemplate && <label className="field"><span>Description</span><textarea name="notes" rows={2} maxLength={2000} placeholder="e.g. Upper body day" value={meta.notes} onChange={e => setMeta({ ...meta, notes: e.target.value })} /></label>}
      </section>

      <section className="card form-section">
        <div className="form-section-heading"><span className="section-icon"><Icon name="weight" /></span><div><h2>Exercises</h2></div></div>
        {rows.map((r, i) => <div className="exercise-row" key={i} style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
          <div className="form-grid">
            <label className="field"><span>Exercise <span className="required">*</span></span>
              <select required value={r.exercise_id} onChange={e => {
                const ex = options.exercises.find(x => String(x.id) === e.target.value);
                setRow(i, { exercise_id: e.target.value, equipment_id: ex?.equipment_id ? String(ex.equipment_id) : '' });
              }}>
                <option value="" disabled>Choose an exercise</option>
                {options.exercises.map(x => <option key={x.id} value={x.id}>{x.name} ({x.muscle_group})</option>)}
              </select></label>
            <label className="field"><span>Equipment</span>
              <select value={r.equipment_id} onChange={e => setRow(i, { equipment_id: e.target.value })}>
                <option value="">None / not recorded</option>
                {options.equipment.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
              </select></label>
          </div>
          <div className="form-grid">
            {cardio(r.exercise_id)
              ? <Field label="Minutes" name={`reps-${i}`} type="number" min={0} value={r.reps} onChange={e => setRow(i, { reps: e.target.value, sets: '1', weight: '' })} />
              : <>
                <Field label="Sets" name={`sets-${i}`} type="number" min={1} value={r.sets} onChange={e => setRow(i, { sets: e.target.value })} />
                <Field label="Reps" name={`reps-${i}`} type="number" min={0} value={r.reps} onChange={e => setRow(i, { reps: e.target.value })} />
                <Field label="Weight (lb)" name={`weight-${i}`} type="number" min={0} step="0.5" value={r.weight} onChange={e => setRow(i, { weight: e.target.value })} />
              </>}
          </div>
          {rows.length > 1 && <button type="button" className="button button-secondary" onClick={() => setRows(rs => rs.filter((_, j) => j !== i))}>Remove exercise</button>}
        </div>)}
        <button type="button" className="button button-secondary" onClick={() => setRows(rs => [...rs, { ...blankRow }])}>+ Add exercise</button>
      </section>

      {!isTemplate && <section className="card form-section">
        <div className="form-section-heading"><span className="section-icon"><Icon name="target" /></span><div><h2>How did it go?</h2><p>Optional. You can also add this later.</p></div></div>
        <div className="form-grid">
          <Field label="Felt (1–10)" name="feel" type="number" min={1} max={10} value={meta.feel} onChange={e => setMeta({ ...meta, feel: e.target.value })} />
          <Field label="Effort (1–10)" name="effort" type="number" min={1} max={10} value={meta.effort} onChange={e => setMeta({ ...meta, effort: e.target.value })} />
        </div>
        <label className="field"><span>Notes</span><textarea name="notes" rows={3} maxLength={2000} value={meta.notes} onChange={e => setMeta({ ...meta, notes: e.target.value })} /></label>
        <label><input type="checkbox" checked={saveTemplate} onChange={e => setSaveTemplate(e.target.checked)} /> Also save this as a reusable workout</label>
      </section>}

      <Notice error={error} />
      <div className="form-actions">
        <Link className="button button-secondary" href="/profile">Cancel</Link>
        <button className="button" disabled={pending}>{pending ? 'Saving…' : isTemplate ? 'Save workout' : 'Finish workout'}<Icon name="check" size={18} /></button>
      </div>
    </form>
  </main>;
}

export function WorkoutDetail() {
  const { id } = useParams();
  const [w, setW] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [log, setLog] = useState({ feel: '', effort: '', notes: '' });

  function show(workout) {
    setW(workout);
    setLog({ feel: workout.feel ?? '', effort: workout.effort ?? '', notes: workout.notes ?? '' });
  }
  useEffect(() => {
    let active = true;
    api(`/api/workouts/${id}`).then(d => { if (active) show(d.workout); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [id]);

  async function act(fn, okMessage) {
    setError(''); setMessage('');
    try { const result = await fn(); if (okMessage) setMessage(typeof okMessage === 'function' ? okMessage(result) : okMessage); }
    catch (e) { setError(e.message); }
  }
  const refresh = async () => show((await api(`/api/workouts/${id}`)).workout);

  if (!w) return <main className="page-shell"><div className="card loading-card" role="status">{error ? <Notice error={error} /> : 'Loading workout…'}</div></main>;

  return <main className="page-shell edit-shell">
    <Link className="back-link" href="/profile"><Icon name="back" size={16} />Back to profile</Link>
    <div className="page-heading"><div>
      <span className="eyebrow">{w.is_template ? 'SAVED WORKOUT' : 'COMPLETED WORKOUT'}</span>
      <h1>{w.is_template ? (w.notes || 'Saved workout') : new Date(`${w.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}<span className="blue-dot">.</span></h1>
      <p>@{w.owner_username}{!w.is_template && ` · ${w.start_time || 'Time not recorded'}`} · {w.location || 'Location not recorded'}{w.duration_minutes ? ` · ${w.duration_minutes} min` : ''}</p>
    </div></div>

    <section className="card form-section">
      <div className="exercise-rows">{w.exercises.map(e => <div className="exercise-row" key={e.id}>
        <div><strong>{e.name}</strong><span>{e.equipment_name || 'Equipment not recorded'}</span></div>
        <span>{e.is_cardio ? `${e.reps ?? '—'} min` : `${e.sets ?? '—'} × ${e.reps ?? '—'} reps${e.weight == null ? '' : ` · ${e.weight} lb`}`}</span>
      </div>)}</div>
      <div className="form-actions">
        {w.is_saved
          ? <button className="button button-secondary" onClick={() => act(async () => { await api(`/api/workouts/${id}/save`, 'DELETE'); await refresh(); }, 'Removed from your saved workouts.')}>Remove from saved</button>
          : <button className="button button-secondary" onClick={() => act(async () => { await api(`/api/workouts/${id}/save`, 'POST', {}); await refresh(); }, 'Saved to your profile.')}><Icon name="bookmark" size={17} />Save workout</button>}
        <Link className="button" href={`/workouts/new?from=${w.id}`}>Use this workout<Icon name="arrow" size={18} /></Link>
        {w.is_owner && !w.is_template && <button className="button button-secondary" onClick={() => act(() => api(`/api/workouts/${id}/template`, 'POST', {}), r => r.existed ? 'You already have this workout saved.' : 'Saved as a reusable workout.')}>Save as reusable</button>}
      </div>
    </section>

    {w.is_owner && !w.is_template && <form className="card form-section" onSubmit={e => { e.preventDefault(); act(async () => show((await api(`/api/workouts/${id}`, 'PATCH', log)).workout), 'Log saved.'); }}>
      <h2>Workout log</h2>
      <div className="form-grid">
        <Field label="Felt (1–10)" name="feel" type="number" min={1} max={10} value={log.feel} onChange={e => setLog({ ...log, feel: e.target.value })} />
        <Field label="Effort (1–10)" name="effort" type="number" min={1} max={10} value={log.effort} onChange={e => setLog({ ...log, effort: e.target.value })} />
      </div>
      <label className="field"><span>Notes</span><textarea name="notes" rows={3} maxLength={2000} value={log.notes} onChange={e => setLog({ ...log, notes: e.target.value })} /></label>
      <button className="button">Save log</button>
    </form>}
    {!w.is_owner && !w.is_template && (w.feel != null || w.effort != null || w.notes) &&
      <section className="card form-section"><div className="workout-tags">{w.feel != null && <span>Feeling <strong>{w.feel}/10</strong></span>}{w.effort != null && <span>Effort <strong>{w.effort}/10</strong></span>}</div>{w.notes && <p className="workout-note">{w.notes}</p>}</section>}
    <Notice error={error} message={message} />
  </main>;
}
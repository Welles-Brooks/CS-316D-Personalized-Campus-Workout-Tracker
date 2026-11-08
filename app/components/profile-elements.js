'use client';
import { useState } from 'react';
import { avatars, defaultAvatar, residenceGroups } from '@/lib/profile-options';

export function Icon({ name, size = 20, ...props }) {
  const paths = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    weight: <><path d="m6 6 12 12M3 8l5-5M16 21l5-5M2 5l3-3M19 22l3-3" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    equipment: <><path d="M5 4v16M19 4v16M2 8h6M16 8h6M2 16h6M16 16h6M8 12h8" /></>,
    book: <><path d="M4 3h12a3 3 0 0 1 3 3v15H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2M3 17h16M8 7h6M8 11h6" /></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    back: <path d="M20 12H4m6-6-6 6 6 6" />,
    edit: <><path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z" /></>,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 11h18M8 15h2M14 15h2" /></>,
    bookmark: <path d="M6 3h12v19l-6-4-6 4z" />,
    check: <path d="m5 12 4 4L19 6" />,
    logout: <><path d="M9 4H4v16h5M10 12h12m-5-5 5 5-5 5" /></>,
    shield: <><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z" /><path d="m8 12 3 3 5-6" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.user}</svg>;
}
export function Avatar({ id = defaultAvatar, size = 80 }) {
  const a = avatars.find(avatar => avatar.id === id) || avatars[0];
  return <svg className="avatar" width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${a.name} avatar`}>
    <rect width="100" height="100" rx="50" fill={a.background} />
    {a.style === 2 && <path d="M22 70V37a28 28 0 0 1 56 0v36" fill={a.hair} />}
    <path d="M12 100c0-25 16-34 38-34s38 9 38 34" fill={a.shirt} />
    <path d="M42 60v12c3 7 13 7 16 0V60" fill={a.skin} />
    <ellipse cx="50" cy="43" rx="23" ry="28" fill={a.skin} />
    <path d={a.style === 1 ? 'M26 44C18 12 44 5 58 12c18-1 22 16 16 33l-6-14c-12 4-20-7-27-3l-11 4z' : a.style === 2 ? 'M25 43C18 9 70 3 76 35l-7 9-4-18c-9 11-25 7-33 8l-3 12z' : 'M25 40C18 11 45 6 63 13c16 3 15 22 11 31l-8-19c-8 8-20 4-29 7l-8 13z'} fill={a.hair} />
    <circle cx="42" cy="45" r="2" fill="#29252d" /><circle cx="59" cy="45" r="2" fill="#29252d" />
    <path d="M44 57q6 5 12 0" fill="none" stroke="#824b44" strokeWidth="2" strokeLinecap="round" />
    <path d="m32 79 18 13 18-13" fill="none" stroke="white" strokeOpacity=".5" strokeWidth="3" />
  </svg>;
}
export function AvatarPicker({ initial = defaultAvatar }) {
  const [selected, setSelected] = useState(initial);
  return <fieldset className="avatar-picker"><legend>Choose your avatar</legend><p className="muted">A little personality for your profile.</p><div className="avatar-options">{avatars.map(a => <label key={a.id} className={`avatar-option ${selected === a.id ? 'selected' : ''}`}><input type="radio" name="avatar" value={a.id} checked={selected === a.id} onChange={() => setSelected(a.id)} /><Avatar id={a.id} size={64} /><span>{a.name}</span>{selected === a.id && <span className="avatar-check"><Icon name="check" size={12} /></span>}</label>)}</div></fieldset>;
}
export function ResidenceField({ initial = '' }) {
  return <label className="field"><span>Residence <span className="required">*</span></span><select name="address" required defaultValue={initial}><option value="" disabled>Select your residence</option>{residenceGroups.map(group => <optgroup key={group.label} label={group.label}>{group.options.map(value => <option key={value} value={value}>{value}</option>)}</optgroup>)}</select></label>;
}
export function Field({ label, name, hint, ...props }) {
  return <label className="field"><span>{label}{props.required && <span className="required"> *</span>}</span><input name={name} {...props} />{hint && <small>{hint}</small>}</label>;
}
export function Notice({ error, message }) {
  if (!error && !message) return null;
  return <p role={error ? 'alert' : 'status'} className={`notice ${error ? 'notice-error' : 'notice-success'}`}>{error || message}</p>;
}

'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, Icon } from './profile-elements';
import { api } from './profile-ui';
export default function AppNav() {
  const path = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => {
    let active = true;
    api('/api/profile').then(data => { if (active) setUser(data.user); }).catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, [path]);
  async function logout() {
    setPending(true); setError('');
    try { await api('/api/auth/logout', 'POST', {}); setUser(null); router.replace('/login'); router.refresh(); }
    catch (e) { setError(e.message); } finally { setPending(false); }
  }
  return <header className="app-header"><div className="nav-inner"><Link href="/profile" className="brand"><span className="brand-symbol"><Icon name="weight" size={23} /></span><span>WILSON<span className="brand-sub">FITNESS</span></span></Link>
    <nav className="nav-links" aria-label="Main navigation">{[['/profile', 'user', 'My profile'], ['/history', 'history', 'History'], ['/equipment', 'equipment', 'Equipment'], ['/exercises', 'book', 'Exercises']].map(([href, icon, label]) => <Link key={href} href={href} className={path.startsWith(href) ? 'active' : ''} aria-current={path.startsWith(href) ? 'page' : undefined}><Icon name={icon} size={18} />{label}</Link>)}</nav>
    {user ? <details className="account-menu" key={path}><summary><Avatar id={user.avatar} size={34} /><span>{user.full_name.split(' ')[0]}</span><span className="chevron">⌄</span></summary><div className="account-dropdown"><p>Signed in as <strong>@{user.username}</strong></p><Link href="/profile/edit"><Icon name="edit" size={16} />Edit profile</Link><Link href="/profile/security"><Icon name="shield" size={16} />Account security</Link><button onClick={logout} disabled={pending}><Icon name="logout" size={16} />{pending ? 'Logging out…' : 'Log out'}</button>{error && <p role="alert">{error}</p>}</div></details> : <div className="nav-auth"><Link href="/login">Log in</Link><Link className="button button-small" href="/register">Get started</Link></div>}
  </div></header>;
}

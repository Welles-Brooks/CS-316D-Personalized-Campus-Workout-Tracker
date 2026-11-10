'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from './profile-ui';
import { Avatar, Field, Icon, Notice } from './profile-elements';

export default function SocialUI() {
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'friends' | 'lookup'
  const [feed, setFeed] = useState([]);
  const [friends, setFriends] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Lookup state
  const [lookupId, setLookupId] = useState('');
  const [lookupComments, setLookupComments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [feedData, friendsData, privacyData, blockData] = await Promise.all([
        api('/api/social/feed'),
        api('/api/social/friends'),
        api('/api/social/privacy'),
        api('/api/social/block'),
      ]);
      setFeed(feedData.feed || []);
      setFriends(friendsData.friends || []);
      setIsPublic(Boolean(privacyData.is_public));
      setBlockedUsers(blockData.blocked || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePrivacy() {
    setError('');
    setMessage('');
    try {
      const nextState = !isPublic;
      const res = await api('/api/social/privacy', 'PATCH', { is_public: nextState });
      setIsPublic(res.is_public);
      setMessage(`Visibility updated: your profile & workouts are now ${res.is_public ? 'Public' : 'Private (Friends Only)'}.`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setError('');
    try {
      const data = await api(`/api/social/friends?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.results || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddFriend(friendId) {
    setError('');
    setMessage('');
    try {
      await api('/api/social/friends', 'POST', { friendId });
      setMessage('Friend added successfully!');
      setSearchResults([]);
      setSearchQuery('');
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleRemoveFriend(friendId) {
    setError('');
    setMessage('');
    try {
      await api('/api/social/friends', 'DELETE', { friendId });
      setMessage('Friend removed.');
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleBlockUser(userId, userName) {
    if (!confirm(`Are you sure you want to block ${userName}? Their workouts and comments will no longer appear.`)) {
      return;
    }
    setError('');
    setMessage('');
    try {
      await api('/api/social/block', 'POST', { userId });
      setMessage(`${userName} has been blocked.`);
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUnblockUser(userId, userName) {
    setError('');
    setMessage('');
    try {
      await api('/api/social/block', 'DELETE', { userId });
      setMessage(`${userName} has been unblocked.`);
      loadData();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleToggleJoin(workoutId) {
    try {
      await api('/api/social/join', 'POST', { workoutId });
      const feedData = await api('/api/social/feed');
      setFeed(feedData.feed || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handlePostComment(workoutId) {
    const text = commentInputs[workoutId]?.trim();
    if (!text) return;
    try {
      await api('/api/social/comments', 'POST', { workoutId, body: text });
      setCommentInputs(prev => ({ ...prev, [workoutId]: '' }));
      const feedData = await api('/api/social/feed');
      setFeed(feedData.feed || []);
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleLookupComments(e) {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setError('');
    try {
      const data = await api(`/api/social/comments?userId=${encodeURIComponent(lookupId)}`);
      setLookupComments(data.comments || []);
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <main className="page-shell">
      <Link className="back-link" href="/profile">
        <Icon name="back" size={16} />Back to profile
      </Link>

      <div className="page-heading">
        <div>
          <span className="eyebrow">COMMUNITY & SOCIAL</span>
          <h1>DukeFit Social<span className="blue-dot">.</span></h1>
          <p>Connect with workout buddies, plan gym sessions, and track your fitness network.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className={`button ${activeTab === 'feed' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('feed')}
          >
            Activity feed
          </button>
          <button
            className={`button ${activeTab === 'friends' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('friends')}
          >
            Friends & search
          </button>
          <button
            className={`button ${activeTab === 'lookup' ? '' : 'button-secondary'}`}
            onClick={() => setActiveTab('lookup')}
          >
            Feedback lookup
          </button>
        </div>
      </div>

      <Notice error={error} message={message} />

      {/* Profile & Workout Privacy Setting Card */}
      <section className="card form-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="eyebrow">PRIVACY CONTROLS</span>
          <h2 style={{ margin: '4px 0' }}>Profile & Workout Visibility</h2>
          <p className="muted" style={{ margin: 0 }}>
            Currently: <strong>{isPublic ? 'Public' : 'Private (Friends only)'}</strong>.
            {isPublic
              ? ' Any student on DukeFit can discover your profile and see your workouts.'
              : ' Only users in your accepted friends list can see your workouts.'}
          </p>
        </div>
        <button
          type="button"
          className="button button-secondary"
          onClick={handleTogglePrivacy}
        >
          <Icon name="shield" size={16} />
          {isPublic ? 'Switch to Private' : 'Switch to Public'}
        </button>
      </section>

      {/* TAB 1: SOCIAL FEED */}
      {activeTab === 'feed' && (
        <section className="workout-list">
          {loading ? (
            <div className="card loading-card">Loading social feed…</div>
          ) : !feed.length ? (
            <div className="empty-state">
              <span className="empty-icon"><Icon name="user" size={28} /></span>
              <h3>No workouts on your feed</h3>
              <p>Workouts from your friends and public profiles will appear here.</p>
            </div>
          ) : (
            feed.map(w => (
              <article className="card workout-card" key={w.id}>
                <div className="workout-heading">
                  <Avatar id={w.owner_avatar} size={42} />
                  <div>
                    <h3>
                      {w.owner_name} <span className="muted">(@{w.owner_username})</span>
                    </h3>
                    <p>
                      {new Date(`${w.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {w.location || 'Wilson Rec Center'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className="pill">{w.duration_minutes ? `${w.duration_minutes} min` : 'Workout'}</span>
                    <button
                      type="button"
                      title="Block user"
                      className="button button-secondary"
                      style={{ padding: '4px 8px', fontSize: 11 }}
                      onClick={() => handleBlockUser(w.user_id, w.owner_name)}
                    >
                      Block
                    </button>
                  </div>
                </div>

                {w.exercises?.length > 0 && (
                  <div className="exercise-rows" style={{ marginTop: 12 }}>
                    {w.exercises.map((e, idx) => (
                      <div className="exercise-row" key={idx}>
                        <strong>{e.name}</strong>
                        <span>{e.sets} sets × {e.reps} reps {e.weight ? `· ${e.weight} lb` : ''}</span>
                      </div>
                    ))}
                  </div>
                )}

                {w.notes && <p className="workout-note" style={{ marginTop: 10 }}>&ldquo;{w.notes}&rdquo;</p>}

                {/* Attendees / Join Planned Workout */}
                <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {w.attendees.length ? `${w.attendees.length} joined this workout` : 'No workout buddies yet'}
                  </span>
                  <button
                    type="button"
                    className={`button button-small ${w.user_is_attending ? 'button-secondary' : ''}`}
                    onClick={() => handleToggleJoin(w.id)}
                  >
                    <Icon name="check" size={14} />
                    {w.user_is_attending ? 'Leave workout' : 'Join workout'}
                  </button>
                </div>

                {/* Comment Thread */}
                <div style={{ marginTop: 16, borderTop: '1px solid #eef2f6', paddingTop: 12 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Comments ({w.comments.length})</h4>
                  <div className="exercise-rows" style={{ marginBottom: 10 }}>
                    {w.comments.map(c => (
                      <div className="exercise-row" key={c.id}>
                        <div>
                          <strong>{c.author_name} (@{c.author_username})</strong>
                          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#334155' }}>{c.body}</p>
                        </div>
                        <span className="muted" style={{ fontSize: 11 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Input */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Add a comment or encouragement…"
                      value={commentInputs[w.id] || ''}
                      onChange={e => setCommentInputs({ ...commentInputs, [w.id]: e.target.value })}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                      onKeyDown={e => { if (e.key === 'Enter') handlePostComment(w.id); }}
                    />
                    <button className="button button-small" onClick={() => handlePostComment(w.id)}>
                      Post
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      )}

      {/* TAB 2: FRIENDS & SEARCH */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* 1. Search */}
          <section className="card form-section">
            <div className="form-section-heading">
              <span className="section-icon"><Icon name="user" size={20} /></span>
              <div>
                <h2>Find Duke classmates</h2>
                <p>Search by student name, username handle, or Duke email.</p>
              </div>
            </div>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 240px' }}>
                <Field
                  label="Search students"
                  name="q"
                  placeholder="e.g. Carlie, pk@gmail.com, or sola"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button className="button" style={{ marginBottom: 4 }}>Search</button>
            </form>

            {searchResults.length > 0 && (
              <div className="exercise-rows" style={{ marginTop: 16 }}>
                {searchResults.map(u => (
                  <div className="exercise-row" key={u.id} style={{ alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar id={u.avatar} size={42} />
                      <div>
                        <strong>{u.full_name}</strong>
                        <span>@{u.username} · {u.email} · <strong>ID: #{u.id}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="button button-secondary" onClick={() => handleAddFriend(u.id)}>
                        Add friend
                      </button>
                      <button type="button" className="button button-secondary" onClick={() => handleBlockUser(u.id, u.full_name)}>
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. My Friends */}
          <section className="card form-section">
            <div className="form-section-heading">
              <span className="section-icon"><Icon name="bookmark" size={20} /></span>
              <div>
                <h2>My friends ({friends.length})</h2>
              </div>
            </div>

            {!friends.length ? (
              <p className="muted">No friends connected yet. Search above to add friends!</p>
            ) : (
              <div className="exercise-rows">
                {friends.map(f => (
                  <div className="exercise-row" key={f.id} style={{ alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar id={f.avatar} size={42} />
                      <div>
                        <strong>{f.full_name}</strong>
                        <span>@{f.username} · {f.email} · <strong>ID: #{f.id}</strong></span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => handleRemoveFriend(f.id)}
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => handleBlockUser(f.id, f.full_name)}
                      >
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Blocked Users & Unblock List */}
          <section className="card form-section">
            <div className="form-section-heading">
              <span className="section-icon"><Icon name="shield" size={20} /></span>
              <div>
                <h2>Blocked users ({blockedUsers.length})</h2>
                <p className="field-footnote">Blocked accounts cannot view your profile, and their posts/comments are hidden from your feed.</p>
              </div>
            </div>

            {!blockedUsers.length ? (
              <p className="muted">You haven&apos;t blocked any accounts.</p>
            ) : (
              <div className="exercise-rows">
                {blockedUsers.map(b => (
                  <div className="exercise-row" key={b.id} style={{ alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar id={b.avatar} size={42} />
                      <div>
                        <strong>{b.full_name}</strong>
                        <span>@{b.username} · <strong>ID: #{b.id}</strong></span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={() => handleUnblockUser(b.id, b.full_name)}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* LOOKUP DEMO */}
      {activeTab === 'lookup' && (
        <section className="card form-section">
          <div className="form-section-heading">
            <span className="section-icon"><Icon name="history" size={20} /></span>
            <div>
              <h2>User comments lookup</h2>
              <p className="field-footnote">Given User ID, executes SQL query returning 5 most recent comments/feedback.</p>
            </div>
          </div>

          <form onSubmit={handleLookupComments} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ width: 200 }}>
              <Field
                label="User ID"
                name="lookup_user_id"
                type="number"
                min={1}
                required
                placeholder="e.g. 1"
                value={lookupId}
                onChange={e => setLookupId(e.target.value)}
              />
            </div>
            <button className="button button-secondary" style={{ marginBottom: 4 }}>
              Fetch comments
            </button>
          </form>

          {lookupComments.length > 0 && (
            <div className="exercise-rows" style={{ marginTop: 16 }}>
              {lookupComments.map(c => (
                <div className="exercise-row" key={c.id}>
                  <div>
                    <strong>&ldquo;{c.body}&rdquo;</strong>
                    <span>Workout on {c.workout_date ? new Date(`${c.workout_date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                  </div>
                  <span className="pill">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
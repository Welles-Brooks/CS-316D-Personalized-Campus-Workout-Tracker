'use server';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function register(prevState, formData) {
  const email = formData.get('email').trim().toLowerCase();
  const username = formData.get('username').trim();
  const fullName = formData.get('full_name').trim();
  const password = formData.get('password');

  const taken = db.prepare('SELECT 1 FROM users WHERE email = ? OR username = ?').get(email, username);
  if (taken) return { error: 'Email or username already in use.' };

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, username, full_name, password_hash) VALUES (?, ?, ?, ?)'
  ).run(email, username, fullName, hash);

  const session = await getSession();
  session.userId = result.lastInsertRowid;
  await session.save();
  redirect('/profile');
}
// Duke HRL: East Campus Houses and Upperclass Quad Descriptions.
// https://students.duke.edu/living/housing/first-year-housing/east-campus-houses/
// https://students.duke.edu/living/housing/upperclass-housing/quad-descriptions/
export const residenceGroups = [
  { label: 'East Campus', options: ['Alspaugh', 'Bassett', 'Bell Tower', 'Blackwell', 'Brown', 'East House', 'Gilbert-Addoms', 'Giles', 'Pegram', 'Randolph', 'Southgate', 'Trinity', 'West House', 'Wilson'] },
  { label: 'West Campus', options: ['Craven', 'Crowell', 'Edens', 'Few', 'Hollows', 'Keohane', 'Kilgo', 'Wannamaker'] },
  { label: 'Other Duke housing', options: ['300 Swift', '301 Swift', 'Smart Home', 'The Blue Light'] },
  { label: 'Off-campus', options: ['Off-campus'] },
];
export const residences = residenceGroups.flatMap(group => group.options);
export const avatars = [
  { id: 'duke-d', name: 'Duke D', group: 'Duke-themed', background: '#012169', mark: 'D' },
  { id: 'duke-chapel', name: 'Chapel', group: 'Duke-themed', background: '#012169', mark: 'chapel' },
  { id: 'duke-devil', name: 'Blue Devil', group: 'Duke-themed', background: '#012169', mark: 'devil' },
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => ({
    id: `letter-${letter.toLowerCase()}`, name: letter, group: 'Letters', background: '#e2eaff', mark: letter,
  })),
];
export const defaultAvatar = 'letter-a';
// Keep existing profiles editable while replacing their old portrait with a letter.
export const legacyAvatars: Record<string, string> = {
  avery: 'letter-a', jordan: 'letter-j', riley: 'letter-r', kai: 'letter-k', sage: 'letter-s', alex: 'letter-a',
};
export const resolveAvatar = (id: string) => legacyAvatars[id] || (avatars.some(a => a.id === id) ? id : defaultAvatar);

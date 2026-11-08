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
  { id: 'avery', name: 'Avery', background: '#dce9ff', skin: '#edb98a', hair: '#322621', shirt: '#2458ce', style: 0 },
  { id: 'jordan', name: 'Jordan', background: '#e7e1fa', skin: '#875535', hair: '#231c21', shirt: '#8565bd', style: 1 },
  { id: 'riley', name: 'Riley', background: '#fce9ce', skin: '#f3cfa5', hair: '#a65f36', shirt: '#b96940', style: 2 },
  { id: 'kai', name: 'Kai', background: '#d9eee7', skin: '#bf845d', hair: '#252d38', shirt: '#32866d', style: 0 },
  { id: 'sage', name: 'Sage', background: '#f8dfe9', skin: '#663c2a', hair: '#241c1a', shirt: '#ae577e', style: 2 },
  { id: 'alex', name: 'Alex', background: '#e0e9f0', skin: '#eac29d', hair: '#534334', shirt: '#52748a', style: 1 },
];
export const defaultAvatar = 'avery';

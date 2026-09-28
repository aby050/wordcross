import type { ThemeId } from './store';

export type Theme = {
  id: ThemeId; name: string;
  bg: [string, string]; // screen gradient
  board: string; // grid backing + blocked squares
  cell: string; cellText: string; number: string;
  word: string; // current word highlight
  selected: string; // current cell
  wrong: string;
  headerText: string;
  label: string; // name colour on the picker card
};

export const THEMES: Theme[] = [
  { id: 'classic', name: 'Classic', bg: ['#1C2340', '#0E1326'], board: '#0B0F1E', cell: '#FFFFFF', cellText: '#101426', number: '#6B7280',
    word: '#DCE6FF', selected: '#F7D23E', wrong: '#E5484D', headerText: '#FFFFFF', label: '#101426' },
  { id: 'blossom', name: 'Blossom', bg: ['#FFE3EC', '#FFC7D9'], board: '#F7A8C0', cell: '#FFF7FA', cellText: '#6B2340', number: '#C2728F',
    word: '#FFDCE7', selected: '#FF8FB1', wrong: '#D93A5E', headerText: '#6B2340', label: '#D9467A' },
  { id: 'forest', name: 'Forest', bg: ['#1F4D33', '#12301F'], board: '#0E2518', cell: '#EEF6E9', cellText: '#163A25', number: '#5E7D69',
    word: '#CFE8C3', selected: '#9BD46C', wrong: '#E0564B', headerText: '#F0FFF2', label: '#1F4D33' },
  { id: 'ocean', name: 'Ocean', bg: ['#3AA8F0', '#1767C9'], board: '#0F4E9C', cell: '#F2FAFF', cellText: '#0B3A6E', number: '#5B86B3',
    word: '#CDEBFF', selected: '#5CD3F5', wrong: '#E5484D', headerText: '#FFFFFF', label: '#1767C9' },
  { id: 'night', name: 'Night', bg: ['#2A2566', '#110E33'], board: '#0C0A26', cell: '#E9E7FF', cellText: '#1E1A4D', number: '#7C77B8',
    word: '#C9C4FF', selected: '#FFC857', wrong: '#FF6B6B', headerText: '#FFFFFF', label: '#1E1A4D' },
  { id: 'paper', name: 'Paper', bg: ['#F4EBDD', '#E8D9C0'], board: '#B89B74', cell: '#FFFBF3', cellText: '#4A3A24', number: '#9C8665',
    word: '#F1E2C8', selected: '#E3B96B', wrong: '#C4473A', headerText: '#4A3A24', label: '#4A3A24' },
];

export const themeById = (id: ThemeId) => THEMES.find((t) => t.id === id) ?? THEMES[0];

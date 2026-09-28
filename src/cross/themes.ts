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

// Boards are translucent so each theme's scenery shows through behind the grid.
export const THEMES: Theme[] = [
  { id: 'classic', name: 'Classic', bg: ['#3B2F7A', '#5E4A8A'], board: 'rgba(18,14,44,0.72)', cell: '#FFFFFF', cellText: '#1A1640', number: '#6B7280',
    word: '#DCE3FF', selected: '#F7D23E', wrong: '#E5484D', headerText: '#FFFFFF', label: '#3B2F7A' },
  { id: 'forest', name: 'Nature', bg: ['#4E9E62', '#1F5A36'], board: 'rgba(10,40,22,0.7)', cell: '#F1F8EC', cellText: '#163A25', number: '#5E7D69',
    word: '#CFE8C3', selected: '#A6E07A', wrong: '#E0564B', headerText: '#FFFFFF', label: '#1F6B3A' },
  { id: 'blossom', name: 'Blossom', bg: ['#FFD6E4', '#FFC2D6'], board: 'rgba(214,92,136,0.55)', cell: '#FFF7FA', cellText: '#6B2340', number: '#C2728F',
    word: '#FFDCE7', selected: '#FF8FB1', wrong: '#D93A5E', headerText: '#6B2340', label: '#D9467A' },
  { id: 'ocean', name: 'Ocean', bg: ['#5FD0F5', '#0B4E9C'], board: 'rgba(6,50,110,0.6)', cell: '#F2FAFF', cellText: '#0B3A6E', number: '#5B86B3',
    word: '#CDEBFF', selected: '#5CD3F5', wrong: '#E5484D', headerText: '#FFFFFF', label: '#1767C9' },
  { id: 'night', name: 'Night', bg: ['#0B0930', '#3B2F8F'], board: 'rgba(8,6,32,0.7)', cell: '#E9E7FF', cellText: '#1E1A4D', number: '#7C77B8',
    word: '#C9C4FF', selected: '#FFC857', wrong: '#FF6B6B', headerText: '#FFFFFF', label: '#2A2566' },
  { id: 'autumn', name: 'Autumn', bg: ['#FFB35C', '#B8452A'], board: 'rgba(90,30,12,0.62)', cell: '#FFF6EC', cellText: '#5A2A14', number: '#B0714A',
    word: '#FFE0C2', selected: '#FFB347', wrong: '#C4302B', headerText: '#FFFFFF', label: '#C8562D' },
  { id: 'paper', name: 'Wood', bg: ['#C79A6B', '#A87B4F'], board: 'rgba(70,42,20,0.6)', cell: '#FFFBF3', cellText: '#4A3A24', number: '#9C8665',
    word: '#F1E2C8', selected: '#E3B96B', wrong: '#C4473A', headerText: '#FFFFFF', label: '#6E4A2A' },
];

export const themeById = (id: ThemeId) => THEMES.find((t) => t.id === id) ?? THEMES[0];

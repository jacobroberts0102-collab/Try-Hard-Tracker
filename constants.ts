
import { ThemeName } from './types';

export const THEMES: Record<ThemeName, { primary: string; secondary: string; background: string; text: string; card: string; muted: string }> = {
  Light: {
    primary: '#4F46E5',
    secondary: '#818CF8',
    background: '#F8FAFC',
    text: '#0F172A',
    card: '#FFFFFF',
    muted: '#64748B',
  },
  Dark: {
    primary: '#6366F1',
    secondary: '#818CF8',
    background: '#000000',
    text: '#F8FAFC',
    card: '#121212',
    muted: '#94A3B8',
  },
  Midnight: {
    primary: '#818CF8', 
    secondary: '#A5B4FC',
    background: '#020617', 
    text: '#FFFFFF', 
    card: '#0F172A', 
    muted: '#94A3B8', 
  },
  Cyber: {
    primary: '#F0ABFC',
    secondary: '#E879F9',
    background: '#09090B',
    text: '#FAFAFA',
    card: '#18181B',
    muted: '#A1A1AA',
  },
  Matcha: {
    primary: '#15803D',
    secondary: '#22C55E',
    background: '#F0FDF4',
    text: '#064E3B',
    card: '#FFFFFF',
    muted: '#166534',
  },
  Rose: {
    primary: '#E11D48',
    secondary: '#FB7185',
    background: '#FFF1F2',
    text: '#4C0519',
    card: '#FFFFFF',
    muted: '#9F1239',
  },
  Ocean: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    background: '#082F49',
    text: '#F0F9FF',
    card: '#0C4A6E',
    muted: '#7DD3FC',
  },
  Forest: {
    primary: '#10B981',
    secondary: '#34D399',
    background: '#022C22',
    text: '#ECFDF5',
    card: '#064E3B',
    muted: '#A7F3D0',
  }
};

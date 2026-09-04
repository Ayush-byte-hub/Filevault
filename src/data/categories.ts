import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'games',
    slug: 'games',
    name: 'Games',
    description: 'Verified indie titles, arcade builds, open-source games, and interactive mods.',
    iconName: 'Gamepad2',
  },
  {
    id: 'apps',
    slug: 'apps',
    name: 'Apps',
    description: 'Cross-platform desktop tools, productivity utilities, mobile APKs, and UI widgets.',
    iconName: 'LayoutGrid',
  },
  {
    id: 'software',
    slug: 'software',
    name: 'Software',
    description: 'Development toolchains, creative media editors, system optimizers, and compilers.',
    iconName: 'Code2',
  },
  {
    id: 'documents',
    slug: 'documents',
    name: 'Documents',
    description: 'Technical whitepapers, design kits, cheat sheets, manual guides, and PDF resources.',
    iconName: 'FileText',
  },
  {
    id: 'videos',
    slug: 'videos',
    name: 'Videos',
    description: 'Royalty-free B-roll, 4K motion graphics, video assets, and creative film presets.',
    iconName: 'Film',
  },
  {
    id: 'music',
    slug: 'music',
    name: 'Music',
    description: 'Open-license audio tracks, sound effects, instrument stems, and podcasts.',
    iconName: 'Music',
  },
  {
    id: 'other',
    slug: 'other',
    name: 'Other',
    description: 'Archives, dataset bundles, custom presets, fonts, and miscellaneous files.',
    iconName: 'FolderArchive',
  },
];

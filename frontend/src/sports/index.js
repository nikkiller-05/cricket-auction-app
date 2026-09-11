import { cricket } from './cricket';

// Sport Pack registry. Cricket is the default; new sports register here and the
// common auction screens read all sport-specific taxonomy from the active pack.
const PACKS = {
  cricket,
};

export const DEFAULT_SPORT = 'cricket';

export const getSportPack = (key) => PACKS[key] || PACKS[DEFAULT_SPORT];

// The active sport's team icon (used by inline team chips across the app).
export const getTeamIcon = (key) => getSportPack(key).teamIcon;

export const listSports = () => Object.values(PACKS).map(({ key, label }) => ({ key, label }));

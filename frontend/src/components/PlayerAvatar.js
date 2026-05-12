import React, { useState } from 'react';

/**
 * PlayerAvatar
 * Displays the player's image when available, otherwise renders a colored
 * circle with the player's initials. Falls back to initials if the image
 * fails to load.
 *
 * Props:
 *   - player: { id, name, imageUrl }
 *   - size: tailwind size class set ('sm' | 'md' | 'lg' | 'xl')
 *   - className: extra classes to apply to the wrapper
 */
const SIZES = {
  sm: { box: 'w-8 h-8', text: 'text-xs' },
  md: { box: 'w-12 h-12', text: 'text-sm' },
  lg: { box: 'w-20 h-20', text: 'text-xl' },
  xl: { box: 'w-32 h-32', text: 'text-3xl' },
};

const GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-purple-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-red-600',
  'from-indigo-500 to-purple-600',
  'from-rose-500 to-fuchsia-600',
  'from-yellow-500 to-orange-600',
  'from-green-500 to-emerald-600',
];

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const getGradient = (id = '') => {
  const key = String(id);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
};

const PlayerAvatar = ({ player = {}, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const dim = SIZES[size] || SIZES.md;
  const showImage = player.imageUrl && !imgError;

  return (
    <div
      className={`${dim.box} rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-white shadow-md ${className}`}
    >
      {showImage ? (
        <img
          src={player.imageUrl}
          alt={player.name || 'Player'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className={`w-full h-full bg-gradient-to-br ${getGradient(
            player.id || player.name
          )} text-white font-bold flex items-center justify-center ${dim.text}`}
        >
          {getInitials(player.name) || '?'}
        </div>
      )}
    </div>
  );
};

export default PlayerAvatar;

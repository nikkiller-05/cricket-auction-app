import React from 'react';
import { getSportPack } from '../sports';

/**
 * PlayerNameLink
 * Renders the player's name as a link to their external profile (provider comes
 * from the active Sport Pack — CricHeroes for cricket) when one exists,
 * otherwise plain text. Use this everywhere the player's name is displayed.
 *
 * Props:
 *   - player: { name, [pack.externalProfile.urlKey] }
 *   - className: optional Tailwind classes for the underlying element
 *   - linkClassName: classes applied only when rendering as <a>
 *   - children: optional - if provided, replaces the default {name} content
 *               (useful for adding icons / suffix nodes next to the name)
 */
const PlayerNameLink = ({
  player,
  className = '',
  linkClassName = 'text-blue-600 hover:text-blue-800 hover:underline transition-colors',
  children,
}) => {
  if (!player) return null;
  const content = children ?? player.name;
  const profile = getSportPack('cricket').externalProfile;
  const profileUrl = player[profile.urlKey];
  if (profileUrl) {
    return (
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${player.name} on ${profile.label}`}
        className={`${linkClassName} ${className}`.trim()}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }
  return <span className={className}>{content}</span>;
};

export default PlayerNameLink;

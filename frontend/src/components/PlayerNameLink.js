import React from 'react';

/**
 * PlayerNameLink
 * Renders the player's name as a link to their CricHeroes profile when one
 * exists, otherwise plain text. Use this everywhere the player's name is
 * displayed so users can always click through to verify stats.
 *
 * Props:
 *   - player: { name, cricHeroesLink }
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
  if (player.cricHeroesLink) {
    return (
      <a
        href={player.cricHeroesLink}
        target="_blank"
        rel="noopener noreferrer"
        title={`View ${player.name} on CricHeroes`}
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

import React from 'react';
import { getSportPack } from '../../sports';
import { cleanTeamName } from '../../lib/format';
import { getTeamStyle } from '../players/categories';

// Colored team pill with the sport's team icon + cleaned team name. The icon
// comes from the active Sport Pack so non-cricket sports show their own.
const TeamChip = ({ teamId, teams, name, fallback = '', className = '' }) => {
  const { teamIcon } = getSportPack('cricket');
  return (
    <span className={`${className} ${getTeamStyle(teamId, teams)}`}>
      {teamIcon} {cleanTeamName(name) || fallback}
    </span>
  );
};

export default TeamChip;

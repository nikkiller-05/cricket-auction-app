const determineCategory = (role) => {
    if (!role) return 'other';
    
    const roleText = role.toLowerCase();

    // PRIORITY: Check for captain FIRST (regardless of other roles)
    if (roleText.includes('captain')) return 'captain';
    
    // Then check for other categories
    if (roleText.includes('keeper') || roleText.includes('wicket') || roleText.includes('wk')) return 'wicket-keeper';
    if (roleText.includes('batter') || roleText.includes('batsman')) return 'batter';
    if (roleText.includes('bowler')) return 'bowler';
    if (roleText.includes('allrounder') || roleText.includes('all-rounder')) return 'allrounder';
    
    return 'other';
  };
  
  module.exports = {
    determineCategory
  };
  
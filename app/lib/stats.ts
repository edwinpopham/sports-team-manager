// Statistics utilities for team and player data analysis
import { Team, Player, TeamStats } from '../types';

/**
 * Calculate advanced team statistics
 */
export function calculateAdvancedTeamStats(team: Team): TeamStats & {
  positionDepth: Record<string, number>;
  jerseyNumbersUsed: number[];
  recentActivity: {
    playersAddedThisWeek: number;
    playersAddedThisMonth: number;
  };
} {
  const baseStats = calculateBasicTeamStats(team);

  // Calculate position depth
  const positionDepth: Record<string, number> = {};
  team.players
    .filter(p => p.isActive && p.position)
    .forEach(player => {
      positionDepth[player.position!] = (positionDepth[player.position!] || 0) + 1;
    });

  // Get jersey numbers in use
  const jerseyNumbersUsed = team.players
    .filter(p => p.isActive && p.jerseyNumber !== undefined && p.jerseyNumber !== null)
    .map(p => p.jerseyNumber!)
    .sort((a, b) => a - b);

  // Calculate recent activity
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const playersAddedThisWeek = team.players.filter(p => 
    new Date(p.dateAdded) >= oneWeekAgo
  ).length;

  const playersAddedThisMonth = team.players.filter(p => 
    new Date(p.dateAdded) >= oneMonthAgo
  ).length;

  return {
    ...baseStats,
    positionDepth,
    jerseyNumbersUsed,
    recentActivity: {
      playersAddedThisWeek,
      playersAddedThisMonth
    }
  };
}

/**
 * Calculate basic team statistics
 */
export function calculateBasicTeamStats(team: Team): TeamStats {
  const stats: TeamStats = {
    totalPlayers: team.players.length,
    activePlayers: team.players.filter(p => p.isActive).length,
    inactivePlayers: team.players.filter(p => !p.isActive).length,
  };

  // Calculate position counts if positions are provided
  if (team.players.length > 0) {
    stats.positionCounts = {};
    team.players
      .filter(p => p.position)
      .forEach(player => {
        stats.positionCounts![player.position!] = (stats.positionCounts![player.position!] || 0) + 1;
      });
  }

  return stats;
}

/**
 * Calculate player statistics for a team
 */
export function calculatePlayerStats(players: Player[]): {
  totalCount: number;
  activeCount: number;
  positionDistribution: Record<string, number>;
  jerseyNumberGaps: number[];
  contactInfoComplete: number;
} {
  const activeCountResult = players.filter(p => p.isActive).length;

  // Position distribution
  const positionDistribution: Record<string, number> = {};
  players
    .filter(p => p.position)
    .forEach(player => {
      positionDistribution[player.position!] = (positionDistribution[player.position!] || 0) + 1;
    });

  // Find jersey number gaps
  const usedNumbers = players
    .filter(p => p.jerseyNumber !== undefined && p.jerseyNumber !== null)
    .map(p => p.jerseyNumber!)
    .sort((a, b) => a - b);

  const jerseyNumberGaps: number[] = [];
  for (let i = 1; i <= 99; i++) {
    if (!usedNumbers.includes(i)) {
      jerseyNumberGaps.push(i);
    }
  }

  // Count players with complete contact info
  const contactInfoComplete = players.filter(p => 
    p.email || p.phone
  ).length;

  return {
    totalCount: players.length,
    activeCount: activeCountResult,
    positionDistribution,
    jerseyNumberGaps: jerseyNumberGaps.slice(0, 10), // Show first 10 available numbers
    contactInfoComplete
  };
}

/**
 * Generate team performance insights
 */
export function generateTeamInsights(team: Team): {
  recommendations: string[];
  warnings: string[];
  strengths: string[];
} {
  const stats = calculateAdvancedTeamStats(team);
  const recommendations: string[] = [];
  const warnings: string[] = [];
  const strengths: string[] = [];

  // Check roster size
  if (stats.activePlayers < 11) {
    warnings.push(`Team needs more players (${stats.activePlayers}/11 minimum)`);
    recommendations.push('Consider recruiting additional players to meet minimum roster requirements');
  } else if (stats.activePlayers >= 15) {
    strengths.push('Good roster depth with adequate player coverage');
  }

  // Check position coverage
  const positions = Object.keys(stats.positionDepth);
  if (positions.length < 3) {
    recommendations.push('Consider adding players in different positions for better team balance');
  } else if (positions.length >= 5) {
    strengths.push('Well-balanced team with good position coverage');
  }

  // Check recent activity
  if (stats.recentActivity.playersAddedThisMonth === 0 && stats.activePlayers < 15) {
    recommendations.push('Consider recruiting new players to strengthen the roster');
  }

  // Check jersey number organization
  if (stats.jerseyNumbersUsed.length !== stats.activePlayers) {
    recommendations.push('Assign jersey numbers to all active players for better organization');
  }

  return {
    recommendations,
    warnings,
    strengths
  };
}

/**
 * Compare teams for ranking or analysis
 */
export function compareTeams(teams: Team[]): {
  bySize: Team[];
  byActivity: Team[];
  byCompleteness: Team[];
} {
  const bySize = [...teams].sort((a, b) => {
    const statsA = calculateBasicTeamStats(a);
    const statsB = calculateBasicTeamStats(b);
    return statsB.activePlayers - statsA.activePlayers;
  });

  const byActivity = [...teams].sort((a, b) => {
    const lastActivityA = Math.max(...a.players.map(p => new Date(p.dateAdded).getTime()));
    const lastActivityB = Math.max(...b.players.map(p => new Date(p.dateAdded).getTime()));
    return lastActivityB - lastActivityA;
  });

  const byCompleteness = [...teams].sort((a, b) => {
    const completenessA = calculateTeamCompleteness(a);
    const completenessB = calculateTeamCompleteness(b);
    return completenessB - completenessA;
  });

  return {
    bySize,
    byActivity,
    byCompleteness
  };
}

/**
 * Calculate team completeness score (0-100)
 */
function calculateTeamCompleteness(team: Team): number {
  let score = 0;
  const maxScore = 100;

  // Basic info (30 points)
  if (team.name) score += 10;
  if (team.description) score += 10;
  if (team.coach) score += 5;
  if (team.season) score += 5;

  // Player count (40 points)
  const playerScore = Math.min(team.players.length / 15 * 40, 40); // Max 40 points for 15+ players
  score += playerScore;

  // Player details (30 points)
  const playersWithDetails = team.players.filter(p => 
    p.position || p.email || p.phone || p.jerseyNumber !== undefined
  ).length;
  const detailScore = team.players.length > 0 
    ? (playersWithDetails / team.players.length) * 30 
    : 0;
  score += detailScore;

  return Math.round(score);
}

/**
 * Get available positions based on common sports formations
 */
export function getCommonPositions(sport: string = 'soccer'): string[] {
  const positions: Record<string, string[]> = {
    soccer: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    football: ['Quarterback', 'Running Back', 'Wide Receiver', 'Tight End', 'Offensive Line', 'Defensive Line', 'Linebacker', 'Cornerback', 'Safety'],
    basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
    baseball: ['Pitcher', 'Catcher', 'First Base', 'Second Base', 'Third Base', 'Shortstop', 'Left Field', 'Center Field', 'Right Field'],
    hockey: ['Goalie', 'Defenseman', 'Left Wing', 'Right Wing', 'Center'],
    volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
    default: ['Position 1', 'Position 2', 'Position 3', 'Position 4', 'Position 5']
  };

  return positions[sport.toLowerCase()] || positions.default;
}
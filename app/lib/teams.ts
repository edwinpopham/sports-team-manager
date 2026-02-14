// Team and player utility functions
import { Team, Player, TeamStats } from '../types/index';

/**
 * Calculate comprehensive team statistics
 */
export function calculateTeamStats(team: Team): TeamStats {
  const stats: TeamStats = {
    totalPlayers: team.players.length,
    activePlayers: team.players.filter(p => p.isActive).length,
    inactivePlayers: team.players.filter(p => !p.isActive).length,
  };

  // Calculate position counts if positions are provided
  if (team.players.length > 0) {
    stats.positionCounts = {};
    team.players.forEach(player => {
      if (player.position) {
        stats.positionCounts![player.position] = (stats.positionCounts![player.position] || 0) + 1;
      }
    });
  }

  return stats;
}

/**
 * Validate team data before creation/update
 */
export function validateTeam(team: Partial<Team>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!team.name || team.name.trim().length === 0) {
    errors.push('Team name is required');
  }

  if (team.name && team.name.trim().length > 100) {
    errors.push('Team name must be 100 characters or less');
  }

  if (team.description && team.description.length > 500) {
    errors.push('Team description must be 500 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate player data before creation/update
 */
export function validatePlayer(player: Partial<Player>, existingPlayers: Player[] = []): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!player.name || player.name.trim().length === 0) {
    errors.push('Player name is required');
  }

  if (player.name && player.name.trim().length > 100) {
    errors.push('Player name must be 100 characters or less');
  }

  if (player.email && !isValidEmail(player.email)) {
    errors.push('Invalid email format');
  }

  if (player.phone && !isValidPhone(player.phone)) {
    errors.push('Invalid phone number format');
  }

  if (player.jerseyNumber !== undefined && player.jerseyNumber !== null) {
    if (player.jerseyNumber < 0 || player.jerseyNumber > 99) {
      errors.push('Jersey number must be between 0 and 99');
    }

    // Check for duplicate jersey numbers (excluding current player if updating)
    const duplicate = existingPlayers.find(p => 
      p.id !== player.id && 
      p.jerseyNumber === player.jerseyNumber &&
      p.isActive
    );
    if (duplicate) {
      errors.push(`Jersey number ${player.jerseyNumber} is already taken by ${duplicate.name}`);
    }
  }

  if (player.notes && player.notes.length > 1000) {
    errors.push('Notes must be 1000 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sort teams by preference (active first, then by name)
 */
export function sortTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    // Active teams first
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    // Then alphabetically by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Sort players with flexible options
 */
export function sortPlayers(
  players: Player[], 
  sortBy: 'name' | 'position' | 'jerseyNumber' | 'dateAdded' = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
): Player[] {
  return [...players].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'position':
        const posA = a.position || '';
        const posB = b.position || '';
        comparison = posA.localeCompare(posB);
        break;
      case 'jerseyNumber':
        const numA = a.jerseyNumber ?? 999; // Put players without numbers at end
        const numB = b.jerseyNumber ?? 999;
        comparison = numA - numB;
        break;
      case 'dateAdded':
        comparison = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });
}

/**
 * Filter players by criteria
 */
export function filterPlayers(players: Player[], filters: {
  isActive?: boolean;
  position?: string;
  searchTerm?: string;
}): Player[] {
  let filtered = players;

  if (filters.isActive !== undefined) {
    filtered = filtered.filter(p => p.isActive === filters.isActive);
  }

  if (filters.position) {
    filtered = filtered.filter(p => p.position === filters.position);
  }

  if (filters.searchTerm) {
    const searchTerm = filters.searchTerm.toLowerCase().trim();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(searchTerm) ||
      (p.email && p.email.toLowerCase().includes(searchTerm)) ||
      (p.position && p.position.toLowerCase().includes(searchTerm)) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm))
    );
  }

  return filtered;
}

/**
 * Get available jersey numbers for a team
 */
export function getAvailableJerseyNumbers(team: Team, maxNumber: number = 99): number[] {
  const takenNumbers = new Set(
    team.players
      .filter(p => p.isActive && p.jerseyNumber !== undefined && p.jerseyNumber !== null)
      .map(p => p.jerseyNumber!)
  );

  const available: number[] = [];
  for (let i = 1; i <= maxNumber; i++) {
    if (!takenNumbers.has(i)) {
      available.push(i);
    }
  }

  return available;
}

/**
 * Get team summary for listings
 */
export function getTeamSummary(team: Team): {
  name: string;
  playerCount: number;
  activePlayerCount: number;
  mostRecentActivity: string;
  hasFullRoster: boolean;
} {
  const stats = calculateTeamStats(team);
  
  // Find most recent player activity
  const mostRecentDate = team.players.length > 0
    ? Math.max(...team.players.map(p => new Date(p.dateAdded).getTime()))
    : new Date(team.dateCreated).getTime();

  return {
    name: team.name,
    playerCount: stats.totalPlayers,
    activePlayerCount: stats.activePlayers,
    mostRecentActivity: new Date(mostRecentDate).toLocaleDateString(),
    hasFullRoster: stats.activePlayers >= 11 // Assuming minimum team size
  };
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\d\s\-\(\)\+\.]{10,}$/;
  return phoneRegex.test(phone);
}
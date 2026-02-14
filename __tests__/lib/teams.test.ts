import {
  calculateTeamStats,
  validateTeam,
  validatePlayer,
  sortTeams,
  sortPlayers,
  filterPlayers,
  getAvailableJerseyNumbers,
  getTeamSummary
} from '../../app/lib/teams';
import { Team, Player } from '../../app/types/index';

describe('teams utilities', () => {
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      position: 'Forward',
      jerseyNumber: 10,
      isActive: true,
      dateAdded: '2024-01-15T10:00:00.000Z',
    },
    {
      id: 'player-2',
      name: 'Bob Wilson',
      position: 'Defense',
      jerseyNumber: 5,
      isActive: false,
      dateAdded: '2024-01-16T10:00:00.000Z',
    },
    {
      id: 'player-3',
      name: 'Charlie Brown',
      position: 'Forward',
      jerseyNumber: 7,
      isActive: true,
      dateAdded: '2024-01-17T10:00:00.000Z',
    }
  ];

  const mockTeam: Team = {
    id: 'team-1',
    name: 'Warriors',
    dateCreated: '2024-01-01T00:00:00.000Z',
    players: mockPlayers,
    isActive: true
  };

  describe('calculateTeamStats', () => {
    it('calculates basic team statistics correctly', () => {
      const stats = calculateTeamStats(mockTeam);
      
      expect(stats.totalPlayers).toBe(3);
      expect(stats.activePlayers).toBe(2);
      expect(stats.inactivePlayers).toBe(1);
    });

    it('calculates position counts correctly', () => {
      const stats = calculateTeamStats(mockTeam);
      
      expect(stats.positionCounts).toEqual({
        Forward: 2,
        Defense: 1
      });
    });

    it('handles empty team correctly', () => {
      const emptyTeam: Team = {
        ...mockTeam,
        players: []
      };
      
      const stats = calculateTeamStats(emptyTeam);
      
      expect(stats.totalPlayers).toBe(0);
      expect(stats.activePlayers).toBe(0);
      expect(stats.inactivePlayers).toBe(0);
      expect(stats.positionCounts).toBeUndefined();
    });

    it('handles players without positions', () => {
      const playersWithoutPositions: Player[] = [
        {
          id: 'player-1',
          name: 'Test Player',
          isActive: true,
          dateAdded: '2024-01-01T00:00:00.000Z'
        }
      ];

      const team: Team = {
        ...mockTeam,
        players: playersWithoutPositions
      };
      
      const stats = calculateTeamStats(team);
      
      expect(stats.totalPlayers).toBe(1);
      expect(stats.positionCounts).toEqual({});
    });
  });

  describe('validateTeam', () => {
    it('validates valid team data', () => {
      const result = validateTeam({
        name: 'Valid Team',
        description: 'A good team'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty team name', () => {
      const result = validateTeam({
        name: ''
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name is required');
    });

    it('rejects whitespace-only team name', () => {
      const result = validateTeam({
        name: '   '
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name is required');
    });

    it('rejects team name that is too long', () => {
      const result = validateTeam({
        name: 'A'.repeat(101)
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name must be 100 characters or less');
    });

    it('rejects description that is too long', () => {
      const result = validateTeam({
        name: 'Valid Team',
        description: 'A'.repeat(501)
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team description must be 500 characters or less');
    });

    it('handles missing team name', () => {
      const result = validateTeam({
        description: 'Team without name'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Team name is required');
    });
  });

  describe('validatePlayer', () => {
    it('validates valid player data', () => {
      const result = validatePlayer({
        name: 'Valid Player',
        email: 'player@example.com',
        phone: '555-123-4567',
        jerseyNumber: 15
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty player name', () => {
      const result = validatePlayer({
        name: ''
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player name is required');
    });

    it('rejects invalid email format', () => {
      const result = validatePlayer({
        name: 'Valid Player',
        email: 'invalid-email'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('accepts valid email formats', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];
      
      validEmails.forEach(email => {
        const result = validatePlayer({
          name: 'Valid Player',
          email
        });
        
        expect(result.isValid).toBe(true);
      });
    });

    it('rejects invalid jersey numbers', () => {
      const result1 = validatePlayer({
        name: 'Valid Player',
        jerseyNumber: -1
      });
      
      const result2 = validatePlayer({
        name: 'Valid Player',
        jerseyNumber: 100
      });
      
      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain('Jersey number must be between 0 and 99');
      
      expect(result2.isValid).toBe(false);
      expect(result2.errors).toContain('Jersey number must be between 0 and 99');
    });

    it('detects duplicate jersey numbers', () => {
      const existingPlayers: Player[] = [
        {
          id: 'existing',
          name: 'Existing Player',
          jerseyNumber: 10,
          isActive: true,
          dateAdded: '2024-01-01T00:00:00.000Z'
        }
      ];
      
      const result = validatePlayer({
        name: 'New Player',
        jerseyNumber: 10
      }, existingPlayers);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Jersey number 10 is already taken by Existing Player');
    });

    it('allows duplicate jersey numbers for inactive players', () => {
      const existingPlayers: Player[] = [
        {
          id: 'existing',
          name: 'Inactive Player',
          jerseyNumber: 10,
          isActive: false,
          dateAdded: '2024-01-01T00:00:00.000Z'
        }
      ];
      
      const result = validatePlayer({
        name: 'New Player',
        jerseyNumber: 10
      }, existingPlayers);
      
      expect(result.isValid).toBe(true);
    });

    it('rejects notes that are too long', () => {
      const result = validatePlayer({
        name: 'Valid Player',
        notes: 'A'.repeat(1001)
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Notes must be 1000 characters or less');
    });
  });

  describe('sortTeams', () => {
    it('sorts teams with active teams first', () => {
      const teams: Team[] = [
        { ...mockTeam, id: '1', name: 'Zebras', isActive: false },
        { ...mockTeam, id: '2', name: 'Bears', isActive: true },
        { ...mockTeam, id: '3', name: 'Ants', isActive: false },
        { ...mockTeam, id: '4', name: 'Dogs', isActive: true }
      ];
      
      const sorted = sortTeams(teams);
      
      expect(sorted[0].name).toBe('Bears');
      expect(sorted[1].name).toBe('Dogs');
      expect(sorted[2].name).toBe('Ants');
      expect(sorted[3].name).toBe('Zebras');
    });

    it('sorts alphabetically within active/inactive groups', () => {
      const teams: Team[] = [
        { ...mockTeam, id: '1', name: 'Zebras', isActive: true },
        { ...mockTeam, id: '2', name: 'Ants', isActive: true }
      ];
      
      const sorted = sortTeams(teams);
      
      expect(sorted[0].name).toBe('Ants');
      expect(sorted[1].name).toBe('Zebras');
    });
  });

  describe('sortPlayers', () => {
    it('sorts players by name ascending by default', () => {
      const sorted = sortPlayers(mockPlayers);
      
      expect(sorted[0].name).toBe('Alice Johnson');
      expect(sorted[1].name).toBe('Bob Wilson');
      expect(sorted[2].name).toBe('Charlie Brown');
    });

    it('sorts players by name descending', () => {
      const sorted = sortPlayers(mockPlayers, 'name', 'desc');
      
      expect(sorted[0].name).toBe('Charlie Brown');
      expect(sorted[1].name).toBe('Bob Wilson');
      expect(sorted[2].name).toBe('Alice Johnson');
    });

    it('sorts players by position', () => {
      const sorted = sortPlayers(mockPlayers, 'position');
      
      expect(sorted[0].position).toBe('Defense');
      expect(sorted[1].position).toBe('Forward');
      expect(sorted[2].position).toBe('Forward');
    });

    it('sorts players by jersey number', () => {
      const sorted = sortPlayers(mockPlayers, 'jerseyNumber');
      
      expect(sorted[0].jerseyNumber).toBe(5);
      expect(sorted[1].jerseyNumber).toBe(7);
      expect(sorted[2].jerseyNumber).toBe(10);
    });

    it('sorts players by date added', () => {
      const sorted = sortPlayers(mockPlayers, 'dateAdded');
      
      expect(sorted[0].name).toBe('Alice Johnson');
      expect(sorted[1].name).toBe('Bob Wilson');
      expect(sorted[2].name).toBe('Charlie Brown');
    });

    it('puts players without jersey numbers at the end', () => {
      const playersWithMissingNumbers: Player[] = [
        { ...mockPlayers[0], jerseyNumber: undefined },
        mockPlayers[1],
        mockPlayers[2]
      ];
      
      const sorted = sortPlayers(playersWithMissingNumbers, 'jerseyNumber');
      
      expect(sorted[0].jerseyNumber).toBe(5);
      expect(sorted[1].jerseyNumber).toBe(7);
      expect(sorted[2].jerseyNumber).toBeUndefined();
    });
  });

  describe('filterPlayers', () => {
    it('filters by active status', () => {
      const activeOnly = filterPlayers(mockPlayers, { isActive: true });
      const inactiveOnly = filterPlayers(mockPlayers, { isActive: false });
      
      expect(activeOnly).toHaveLength(2);
      expect(activeOnly.every(p => p.isActive)).toBe(true);
      
      expect(inactiveOnly).toHaveLength(1);
      expect(inactiveOnly.every(p => !p.isActive)).toBe(true);
    });

    it('filters by position', () => {
      const forwards = filterPlayers(mockPlayers, { position: 'Forward' });
      
      expect(forwards).toHaveLength(2);
      expect(forwards.every(p => p.position === 'Forward')).toBe(true);
    });

    it('filters by search term in name', () => {
      const filtered = filterPlayers(mockPlayers, { searchTerm: 'alice' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Alice Johnson');
    });

    it('filters by search term in email', () => {
      const filtered = filterPlayers(mockPlayers, { searchTerm: 'alice@example' });
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Alice Johnson');
    });

    it('filters by search term in position', () => {
      const filtered = filterPlayers(mockPlayers, { searchTerm: 'forward' });
      
      expect(filtered).toHaveLength(2);
    });

    it('combines multiple filters', () => {
      const filtered = filterPlayers(mockPlayers, {
        isActive: true,
        position: 'Forward'
      });
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(p => p.isActive && p.position === 'Forward')).toBe(true);
    });
  });

  describe('getAvailableJerseyNumbers', () => {
    it('returns available jersey numbers for a team', () => {
      const available = getAvailableJerseyNumbers(mockTeam);
      
      expect(available).toContain(5); // Bob's inactive jersey should be available
      expect(available).not.toContain(7); // Charlie's active jersey
      expect(available).not.toContain(10); // Alice's active jersey

      expect(available).toContain(1);
      expect(available).toContain(2);
      expect(available).toContain(3);
    });

    it('excludes numbers from active players only', () => {
      const available = getAvailableJerseyNumbers(mockTeam);
      
      // Jersey 5 belongs to inactive player Bob, so it should be available
      expect(available).toContain(5);
    });

    it('respects max number limit', () => {
      const available = getAvailableJerseyNumbers(mockTeam, 20);
      
      expect(available.length).toBeLessThanOrEqual(20);
      expect(available.every(num => num <= 20)).toBe(true);
    });
  });

  describe('getTeamSummary', () => {
    it('generates correct team summary', () => {
      const summary = getTeamSummary(mockTeam);
      
      expect(summary.name).toBe('Warriors');
      expect(summary.playerCount).toBe(3);
      expect(summary.activePlayerCount).toBe(2);
      expect(summary.hasFullRoster).toBe(false); // Less than 11 players
      expect(summary.mostRecentActivity).toBe('1/17/2024'); // Charlie's date
    });

    it('identifies full roster correctly', () => {
      const fullRosterPlayers = Array.from({ length: 12 }, (_, i) => ({
        id: `player-${i}`,
        name: `Player ${i}`,
        isActive: true,
        dateAdded: '2024-01-01T00:00:00.000Z'
      }));

      const fullTeam: Team = {
        ...mockTeam,
        players: fullRosterPlayers
      };
      
      const summary = getTeamSummary(fullTeam);
      
      expect(summary.hasFullRoster).toBe(true);
    });

    it('uses team creation date when no players', () => {
      const emptyTeam: Team = {
        ...mockTeam,
        players: []
      };
      
      const summary = getTeamSummary(emptyTeam);
      
      expect(summary.mostRecentActivity).toBe('1/1/2024');
    });
  });
});
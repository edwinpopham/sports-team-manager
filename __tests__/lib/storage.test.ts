import {
  getStorageData,
  saveStorageData, 
  getAllTeams,
  getTeamById,
  saveTeam,
  deleteTeam,
  addPlayerToTeam,
  updatePlayerInTeam,
  removePlayerFromTeam,
  getPlayerById,
  generateId,
  clearAllData
} from '../../app/lib/storage';
import { Team, Player, StorageData } from '../../app/types/index';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

const mockTeam: Team = {
  id: 'team-1',
  name: 'Warriors',
  dateCreated: '2024-01-01T00:00:00.000Z',
  players: [
    {
      id: 'player-1',
      name: 'Alice Johnson',
      isActive: true,
      dateAdded: '2024-01-15T10:00:00.000Z'
    }
  ],
  isActive: true
};

const mockStorageData: StorageData = {
  teams: [mockTeam],
  lastUpdated: '2024-01-01T00:00:00.000Z'
};

describe('storage utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn(); // Suppress console errors in tests
  });

  describe('getStorageData', () => {
    it('returns default data when localStorage is empty', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      
      const data = getStorageData();
      
      expect(data.teams).toEqual([]);
      expect(data.lastUpdated).toBeDefined();
    });

    it('returns parsed data from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const data = getStorageData();
      
      expect(data).toEqual(mockStorageData);
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('sports-team-manager-data');
    });

    it('returns default data when localStorage contains invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      
      const data = getStorageData();
      
      expect(data.teams).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error reading from localStorage:', expect.any(Error));
    });

    it('returns default data when localStorage throws error', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      const data = getStorageData();
      
      expect(data.teams).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('Error reading from localStorage:', expect.any(Error));
    });

    it('returns default data in server environment (no window)', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      const data = getStorageData();
      
      expect(data.teams).toEqual([]);
      expect(data.lastUpdated).toBeDefined();
      
      global.window = originalWindow;
    });
  });

  describe('saveStorageData', () => {
    it('saves data to localStorage with updated timestamp', () => {
      const dataToSave = { ...mockStorageData };
      
      saveStorageData(dataToSave);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'sports-team-manager-data',
        expect.stringContaining('"teams"')
      );
      expect(dataToSave.lastUpdated).not.toBe(mockStorageData.lastUpdated);
    });

    it('handles localStorage save errors', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });
      
      saveStorageData(mockStorageData);
      
      expect(console.error).toHaveBeenCalledWith('Error saving to localStorage:', expect.any(Error));
    });

    it('does nothing in server environment', () => {
      const originalWindow = global.window;
      const originalLocalStorage = (global as any).localStorage;
      delete (global as any).window;
      delete (global as any).localStorage;
      
      saveStorageData(mockStorageData);
      
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      
      global.window = originalWindow;
      (global as any).localStorage = originalLocalStorage;
    });
  });

  describe('getAllTeams', () => {
    it('returns all teams from storage', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const teams = getAllTeams();
      
      expect(teams).toEqual(mockStorageData.teams);
    });
  });

  describe('getTeamById', () => {
    it('returns team when found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const team = getTeamById('team-1');
      
      expect(team).toEqual(mockTeam);
    });

    it('returns null when team not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const team = getTeamById('non-existent');
      
      expect(team).toBeNull();
    });
  });

  describe('saveTeam', () => {
    it('updates existing team', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const updatedTeam = { ...mockTeam, name: 'Updated Warriors' };
      saveTeam(updatedTeam);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('adds new team when not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ teams: [], lastUpdated: '2024-01-01T00:00:00.000Z' }));
      
      saveTeam(mockTeam);
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('deleteTeam', () => {
    it('removes team from storage', () => {
      const dataWithMultipleTeams = {
        teams: [
          mockTeam,
          { ...mockTeam, id: 'team-2', name: 'Hawks' }
        ],
        lastUpdated: '2024-01-01T00:00:00.000Z'
      };
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(dataWithMultipleTeams));
      
      deleteTeam('team-1');
      
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('addPlayerToTeam', () => {
    const newPlayer: Player = {
      id: 'player-2',
      name: 'Bob Wilson',
      isActive: true,
      dateAdded: '2024-01-16T10:00:00.000Z'
    };

    it('adds player to existing team', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const result = addPlayerToTeam('team-1', newPlayer);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('returns false when team not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const result = addPlayerToTeam('non-existent', newPlayer);
      
      expect(result).toBe(false);
    });
  });

  describe('updatePlayerInTeam', () => {
    it('updates existing player', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const updatedPlayer = { ...mockTeam.players[0], name: 'Alice Updated' };
      const result = updatePlayerInTeam('team-1', 'player-1', updatedPlayer);
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('returns false when team not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const updatedPlayer = { ...mockTeam.players[0], name: 'Alice Updated' };
      const result = updatePlayerInTeam('non-existent', 'player-1', updatedPlayer);
      
      expect(result).toBe(false);
    });

    it('returns false when player not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const updatedPlayer = { ...mockTeam.players[0], name: 'Alice Updated' };
      const result = updatePlayerInTeam('team-1', 'non-existent', updatedPlayer);
      
      expect(result).toBe(false);
    });
  });

  describe('removePlayerFromTeam', () => {
    it('removes player from team', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const result = removePlayerFromTeam('team-1', 'player-1');
      
      expect(result).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('returns false when team not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const result = removePlayerFromTeam('non-existent', 'player-1');
      
      expect(result).toBe(false);
    });
  });

  describe('getPlayerById', () => {
    it('returns player when found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const player = getPlayerById('team-1', 'player-1');
      
      expect(player).toEqual(mockTeam.players[0]);
    });

    it('returns null when team not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const player = getPlayerById('non-existent', 'player-1');
      
      expect(player).toBeNull();
    });

    it('returns null when player not found', () => {
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockStorageData));
      
      const player = getPlayerById('team-1', 'non-existent');
      
      expect(player).toBeNull();
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
      expect(id2.length).toBeGreaterThan(0);
    });
  });

  describe('clearAllData', () => {
    it('removes all data from localStorage', () => {
      clearAllData();
      
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('sports-team-manager-data');
    });

    it('does nothing in server environment', () => {
      const originalWindow = global.window;
      const originalLocalStorage = global.localStorage;
      delete (global as any).window;
      delete (global as any).localStorage;
      
      clearAllData();
      
      expect(mockLocalStorage.removeItem).not.toHaveBeenCalled();
      
      global.window = originalWindow;
      global.localStorage = originalLocalStorage;
    });
  });
});
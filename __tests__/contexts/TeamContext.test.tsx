import { render, screen, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { TeamProvider, useTeamContext } from '../../app/contexts/TeamContext';
import { Team, Player } from '../../app/types/index';

// Mock the storage module
jest.mock('../../app/lib/storage', () => ({
  getAllTeams: jest.fn(),
  getTeamById: jest.fn(),
  saveTeam: jest.fn(),
  deleteTeam: jest.fn(),
  generateId: jest.fn(),
}));

const mockStorage = require('../../app/lib/storage');

// Test component to access context
function TestConsumer({ children }: { children?: ReactNode }) {
  const ctx = useTeamContext();
  return (
    <div>
      <div data-testid="teams-count">{ctx.teams.length}</div>
      <div data-testid="loading">{ctx.loading.toString()}</div>
      <button 
        data-testid="create-team"
        onClick={() => ctx.createTeam({ name: 'New Team', isActive: true })}
      >
        Create Team
      </button>
      <button 
        data-testid="refresh-data"
        onClick={() => ctx.refreshData()}
      >
        Refresh
      </button>
      {children}
    </div>
  );
}

// Test component that should throw error when used outside provider
function TestConsumerWithoutProvider() {
  const context = useTeamContext();
  return <div>Should not render</div>;
}

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Warriors',
    dateCreated: '2024-01-01T00:00:00.000Z',
    players: [],
    isActive: true
  },
  {
    id: 'team-2', 
    name: 'Hawks',
    dateCreated: '2024-01-02T00:00:00.000Z',
    players: [
      {
        id: 'player-1',
        name: 'Alice',
        isActive: true,
        dateAdded: '2024-01-03T00:00:00.000Z'
      }
    ],
    isActive: true
  }
];

describe('TeamContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.generateId.mockReturnValue('new-id');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws error when useTeamContext is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestConsumerWithoutProvider />);
    }).toThrow('useTeamContext must be used within a TeamProvider');
    
    consoleSpy.mockRestore();
  });

  it('loads teams on mount', async () => {
    mockStorage.getAllTeams.mockReturnValue(mockTeams);
    
    render(
      <TeamProvider>
        <TestConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
    });
    
    expect(mockStorage.getAllTeams).toHaveBeenCalledTimes(1);
  });

  it('sets loading state correctly', async () => {
    mockStorage.getAllTeams.mockReturnValue([]);
    
    render(
      <TeamProvider>
        <TestConsumer />
      </TeamProvider>
    );

    // Initially loading should be false since getAllTeams is synchronous
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('creates a new team', async () => {
    mockStorage.getAllTeams.mockReturnValue([]);
    
    render(
      <TeamProvider>
        <TestConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    act(() => {
      screen.getByTestId('create-team').click();
    });

    await waitFor(() => {
      expect(mockStorage.saveTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-id',
          name: 'New Team',
          isActive: true,
          players: [],
          dateCreated: expect.any(String)
        })
      );
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
    });
  });

  it('updates an existing team', async () => {
    mockStorage.getAllTeams.mockReturnValue(mockTeams);
    mockStorage.getTeamById.mockReturnValue(mockTeams[0]);
    
    const TestUpdateConsumer = () => {
      const context = useTeamContext();
      return (
        <div>
          <div data-testid="teams-count">{context.teams.length}</div>
          <button 
            data-testid="update-team"
            onClick={() => context.updateTeam('team-1', { name: 'Updated Warriors' })}
          >
            Update Team
          </button>
        </div>
      );
    };
    
    render(
      <TeamProvider>
        <TestUpdateConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
    });

    act(() => {
      screen.getByTestId('update-team').click();
    });

    await waitFor(() => {
      expect(mockStorage.saveTeam).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'team-1',
          name: 'Updated Warriors'
        })
      );
    });
  });

  it('returns null when updating non-existent team', async () => {
    mockStorage.getAllTeams.mockReturnValue([]);
    mockStorage.getTeamById.mockReturnValue(null);
    
    const TestUpdateConsumer = () => {
      const context = useTeamContext();
      const [result, setResult] = React.useState<Team | null>(null);
      
      React.useEffect(() => {
        const updateAndCheck = async () => {
          const updated = await context.updateTeam('non-existent', { name: 'Updated' });
          setResult(updated);
        };
        updateAndCheck();
      }, [context]);
      
      return <div data-testid="update-result">{result ? 'success' : 'null'}</div>;
    };
    
    render(
      <TeamProvider>
        <TestUpdateConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('update-result')).toHaveTextContent('null');
    });
  });

  it('deletes a team', async () => {
    mockStorage.getAllTeams.mockReturnValue(mockTeams);
    mockStorage.deleteTeam.mockReturnValue(true);
    
    const TestDeleteConsumer = () => {
      const context = useTeamContext();
      return (
        <div>
          <div data-testid="teams-count">{context.teams.length}</div>
          <button 
            data-testid="delete-team"
            onClick={() => context.deleteTeam('team-1')}
          >
            Delete Team
          </button>
        </div>
      );
    };
    
    render(
      <TeamProvider>
        <TestDeleteConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
    });

    act(() => {
      screen.getByTestId('delete-team').click();
    });

    await waitFor(() => {
      expect(mockStorage.deleteTeam).toHaveBeenCalledWith('team-1');
      expect(screen.getByTestId('teams-count')).toHaveTextContent('1');
    });
  });

  it('handles delete team error', async () => {
    mockStorage.getAllTeams.mockReturnValue(mockTeams);
    mockStorage.deleteTeam.mockImplementation(() => {
      throw new Error('Delete failed');
    });
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestDeleteConsumer = () => {
      const context = useTeamContext();
      const [result, setResult] = React.useState<boolean | null>(null);
      
      const handleDelete = async () => {
        const success = await context.deleteTeam('team-1');
        setResult(success);
      };
      
      return (
        <div>
          <div data-testid="teams-count">{context.teams.length}</div>
          <button data-testid="delete-team" onClick={handleDelete}>
            Delete Team
          </button>
          <div data-testid="delete-result">{result?.toString() || 'null'}</div>
        </div>
      );
    };
    
    render(
      <TeamProvider>
        <TestDeleteConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
    });

    act(() => {
      screen.getByTestId('delete-team').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('delete-result')).toHaveTextContent('false');
      expect(screen.getByTestId('teams-count')).toHaveTextContent('2'); // Should not change
    });
    
    consoleSpy.mockRestore();
  });

  it('gets a team by id', async () => {
    mockStorage.getAllTeams.mockReturnValue(mockTeams);
    
    const TestGetConsumer = () => {
      const context = useTeamContext();
      const team = context.getTeam('team-1');
      
      return (
        <div data-testid="found-team">
          {team ? team.name : 'not found'}
        </div>
      );
    };
    
    render(
      <TeamProvider>
        <TestGetConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('found-team')).toHaveTextContent('Warriors');
    });
  });

  it('returns null for non-existent team id', async () => {
    mockStorage.getAllTeams.mockReturnValue([]);
    
    const TestGetConsumer = () => {
      const context = useTeamContext();
      const team = context.getTeam('non-existent');
      
      return (
        <div data-testid="found-team">
          {team ? team.name : 'not found'}
        </div>
      );
    };
    
    render(
      <TeamProvider>
        <TestGetConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('found-team')).toHaveTextContent('not found');
    });
  });

  it('refreshes data', async () => {
    mockStorage.getAllTeams
      .mockReturnValueOnce([])
      .mockReturnValueOnce(mockTeams);
    
    render(
      <TeamProvider>
        <TestConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('0');
    });

    act(() => {
      screen.getByTestId('refresh-data').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('teams-count')).toHaveTextContent('2');
    });
    
    expect(mockStorage.getAllTeams).toHaveBeenCalledTimes(2);
  });

  it('handles loading errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockStorage.getAllTeams.mockImplementation(() => {
      throw new Error('Load failed');
    });
    
    render(
      <TeamProvider>
        <TestConsumer />
      </TeamProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('teams-count')).toHaveTextContent('0');
    });
    
    expect(consoleSpy).toHaveBeenCalledWith('Error loading teams:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

// Add React import for the components that use it
const React = require('react');
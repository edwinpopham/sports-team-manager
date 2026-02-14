import { render, screen, fireEvent } from '@testing-library/react';
import { TeamCard } from '../../app/components/TeamCard';
import { Team } from '../../app/types/index';

// Mock the calculateTeamStats function
jest.mock('../../app/lib/teams', () => ({
  calculateTeamStats: jest.fn((team) => ({
    totalPlayers: team.players?.length || 0,
    activePlayers: team.players?.filter((p: any) => p.isActive).length || 0,
    inactivePlayers: team.players?.filter((p: any) => !p.isActive).length || 0,
  }))
}));

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Warriors',
  description: 'A great test team',
  coach: 'Coach Smith',
  season: '2024 Spring',
  dateCreated: '2024-01-15T10:00:00.000Z',
  isActive: true,
  players: [
    {
      id: 'player-1',
      name: 'Alice Johnson',
      isActive: true,
      dateAdded: '2024-01-16T10:00:00.000Z',
    },
    {
      id: 'player-2', 
      name: 'Bob Wilson',
      isActive: false,
      dateAdded: '2024-01-17T10:00:00.000Z',
    }
  ]
};

describe('TeamCard', () => {
  it('renders team information correctly', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.getByText('Test Warriors')).toBeInTheDocument();
    expect(screen.getByText('A great test team')).toBeInTheDocument();
    expect(screen.getByText('Coach Smith')).toBeInTheDocument();
    expect(screen.getByText('2024 Spring')).toBeInTheDocument();
  });

  it('displays team stats correctly', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.getByText('2')).toBeInTheDocument(); // Total players
    expect(screen.getByText('1')).toBeInTheDocument(); // Active players
  });

  it('renders team name as a link', () => {
    render(<TeamCard team={mockTeam} />);
    
    const teamLink = screen.getByRole('link', { name: /test warriors/i });
    expect(teamLink).toHaveAttribute('href', '/teams/team-1');
  });

  it('displays creation date', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument();
  });

  it('shows inactive badge when team is not active', () => {
    const inactiveTeam = { ...mockTeam, isActive: false };
    render(<TeamCard team={inactiveTeam} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('does not show inactive badge when team is active', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.queryByText('Inactive')).not.toBeInTheDocument();
  });

  it('renders action buttons when showActions is true', () => {
    render(<TeamCard team={mockTeam} showActions={true} />);
    
    expect(screen.getByText('View Details')).toBeInTheDocument();
    expect(screen.getByText('Manage Players')).toBeInTheDocument();
  });

  it('hides action buttons when showActions is false', () => {
    render(<TeamCard team={mockTeam} showActions={false} />);
    
    expect(screen.queryByText('View Details')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Players')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked and confirmed', () => {
    const mockOnDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(<TeamCard team={mockTeam} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Test Warriors"? This action cannot be undone.'
    );
    expect(mockOnDelete).toHaveBeenCalledWith('team-1');
  });

  it('does not call onDelete when deletion is cancelled', () => {
    const mockOnDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(false);
    
    render(<TeamCard team={mockTeam} onDelete={mockOnDelete} />);
    
    const deleteButton = screen.getByText('Delete');
    fireEvent.click(deleteButton);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('does not render delete button when onDelete is not provided', () => {
    render(<TeamCard team={mockTeam} />);
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('handles team without optional fields', () => {
    const minimalTeam: Team = {
      id: 'minimal-team',
      name: 'Minimal Team',
      dateCreated: '2024-01-01T00:00:00.000Z',
      isActive: true,
      players: []
    };
    
    render(<TeamCard team={minimalTeam} />);
    
    expect(screen.getByText('Minimal Team')).toBeInTheDocument();
    expect(screen.queryByText('Coach:')).not.toBeInTheDocument();
    expect(screen.queryByText('Season:')).not.toBeInTheDocument();
  });

  it('displays zero active players in red when no active players', () => {
    const teamWithNoActivePlayers = {
      ...mockTeam,
      players: [{ 
        id: 'inactive-player',
        name: 'Inactive Player',
        isActive: false,
        dateAdded: '2024-01-01T00:00:00.000Z'
      }]
    };
    
    render(<TeamCard team={teamWithNoActivePlayers} />);
    
    const activePlayersElement = screen.getByText('0');
    expect(activePlayersElement).toHaveClass('text-red-500');
  });

  it('displays active players count in green when there are active players', () => {
    render(<TeamCard team={mockTeam} />);
    
    const activePlayersElement = screen.getByText('1');
    expect(activePlayersElement).toHaveClass('text-green-600');
  });
});
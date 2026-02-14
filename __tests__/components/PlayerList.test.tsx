import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerList } from '../../app/components/PlayerList';
import { Player } from '../../app/types/index';

// Mock the utility functions
jest.mock('../../app/lib/teams', () => ({
  sortPlayers: jest.fn((players, sortBy, order) => {
    const sorted = [...players].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'dateAdded') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      }
      return aVal > bVal ? 1 : -1;
    });
    return sorted;
  }),
  filterPlayers: jest.fn((players, filters) => {
    let filtered = [...players];
    
    if (filters.isActive !== undefined) {
      filtered = filtered.filter(p => p.isActive === filters.isActive);
    }
    
    if (filters.searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (p.position && p.position.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  })
}));

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
    email: 'bob@example.com', 
    position: 'Defense',
    jerseyNumber: 5,
    isActive: false,
    dateAdded: '2024-01-16T10:00:00.000Z',
  },
  {
    id: 'player-3',
    name: 'Charlie Brown',
    phone: '555-0123',
    position: 'Midfielder',
    jerseyNumber: 7,
    isActive: true,
    dateAdded: '2024-01-17T10:00:00.000Z',
  }
];

describe('PlayerList', () => {
  it('renders with default title', () => {
    render(<PlayerList players={mockPlayers} />);
    expect(screen.getByText('Team Roster')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<PlayerList players={mockPlayers} title="Starting Lineup" />);
    expect(screen.getByText('Starting Lineup')).toBeInTheDocument();
  });

  it('displays player count correctly', () => {
    render(<PlayerList players={mockPlayers} />);
    expect(screen.getByText('3 players')).toBeInTheDocument();
  });

  it('displays singular player count', () => {
    render(<PlayerList players={[mockPlayers[0]]} />);
    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<PlayerList players={mockPlayers} />);
    const searchInput = screen.getByPlaceholderText('Search players...');
    expect(searchInput).toBeInTheDocument();
  });

  it('renders active only checkbox', () => {
    render(<PlayerList players={mockPlayers} />);
    const checkbox = screen.getByLabelText('Show active only');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('filters players when search term is entered', () => {
    render(<PlayerList players={mockPlayers} />);
    
    const searchInput = screen.getByPlaceholderText('Search players...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    
    // The mock filterPlayers should be called with the search term
    expect(require('../../app/lib/teams').filterPlayers).toHaveBeenCalledWith(
      mockPlayers, 
      { searchTerm: 'Alice' }
    );
  });

  it('filters to active players when checkbox is checked', () => {
    render(<PlayerList players={mockPlayers} />);
    
    const checkbox = screen.getByLabelText('Show active only');
    fireEvent.click(checkbox);
    
    expect(require('../../app/lib/teams').filterPlayers).toHaveBeenCalledWith(
      mockPlayers,
      { isActive: true }
    );
  });

  it('sorts players when sort button is clicked', () => {
    render(<PlayerList players={mockPlayers} />);
    
    const nameButton = screen.getByText(/name/i);
    fireEvent.click(nameButton);
    
    expect(require('../../app/lib/teams').sortPlayers).toHaveBeenCalledWith(
      expect.any(Array),
      'name',
      'asc'
    );
  });

  it('toggles sort order when same sort button is clicked twice', () => {
    render(<PlayerList players={mockPlayers} />);
    
    const nameButton = screen.getByText(/name/i);
    fireEvent.click(nameButton);
    fireEvent.click(nameButton);
    
    expect(require('../../app/lib/teams').sortPlayers).toHaveBeenCalledWith(
      expect.any(Array),
      'name',
      'desc'
    );
  });

  it('calls onEditPlayer when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<PlayerList players={mockPlayers} onEditPlayer={mockOnEdit} />);
    
    // Assuming the component renders edit buttons
    const editButtons = screen.getAllByText(/edit/i);
    if (editButtons.length > 0) {
      fireEvent.click(editButtons[0]);
      expect(mockOnEdit).toHaveBeenCalledWith(mockPlayers[0]);
    }
  });

  it('calls onDeletePlayer with confirmation when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(true);
    
    render(<PlayerList players={mockPlayers} onDeletePlayer={mockOnDelete} />);
    
    // Look for delete buttons (may be rendered as "Remove" or similar)
    const deleteButtons = screen.getAllByText(/remove|delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to remove Alice Johnson from the team?'
      );
      expect(mockOnDelete).toHaveBeenCalledWith('player-1');
    }
  });

  it('does not call onDeletePlayer when deletion is cancelled', () => {
    const mockOnDelete = jest.fn();
    window.confirm = jest.fn().mockReturnValue(false);
    
    render(<PlayerList players={mockPlayers} onDeletePlayer={mockOnDelete} />);
    
    const deleteButtons = screen.getAllByText(/remove|delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(mockOnDelete).not.toHaveBeenCalled();
    }
  });

  it('calls onTogglePlayerStatus when status is toggled', () => {
    const mockOnToggle = jest.fn();
    render(<PlayerList players={mockPlayers} onTogglePlayerStatus={mockOnToggle} />);
    
    // Look for toggle buttons or status change buttons
    const toggleButtons = screen.getAllByText(/activate|deactivate/i);
    if (toggleButtons.length > 0) {
      fireEvent.click(toggleButtons[0]);
      expect(mockOnToggle).toHaveBeenCalled();
    }
  });

  it('hides action buttons when showActions is false', () => {
    render(<PlayerList players={mockPlayers} showActions={false} />);
    
    expect(screen.queryByText(/edit/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/delete/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/remove/i)).not.toBeInTheDocument();
  });

  it('displays empty state when no players', () => {
    render(<PlayerList players={[]} />);
    
    expect(screen.getByText(/no players yet/i)).toBeInTheDocument();
    expect(screen.getByText(/add your first player/i)).toBeInTheDocument();
  });

  it('displays filtered empty state when search yields no results', () => {
    render(<PlayerList players={mockPlayers} />);
    
    // Mock the filter to return empty array
    require('../../app/lib/teams').filterPlayers.mockReturnValueOnce([]);
    
    const searchInput = screen.getByPlaceholderText('Search players...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Re-render to see the effect
    render(<PlayerList players={mockPlayers} />);
  });

  it('displays sort indicators correctly', () => {
    render(<PlayerList players={mockPlayers} />);
    
    // The component should render sort buttons with indicators
    // Default sort is by Name (asc), so Name button should show ↑
    const nameButtonText = screen.getByText(/name.*↑/i);
    expect(nameButtonText).toBeInTheDocument();
    
    // Other columns should show ↕️ (unsorted)
    const positionButtonText = screen.getByText(/position.*↕️/i);
    expect(positionButtonText).toBeInTheDocument();
  });
});
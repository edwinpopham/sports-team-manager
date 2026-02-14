import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerForm } from '../../../app/components/forms/PlayerForm';
import { PlayerFormData } from '../../../app/types/index';

describe('PlayerForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form fields correctly', () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Enter player name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('player@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 123-4567')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Forward, Midfielder, Goalkeeper')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Jersey #')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Any additional notes about the player...')).toBeInTheDocument();
  });

  it('renders submit button with default label', () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Add Player')).toBeInTheDocument();
  });

  it('renders submit button with custom label', () => {
    render(<PlayerForm onSubmit={mockOnSubmit} submitLabel="Update Player" />);
    expect(screen.getByText('Update Player')).toBeInTheDocument();
  });

  it('populates form with initial data', () => {
    const initialData: Partial<PlayerFormData> = {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '555-0123',
      position: 'Forward',
      jerseyNumber: 10,
      notes: 'Team captain'
    };

    render(<PlayerForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('555-0123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Forward')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Team captain')).toBeInTheDocument();
  });

  it('validates required player name field', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(screen.getByText('Player name is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('player@example.com'), { target: { value: 'invalid-email' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    // Form submission should be blocked due to invalid email
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates jersey number is unique', async () => {
    const existingJerseyNumbers = [5, 10, 15];
    render(<PlayerForm onSubmit={mockOnSubmit} existingJerseyNumbers={existingJerseyNumbers} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '10' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(screen.getByText('This jersey number is already taken')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates jersey number range', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '1000' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    // Form submission should be blocked due to invalid range
    expect(mockOnSubmit).not.toHaveBeenCalled();
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('clears validation errors when user corrects input', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(screen.getByText('Player name is required')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Valid Name' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Player name is required')).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('player@example.com'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('(555) 123-4567'), { target: { value: '555-0123' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., Forward, Midfielder, Goalkeeper'), { target: { value: 'Forward' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '7' } });
    fireEvent.change(screen.getByPlaceholderText('Any additional notes about the player...'), { target: { value: 'Good player' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Player',
        email: 'test@example.com',
        phone: '555-0123',
        position: 'Forward',
        jerseyNumber: 7,
        notes: 'Good player'
      });
    });
  });

  it('submits form with only required fields', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Minimal Player' } });
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Minimal Player',
        email: '',
        phone: '',
        position: '',
        jerseyNumber: undefined,
        notes: ''
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<PlayerForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when loading', () => {
    render(<PlayerForm onSubmit={mockOnSubmit} isLoading={true} />);
    
    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  it('accepts valid email addresses', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('player@example.com'), { target: { value: 'valid@example.com' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('allows jersey number 0', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '0' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(screen.queryByText('Jersey number must be between 0 and 999')).not.toBeInTheDocument();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('allows jersey number 999', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '999' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(screen.queryByText('Jersey number must be between 0 and 999')).not.toBeInTheDocument();
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it('rejects negative jersey numbers', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '-1' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    // Check that the form submission was blocked
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles numeric jersey number input correctly', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    fireEvent.change(screen.getByPlaceholderText('Jersey #'), { target: { value: '42' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          jerseyNumber: 42
        })
      );
    });
  });

  it('handles empty jersey number field', async () => {
    render(<PlayerForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter player name'), { target: { value: 'Test Player' } });
    
    fireEvent.click(screen.getByText('Add Player'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          jerseyNumber: undefined
        })
      );
    });
  });
});
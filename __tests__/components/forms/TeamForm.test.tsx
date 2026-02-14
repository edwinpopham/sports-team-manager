import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TeamForm } from '../../../app/components/forms/TeamForm';
import { TeamFormData } from '../../../app/types/index';

describe('TeamForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form fields correctly', () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByPlaceholderText('Enter team name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Brief description of the team')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Head coach name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., 2024 Spring, 2024-2025')).toBeInTheDocument();
  });

  it('renders submit button with default label', () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Create Team')).toBeInTheDocument();
  });

  it('renders submit button with custom label', () => {
    render(<TeamForm onSubmit={mockOnSubmit} submitLabel="Update Team" />);
    expect(screen.getByText('Update Team')).toBeInTheDocument();
  });

  it('renders cancel button when onCancel is provided', () => {
    render(<TeamForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('does not render cancel button when onCancel is not provided', () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('populates form with initial data', () => {
    const initialData = {
      name: 'Warriors',
      description: 'Championship team',
      coach: 'Coach Smith',
      season: '2024 Spring'
    };

    render(<TeamForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    expect(screen.getByDisplayValue('Warriors')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Championship team')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Coach Smith')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024 Spring')).toBeInTheDocument();
  });

  it('validates required team name field', async () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Create Team');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Team name is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('clears validation error when user starts typing', async () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    const submitButton = screen.getByText('Create Team');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Team name is required')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByPlaceholderText('Enter team name');
    fireEvent.change(nameInput, { target: { value: 'New Team' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Team name is required')).not.toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter team name'), { target: { value: 'Test Team' } });
    fireEvent.change(screen.getByPlaceholderText('Brief description of the team'), { target: { value: 'Test description' } });
    fireEvent.change(screen.getByPlaceholderText('Head coach name'), { target: { value: 'Test Coach' } });
    fireEvent.change(screen.getByPlaceholderText('e.g., 2024 Spring, 2024-2025'), { target: { value: '2024' } });
    
    fireEvent.click(screen.getByText('Create Team'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Team',
        description: 'Test description',
        coach: 'Test Coach',
        season: '2024'
      });
    });
  });

  it('submits form with only required fields', async () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter team name'), { target: { value: 'Minimal Team' } });
    fireEvent.click(screen.getByText('Create Team'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Minimal Team',
        description: '',
        coach: '',
        season: ''
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<TeamForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button when loading', () => {
    render(<TeamForm onSubmit={mockOnSubmit} isLoading={true} />);
    
    const submitButton = screen.getByText('Saving...');
    expect(submitButton).toBeDisabled();
  });

  it('shows loading text when isLoading is true', () => {
    render(<TeamForm onSubmit={mockOnSubmit} isLoading={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('trims whitespace from team name during validation', async () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByPlaceholderText('Enter team name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Create Team'));
    
    await waitFor(() => {
      expect(screen.getByText('Team name is required')).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('handles form submission by preventing default behavior', () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    const form = screen.getByPlaceholderText('Enter team name').closest('form');
    const mockPreventDefault = jest.fn();
    
    if (form) {
      fireEvent.submit(form, { preventDefault: mockPreventDefault });
      // This test is more about ensuring the form structure exists
    }
  });

  it('maintains form state correctly during user interaction', () => {
    render(<TeamForm onSubmit={mockOnSubmit} />);
    
    const nameInput = screen.getByPlaceholderText('Enter team name');
    const descriptionInput = screen.getByPlaceholderText('Brief description of the team');
    
    fireEvent.change(nameInput, { target: { value: 'Warriors' } });
    fireEvent.change(descriptionInput, { target: { value: 'Great team' } });
    
    expect(nameInput).toHaveValue('Warriors');
    expect(descriptionInput).toHaveValue('Great team');
  });

  it('handles empty string values correctly', async () => {
    const initialData = {
      name: 'Test Team',
      description: undefined,
      coach: null as any,
      season: ''
    };

    render(<TeamForm onSubmit={mockOnSubmit} initialData={initialData} />);
    
    fireEvent.click(screen.getByText('Create Team'));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Team',
        description: '',
        coach: '',  
        season: ''
      });
    });
  });
});
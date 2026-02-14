import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '@/app/components/ui/Input';

describe('Input', () => {
  it('renders input field correctly', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe('INPUT');
  });

  it('displays label when provided', () => {
    render(<Input label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('displays error message when error prop is provided', () => {
    render(<Input label="Test" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-sm', 'text-red-600');
  });

  it('displays helper text when provided and no error', () => {
    render(<Input label="Test" helperText="This is helpful information" />);
    expect(screen.getByText('This is helpful information')).toBeInTheDocument();
    expect(screen.getByText('This is helpful information')).toHaveClass('text-sm', 'text-gray-500');
  });

  it('prioritizes error over helper text', () => {
    render(
      <Input 
        label="Test" 
        error="Error message"
        helperText="Helper message"
      />
    );
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper message')).not.toBeInTheDocument();
  });

  it('applies error styling when error is present', () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
  });

  it('applies normal styling when no error', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
  });

  it('handles value changes', () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('accepts different input types', () => {
    render(<Input type="email" data-testid="email-input" />);
    const input = screen.getByTestId('email-input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes through HTML input attributes', () => {
    render(
      <Input 
        disabled
        required
        maxLength={50}
        placeholder="Test placeholder"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toBeRequired();
    expect(input).toHaveAttribute('maxlength', '50');
    expect(input).toHaveAttribute('placeholder', 'Test placeholder');
  });

  it('has correct base styling', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass(
      'block',
      'w-full',
      'rounded-md',
      'border',
      'px-3',
      'py-2',
      'text-sm',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2'
    );
  });
});
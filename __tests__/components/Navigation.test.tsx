import { render, screen } from '@testing-library/react';
import { Navigation } from '../../app/components/Navigation';

// Mock the usePathname hook
const mockUsePathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
  });

  it('renders the main logo/title link', () => {
    render(<Navigation />);
    const logoLink = screen.getByRole('link', { name: /sports team manager/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('renders all navigation items', () => {
    render(<Navigation />);
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /teams/i })).toBeInTheDocument();
  });

  it('applies active styling to exact matched routes', () => {
    mockUsePathname.mockReturnValue('/');
    render(<Navigation />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('applies active styling to prefix matched routes', () => {
    mockUsePathname.mockReturnValue('/teams/123');
    render(<Navigation />);
    
    const teamsLink = screen.getByRole('link', { name: /teams/i });
    expect(teamsLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('applies inactive styling to non-matching routes', () => {
    mockUsePathname.mockReturnValue('/some-other-path');
    render(<Navigation />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    const teamsLink = screen.getByRole('link', { name: /teams/i });
    
    expect(dashboardLink).toHaveClass('text-gray-600', 'hover:text-gray-900');
    expect(teamsLink).toHaveClass('text-gray-600', 'hover:text-gray-900');
  });

  it('has correct responsive layout classes', () => {
    render(<Navigation />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-white', 'border-b', 'border-gray-200');
  });

  it('has correct container structure', () => {
    const { container } = render(<Navigation />);
    const maxWContainer = container.querySelector('.max-w-7xl');
    const flexContainer = container.querySelector('.flex.justify-between.h-16');
    
    expect(maxWContainer).toBeInTheDocument();
    expect(flexContainer).toBeInTheDocument();
  });

  it('dashboard link uses exact matching', () => {
    mockUsePathname.mockReturnValue('/teams');
    render(<Navigation />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).not.toHaveClass('bg-blue-100', 'text-blue-700');
  });

  it('teams link uses prefix matching', () => {
    mockUsePathname.mockReturnValue('/teams/create');
    render(<Navigation />);
    
    const teamsLink = screen.getByRole('link', { name: /teams/i });
    expect(teamsLink).toHaveClass('bg-blue-100', 'text-blue-700');
  });
});
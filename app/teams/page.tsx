// Teams list page - main teams overview
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTeamContext } from '../contexts/TeamContext';
import { TeamCard } from '../components/TeamCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { sortTeams } from '../lib/teams';

export default function TeamsPage() {
  const { teams, loading, deleteTeam, refreshData } = useTeamContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Filter teams based on search and active status
  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (team.description && team.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (team.coach && team.coach.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (team.season && team.season.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = showInactive || team.isActive;
    
    return matchesSearch && matchesStatus;
  });

  const sortedTeams = sortTeams(filteredTeams);

  const handleDeleteTeam = async (teamId: string) => {
    const success = await deleteTeam(teamId);
    if (success) {
      // Team was deleted successfully
      await refreshData();
    } else {
      // Handle error - could show a toast notification
      console.error('Failed to delete team');
    }
  };

  // Remove this useEffect - data is already loaded by the TeamProvider
  // useEffect(() => {
  //   // Refresh data when component mounts
  //   refreshData();
  // }, [refreshData]);

  if (loading) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="mt-2 text-gray-600">
              Manage all your teams and their rosters in one place.
            </p>
          </div>
          
          <Link href="/teams/create">
            <Button variant="primary">
              Create New Team
            </Button>
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex-1 max-w-md">
            <label htmlFor="search" className="sr-only">Search teams</label>
            <input
              id="search"
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Show inactive teams
          </label>
        </div>

        {/* Teams Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{teams.filter(t => t.isActive).length}</div>
              <div className="text-sm text-gray-600">Active Teams</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {teams.reduce((sum, team) => sum + team.players.filter(p => p.isActive).length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Active Players</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(teams.filter(t => t.season).map(t => t.season)).size}
              </div>
              <div className="text-sm text-gray-600">Seasons</div>
            </div>
          </Card>
        </div>

        {/* Teams Grid */}
        {sortedTeams.length === 0 ? (
          <Card className="text-center py-12">
            {teams.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
                  <p className="text-gray-600 mb-6">Create your first team to get started with managing rosters.</p>
                </div>
                
                <Link href="/teams/create">
                  <Button variant="primary">
                    Create Your First Team
                  </Button>
                </Link>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
                <p className="text-gray-600">Try adjusting your search terms or filters.</p>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sortedTeams.map((team) => (
              <TeamCard 
                key={team.id} 
                team={team} 
                onDelete={handleDeleteTeam}
                showActions={true}
              />
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/teams/create">
              <Button variant="secondary">
                Create Team
              </Button>
            </Link>
            <Button 
              variant="secondary" 
              onClick={() => refreshData()}
            >
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// Team detail page showing team information and basic stats
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTeamContext } from '../../contexts/TeamContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { TeamStats } from '../../components/TeamStats';
import { TeamOverview } from '../../components/TeamOverview';

export default function TeamDetailPage() {
  const params = useParams();
  const teamId = params.id as string;
  
  const { getTeam, updateTeam, deleteTeam } = useTeamContext();
  const [team, setTeam] = useState(getTeam(teamId));
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    coach: team?.coach || '',
    season: team?.season || ''
  });

  const refreshTeam = useCallback(() => {
    const updatedTeam = getTeam(teamId);
    setTeam(updatedTeam);
    if (updatedTeam) {
      setEditData({
        name: updatedTeam.name,
        description: updatedTeam.description || '',
        coach: updatedTeam.coach || '',
        season: updatedTeam.season || ''
      });
    }
  }, [getTeam, teamId]);

  useEffect(() => {
    refreshTeam();
  }, [refreshTeam]);

  if (!team) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Team Not Found</h1>
          <p className="text-gray-600 mb-6">The team you're looking for doesn't exist.</p>
          <Link href="/teams">
            <Button variant="primary">Back to Teams</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveEdit = async () => {
    try {
      const updatedTeam = await updateTeam(teamId, editData);
      if (updatedTeam) {
        setIsEditing(false);
        refreshTeam();
      }
    } catch (err) {
      console.error('Error updating team:', err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      name: team.name,
      description: team.description || '',
      coach: team.coach || '',
      season: team.season || ''
    });
  };

  const handleToggleTeamStatus = async () => {
    try {
      await updateTeam(teamId, { isActive: !team.isActive });
      refreshTeam();
    } catch (err) {
      console.error('Error updating team status:', err);
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/teams" className="hover:text-blue-600 transition-colors">
              Teams
            </Link>
            <span>›</span>
            <span className="text-gray-900">{team.name}</span>
          </nav>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4 max-w-lg">
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="text-3xl font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none w-full"
                  />
                  <textarea
                    value={editData.description}
                    onChange={(e) => setEditData({...editData, description: e.target.value})}
                    placeholder="Team description..."
                    rows={2}
                    className="w-full text-gray-600 bg-transparent border-b border-gray-300 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={handleSaveEdit}>
                      Save Changes
                    </Button>
                    <Button variant="secondary" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
                    {!team.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                  {team.description && (
                    <p className="text-gray-600 text-lg mb-4">{team.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {team.coach && (
                      <div>
                        <span className="font-medium">Coach:</span> {team.coach}
                      </div>
                    )}
                    {team.season && (
                      <div>
                        <span className="font-medium">Season:</span> {team.season}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Created:</span> {new Date(team.dateCreated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {!isEditing && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Team
                </Button>
                <Link href={`/teams/${teamId}/players`}>
                  <Button variant="primary">
                    Manage Players
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Team Statistics */}
        <div className="mb-8">
          <TeamStats team={team} />
        </div>

        {/* Team Overview */}
        <div className="mb-8">
          <TeamOverview team={team} />
        </div>

        {/* Team Actions */}
        <div className="flex flex-wrap gap-4">
          <Link href={`/teams/${teamId}/players`}>
            <Button variant="primary">
              Manage Players
            </Button>
          </Link>
          
          <Button 
            variant="secondary" 
            onClick={handleToggleTeamStatus}
          >
            {team.isActive ? 'Deactivate' : 'Activate'} Team
          </Button>
          
          <Link href="/teams">
            <Button variant="secondary">
              Back to Teams
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
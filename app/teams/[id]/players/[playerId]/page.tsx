// Player detail page for viewing and editing individual player profiles
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeamContext } from '../../../../contexts/TeamContext';
import { Button } from '../../../../components/ui/Button';
import { PlayerProfile } from '../../../../components/PlayerProfile';

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  const playerId = params.playerId as string;
  
  const { getTeam, updatePlayer, removePlayer } = useTeamContext();
  const [team, setTeam] = useState(getTeam(teamId));
  const [player, setPlayer] = useState(team?.players.find(p => p.id === playerId));
  const [isEditing, setIsEditing] = useState(false);

  const refreshTeamAndPlayer = useCallback(() => {
    const updatedTeam = getTeam(teamId);
    setTeam(updatedTeam);
    const updatedPlayer = updatedTeam?.players.find(p => p.id === playerId);
    setPlayer(updatedPlayer);
  }, [getTeam, teamId, playerId]);

  useEffect(() => {
    refreshTeamAndPlayer();
  }, [refreshTeamAndPlayer]);

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

  if (!player) {
    return (
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Player Not Found</h1>
          <p className="text-gray-600 mb-6">The player you're looking for doesn't exist on this team.</p>
          <Link href={`/teams/${teamId}/players`}>
            <Button variant="primary">Back to Team Roster</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedData: Partial<typeof player>) => {
    try {
      const success = await updatePlayer(teamId, playerId, updatedData);
      if (success) {
        setIsEditing(false);
        refreshTeamAndPlayer();
      }
    } catch (error) {
      console.error('Error updating player:', error);
      // In a real app, you'd show a toast/notification here
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = async (playerIdToDelete: string) => {
    try {
      const success = await removePlayer(teamId, playerIdToDelete);
      if (success) {
        router.push(`/teams/${teamId}/players`);
      }
    } catch (error) {
      console.error('Error deleting player:', error);
      // In a real app, you'd show a toast/notification here
    }
  };

  return (
    <div className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <Link href="/teams" className="hover:text-blue-600 transition-colors">
            Teams
          </Link>
          <span>›</span>
          <Link href={`/teams/${teamId}`} className="hover:text-blue-600 transition-colors">
            {team.name}
          </Link>
          <span>›</span>
          <Link href={`/teams/${teamId}/players`} className="hover:text-blue-600 transition-colors">
            Players
          </Link>
          <span>›</span>
          <span className="text-gray-900">{player.name}</span>
        </nav>

        {/* Player Profile Component */}
        <PlayerProfile
          player={player}
          isEditing={isEditing}
          onEdit={handleEdit}
          onSave={handleSave}
          onCancel={handleCancel}
          onDelete={handleDelete}
        />

        {/* Navigation Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href={`/teams/${teamId}/players`}>
            <Button variant="secondary">
              ← Back to Roster
            </Button>
          </Link>
          
          <Link href={`/teams/${teamId}`}>
            <Button variant="secondary">
              Team Dashboard
            </Button>
          </Link>

          {/* Navigate to next/previous player */}
          {team.players.length > 1 && (
            <>
              {(() => {
                const currentIndex = team.players.findIndex(p => p.id === playerId);
                const prevPlayer = currentIndex > 0 ? team.players[currentIndex - 1] : null;
                const nextPlayer = currentIndex < team.players.length - 1 ? team.players[currentIndex + 1] : null;

                return (
                  <>
                    {prevPlayer && (
                      <Link href={`/teams/${teamId}/players/${prevPlayer.id}`}>
                        <Button variant="secondary" size="sm">
                          ← {prevPlayer.name}
                        </Button>
                      </Link>
                    )}
                    {nextPlayer && (
                      <Link href={`/teams/${teamId}/players/${nextPlayer.id}`}>
                        <Button variant="secondary" size="sm">
                          {nextPlayer.name} →
                        </Button>
                      </Link>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
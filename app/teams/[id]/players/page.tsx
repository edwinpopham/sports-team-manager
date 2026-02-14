// Player management page for a specific team
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTeamContext } from '../../../contexts/TeamContext';
import { PlayerForm } from '../../../components/forms/PlayerForm';
import { PlayerList } from '../../../components/PlayerList';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Player, PlayerFormData } from '../../../types/index';
import { validatePlayer, getAvailableJerseyNumbers } from '../../../lib/teams';

export default function TeamPlayersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const { getTeam, addPlayer, updatePlayer, removePlayer, refreshData } = useTeamContext();
  const [team, setTeam] = useState(getTeam(teamId));
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTeam = useCallback(() => {
    const updatedTeam = getTeam(teamId);
    setTeam(updatedTeam);
  }, [getTeam, teamId]);

  useEffect(() => {
    refreshTeam();
  }, [refreshTeam]);

  // Redirect if team not found
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

  const handleAddPlayer = async (formData: PlayerFormData) => {
    setIsLoading(true);
    setError(null);

    // Validate player data
    const validation = validatePlayer(formData, team.players);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      setIsLoading(false);
      return;
    }

    try {
      const newPlayer = await addPlayer(teamId, formData);
      if (newPlayer) {
        setShowPlayerForm(false);
        refreshTeam();
        await refreshData();
      } else {
        setError('Failed to add player. Please try again.');
      }
    } catch (err) {
      console.error('Error adding player:', err);
      setError('Failed to add player. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlayer = async (formData: PlayerFormData) => {
    if (!editingPlayer) return;

    setIsLoading(true);
    setError(null);

    // Validate player data (excluding current player from jersey number check)
    const otherPlayers = team.players.filter(p => p.id !== editingPlayer.id);
    const validation = validatePlayer(formData, otherPlayers);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      setIsLoading(false);
      return;
    }

    try {
      const updatedPlayer = await updatePlayer(teamId, editingPlayer.id, formData);
      if (updatedPlayer) {
        setEditingPlayer(null);
        refreshTeam();
        await refreshData();
      } else {
        setError('Failed to update player. Please try again.');
      }
    } catch (err) {
      console.error('Error updating player:', err);
      setError('Failed to update player. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      const success = await removePlayer(teamId, playerId);
      if (success) {
        refreshTeam();
        await refreshData();
      } else {
        setError('Failed to remove player. Please try again.');
      }
    } catch (err) {
      console.error('Error removing player:', err);
      setError('Failed to remove player. Please try again.');
    }
  };

  const handleTogglePlayerStatus = async (playerId: string, isActive: boolean) => {
    const player = team.players.find(p => p.id === playerId);
    if (!player) return;

    try {
      const updatedPlayer = await updatePlayer(teamId, playerId, { isActive });
      if (updatedPlayer) {
        refreshTeam();
        await refreshData();
      }
    } catch (err) {
      console.error('Error updating player status:', err);
      setError('Failed to update player status. Please try again.');
    }
  };

  const handleStartAddPlayer = () => {
    setEditingPlayer(null);
    setShowPlayerForm(true);
    setError(null);
  };

  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowPlayerForm(true);
    setError(null);
  };

  const handleCancelForm = () => {
    setShowPlayerForm(false);
    setEditingPlayer(null);
    setError(null);
  };

  const availableJerseyNumbers = getAvailableJerseyNumbers(team);

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
            <Link href={`/teams/${teamId}`} className="hover:text-blue-600 transition-colors">
              {team.name}
            </Link>
            <span>›</span>
            <span className="text-gray-900">Players</span>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{team.name} - Players</h1>
              <p className="mt-2 text-gray-600">
                Manage your team roster and player information.
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={handleStartAddPlayer}
            >
              Add Player
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Player Form */}
        {showPlayerForm && (
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingPlayer ? 'Edit Player' : 'Add New Player'}
              </h2>
              
              <PlayerForm
                initialData={editingPlayer ? {
                  name: editingPlayer.name,
                  email: editingPlayer.email || '',
                  phone: editingPlayer.phone || '',
                  position: editingPlayer.position || '',
                  jerseyNumber: editingPlayer.jerseyNumber || undefined,
                  notes: editingPlayer.notes || ''
                } : {}}
                onSubmit={editingPlayer ? handleEditPlayer : handleAddPlayer}
                onCancel={handleCancelForm}
                submitLabel={editingPlayer ? 'Update Player' : 'Add Player'}
                isLoading={isLoading}
                existingJerseyNumbers={availableJerseyNumbers.length > 0 ? 
                  team.players.filter(p => p.id !== editingPlayer?.id).map(p => p.jerseyNumber).filter(Boolean) as number[] : 
                  []
                }
              />

              {availableJerseyNumbers.length > 0 && !editingPlayer && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Available Jersey Numbers:</h4>
                  <div className="text-sm text-blue-800">
                    {availableJerseyNumbers.slice(0, 10).join(', ')}
                    {availableJerseyNumbers.length > 10 && ` and ${availableJerseyNumbers.length - 10} more...`}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Player List */}
        <PlayerList
          players={team.players}
          onEditPlayer={handleStartEditPlayer}
          onDeletePlayer={handleDeletePlayer}
          onTogglePlayerStatus={handleTogglePlayerStatus}
          title="Team Roster"
        />

        {/* Team Actions */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href={`/teams/${teamId}`}>
            <Button variant="secondary">
              Back to Team Details
            </Button>
          </Link>
          
          <Link href="/teams">
            <Button variant="secondary">
              All Teams
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
// PlayerList component for displaying and managing team players
'use client';

import { useState } from 'react';
import { Player } from '../types/index';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { sortPlayers, filterPlayers } from '../lib/teams';

interface PlayerListProps {
  players: Player[];
  onEditPlayer?: (player: Player) => void;
  onDeletePlayer?: (playerId: string) => void;
  onTogglePlayerStatus?: (playerId: string, isActive: boolean) => void;
  showActions?: boolean;
  title?: string;
}

type SortOption = 'name' | 'position' | 'jerseyNumber' | 'dateAdded';

export function PlayerList({ 
  players, 
  onEditPlayer,
  onDeletePlayer,
  onTogglePlayerStatus,
  showActions = true,
  title = "Team Roster"
}: PlayerListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Apply filters and sorting
  const filteredPlayers = filterPlayers(players, {
    isActive: showOnlyActive ? true : undefined,
    searchTerm: searchTerm.trim() || undefined
  });

  const sortedPlayers = sortPlayers(filteredPlayers, sortBy, sortOrder);

  const handleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const handleDeletePlayer = (playerId: string, playerName: string) => {
    if (onDeletePlayer && window.confirm(`Are you sure you want to remove ${playerName} from the team?`)) {
      onDeletePlayer(playerId);
    }
  };

  const getSortIcon = (column: SortOption) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-500">
          {sortedPlayers.length} player{sortedPlayers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showOnlyActive}
            onChange={(e) => setShowOnlyActive(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Show active only
        </label>
      </div>

      {sortedPlayers.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500">
            {players.length === 0 ? (
              <>
                <p className="text-lg mb-2">No players yet</p>
                <p className="text-sm">Add your first player to get started!</p>
              </>
            ) : (
              <>
                <p className="text-lg mb-2">No players found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </>
            )}
          </div>
        </Card>
      ) : (
        <>
          {/* Sort Controls */}
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="text-gray-500">Sort by:</span>
            {(['name', 'position', 'jerseyNumber', 'dateAdded'] as const).map((option) => (
              <button
                key={option}
                onClick={() => handleSort(option)}
                className={`px-2 py-1 rounded transition-colors ${
                  sortBy === option
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                }`}
              >
                {option === 'jerseyNumber' ? 'Jersey #' : 
                 option === 'dateAdded' ? 'Join Date' : 
                 option.charAt(0).toUpperCase() + option.slice(1)} {getSortIcon(option)}
              </button>
            ))}
          </div>

          {/* Player List */}
          <div className="space-y-3">
            {sortedPlayers.map((player) => (
              <Card key={player.id} className={`transition-all ${!player.isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {player.name}
                        </h3>
                        
                        {player.jerseyNumber && (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                            {player.jerseyNumber}
                          </span>
                        )}

                        {!player.isActive && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                        {player.position && (
                          <div>
                            <span className="font-medium">Position:</span> {player.position}
                          </div>
                        )}
                        
                        {player.email && (
                          <div>
                            <span className="font-medium">Email:</span> 
                            <a href={`mailto:${player.email}`} className="text-blue-600 hover:underline ml-1">
                              {player.email}
                            </a>
                          </div>
                        )}
                        
                        {player.phone && (
                          <div>
                            <span className="font-medium">Phone:</span> 
                            <a href={`tel:${player.phone}`} className="text-blue-600 hover:underline ml-1">
                              {player.phone}
                            </a>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium">Joined:</span> {new Date(player.dateAdded).toLocaleDateString()}
                        </div>
                      </div>

                      {player.notes && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {player.notes}
                        </div>
                      )}
                    </div>

                    {showActions && (
                      <div className="ml-4 flex flex-col sm:flex-row gap-2">
                        {onEditPlayer && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onEditPlayer(player)}
                          >
                            Edit
                          </Button>
                        )}
                        
                        {onTogglePlayerStatus && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onTogglePlayerStatus(player.id, !player.isActive)}
                          >
                            {player.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                        
                        {onDeletePlayer && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeletePlayer(player.id, player.name)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
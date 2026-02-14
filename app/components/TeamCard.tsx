// TeamCard component for displaying team summary information
'use client';

import Link from 'next/link';
import { Team } from '../types/index';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { calculateTeamStats } from '../lib/teams';

interface TeamCardProps {
  team: Team;
  onDelete?: (teamId: string) => void;
  showActions?: boolean;
}

export function TeamCard({ team, onDelete, showActions = true }: TeamCardProps) {
  const stats = calculateTeamStats(team);

  const handleDelete = () => {
    if (onDelete && window.confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
      onDelete(team.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              <Link 
                href={`/teams/${team.id}`} 
                className="hover:text-blue-600 transition-colors"
              >
                {team.name}
              </Link>
            </h3>
            
            {team.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                {team.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <span className="font-medium">Players:</span>
                <span>{stats.totalPlayers}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="font-medium">Active:</span>
                <span className={stats.activePlayers === 0 ? 'text-red-500' : 'text-green-600'}>
                  {stats.activePlayers}
                </span>
              </div>

              {team.coach && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Coach:</span>
                  <span>{team.coach}</span>
                </div>
              )}

              {team.season && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Season:</span>
                  <span>{team.season}</span>
                </div>
              )}
            </div>

            <div className="mt-3 text-xs text-gray-400">
              Created {new Date(team.dateCreated).toLocaleDateString()}
            </div>
          </div>

          {!team.isActive && (
            <div className="ml-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Inactive
              </span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <Link href={`/teams/${team.id}`}>
              <Button variant="secondary" size="sm">
                View Details
              </Button>
            </Link>
            
            <Link href={`/teams/${team.id}/players`}>
              <Button variant="secondary" size="sm">
                Manage Players
              </Button>
            </Link>
            
            {onDelete && (
              <Button 
                variant="danger" 
                size="sm" 
                onClick={handleDelete}
                className="ml-auto"
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
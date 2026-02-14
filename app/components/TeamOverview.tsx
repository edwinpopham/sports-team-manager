// TeamOverview component for displaying team overview information
'use client';

import Link from 'next/link';
import { Team } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface TeamOverviewProps {
  team: Team;
}

export function TeamOverview({ team }: TeamOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Team Header Information */}
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
                {!team.isActive && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                )}
              </div>
              
              {team.description && (
                <p className="text-gray-600 text-base mb-4">{team.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
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
                <div className="flex items-center gap-1">
                  <span className="font-medium">Created:</span>
                  <span>{new Date(team.dateCreated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Players */}
      {team.players.length > 0 && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recent Players</h3>
              <Link href={`/teams/${team.id}/players`}>
                <Button variant="secondary" size="sm">
                  View All ({team.players.length})
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {team.players
                .slice()
                .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())
                .slice(0, 5)
                .map((player) => (
                  <div key={player.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {player.jerseyNumber && (
                        <span className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                          {player.jerseyNumber}
                        </span>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          {player.position && <span>{player.position}</span>}
                          {!player.isActive && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                      <div>Added</div>
                      <div>{new Date(player.dateAdded).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* Empty State for No Players */}
      {team.players.length === 0 && (
        <Card>
          <div className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Players Yet</h3>
            <p className="text-gray-500 mb-4">Start building your team by adding players.</p>
            <Link href={`/teams/${team.id}/players`}>
              <Button variant="primary">
                Add First Player
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href={`/teams/${team.id}/players`}>
          <Button variant="primary">
            {team.players.length === 0 ? 'Add Players' : 'Manage Players'}
          </Button>
        </Link>
        
        <Link href={`/teams/${team.id}/edit`}>
          <Button variant="secondary">
            Edit Team Details
          </Button>
        </Link>

        {team.players.length > 0 && (
          <Link href={`/teams/${team.id}/export`}>
            <Button variant="secondary">
              Export Roster
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
// TeamStats component for displaying team statistics
'use client';

import { Team, TeamStats as ITeamStats } from '../types';
import { calculateTeamStats, getTeamSummary } from '../lib/teams';
import { Card } from './ui/Card';

interface TeamStatsProps {
  team: Team;
}

export function TeamStats({ team }: TeamStatsProps) {
  const stats = calculateTeamStats(team);
  const summary = getTeamSummary(team);

  return (
    <div className="space-y-6">
      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalPlayers}</div>
            <div className="text-sm text-gray-600">Total Players</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.activePlayers}</div>
            <div className="text-sm text-gray-600">Active Players</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.inactivePlayers}</div>
            <div className="text-sm text-gray-600">Inactive Players</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {summary.hasFullRoster ? '✓' : stats.activePlayers < 11 ? '⚠️' : '✓'}
            </div>
            <div className="text-sm text-gray-600">Roster Status</div>
            <div className="text-xs text-gray-500 mt-1">
              {summary.hasFullRoster ? 'Full Roster' : 'Needs Players'}
            </div>
          </div>
        </Card>
      </div>

      {/* Position Breakdown */}
      {stats.positionCounts && Object.keys(stats.positionCounts).length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Position Breakdown</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(stats.positionCounts).map(([position, count]) => (
                <div key={position} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{position}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Team Activity</h4>
            <div className="text-lg font-semibold text-gray-900">
              {summary.mostRecentActivity}
            </div>
            <div className="text-xs text-gray-500">Last Player Added</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Team Size</h4>
            <div className="text-lg font-semibold text-gray-900">
              {stats.activePlayers}/{stats.totalPlayers}
            </div>
            <div className="text-xs text-gray-500">Active/Total Players</div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Positions Filled</h4>
            <div className="text-lg font-semibold text-gray-900">
              {stats.positionCounts ? Object.keys(stats.positionCounts).length : 0}
            </div>
            <div className="text-xs text-gray-500">Unique Positions</div>
          </div>
        </Card>
      </div>
    </div>
  );
}
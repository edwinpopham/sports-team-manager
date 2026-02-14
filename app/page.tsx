// Home page - Sports Team Manager dashboard
import Link from "next/link";
import { Button } from "./components/ui/Button";
import { Card } from "./components/ui/Card";

export default function Home() {
  return (
    <div className="px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sports Team Manager
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Streamline your team management with powerful roster tools, player tracking, 
            and team organization features designed for coaches and administrators.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/teams">
              <Button variant="primary" size="lg">
                View Teams
              </Button>
            </Link>
            <Link href="/teams/create">
              <Button variant="secondary" size="lg">
                Create New Team
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Management</h3>
            <p className="text-gray-600">
              Create and manage multiple teams with detailed information, coach assignments, and season tracking.
            </p>
          </Card>

          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Player Rosters</h3>
            <p className="text-gray-600">
              Add players, track positions, jersey numbers, and contact information in one organized place.
            </p>
          </Card>

          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Statistics</h3>
            <p className="text-gray-600">
              View team overview with player counts, position breakdowns, and roster status at a glance.
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Actions</h2>
            <p className="text-gray-600">Get started with these common tasks</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/teams/create" className="block">
              <Card className="p-4 hover:shadow-md transition-shadow text-center">
                <div className="text-blue-600 font-semibold mb-1">Create Team</div>
                <div className="text-sm text-gray-500">Set up a new team</div>
              </Card>
            </Link>
            
            <Link href="/teams" className="block">
              <Card className="p-4 hover:shadow-md transition-shadow text-center">
                <div className="text-green-600 font-semibold mb-1">View Teams</div>
                <div className="text-sm text-gray-500">Browse all teams</div>
              </Card>
            </Link>
            
            <Card className="p-4 text-center opacity-75">
              <div className="text-gray-400 font-semibold mb-1">Add Players</div>
              <div className="text-sm text-gray-400">Create a team first</div>
            </Card>
            
            <Card className="p-4 text-center opacity-75">
              <div className="text-gray-400 font-semibold mb-1">View Stats</div>
              <div className="text-sm text-gray-400">Add players first</div>
            </Card>
          </div>
        </Card>

        {/* Getting Started */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Getting Started</h3>
          <div className="text-blue-800 space-y-2">
            <p className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Create your first team with basic information
            </p>
            <p className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Add players to your roster with positions and jersey numbers
            </p>
            <p className="flex items-center gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold">3</span>
              View team statistics and manage your roster effectively
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

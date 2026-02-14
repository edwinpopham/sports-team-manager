// Team creation page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTeamContext } from '../../contexts/TeamContext';
import { TeamForm } from '../../components/forms/TeamForm';
import { TeamFormData } from '../../types/index';
import { validateTeam } from '../../lib/teams';
import { Card } from '../../components/ui/Card';
import Link from 'next/link';

export default function CreateTeamPage() {
  const router = useRouter();
  const { createTeam } = useTeamContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: TeamFormData) => {
    setIsLoading(true);
    setError(null);

    // Validate the team data
    const validation = validateTeam(formData);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      setIsLoading(false);
      return;
    }

    try {
      const newTeam = await createTeam({ ...formData, isActive: true });
      
      // Redirect to the new team's page
      router.push(`/teams/${newTeam.id}`);
    } catch (err) {
      console.error('Error creating team:', err);
      setError('Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
          <Link href="/teams" className="hover:text-blue-600 transition-colors">
            Teams
          </Link>
          <span>›</span>
          <span className="text-gray-900">Create New Team</span>
        </nav>
        
        <h1 className="text-3xl font-bold text-gray-900">Create New Team</h1>
        <p className="mt-2 text-gray-600">
          Set up a new team and start managing your roster.
        </p>
      </div>

      <Card>
        <div className="p-6">
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

          <TeamForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitLabel="Create Team"
            isLoading={isLoading}
          />

          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Getting Started Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Choose a clear, descriptive team name</li>
              <li>• Add a season (e.g., "2024 Fall", "Spring 2024") to organize teams by time period</li>
              <li>• Include coach information for easy contact reference</li>
              <li>• You can add players to your team after creation</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
// Base form components for team and player inputs
'use client';

import { useState } from 'react';
import { TeamFormData } from '../../types/index';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface TeamFormProps {
  initialData?: Partial<TeamFormData>;
  onSubmit: (data: TeamFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export function TeamForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  submitLabel = 'Create Team',
  isLoading = false
}: TeamFormProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    coach: initialData.coach || '',
    season: initialData.season || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof TeamFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Team Name *"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        error={errors.name}
        placeholder="Enter team name"
      />

      <Input
        label="Description"
        value={formData.description || ''}
        onChange={(e) => handleInputChange('description', e.target.value)}
        placeholder="Brief description of the team"
      />

      <Input
        label="Coach"
        value={formData.coach || ''}
        onChange={(e) => handleInputChange('coach', e.target.value)}
        placeholder="Head coach name"
      />

      <Input
        label="Season"
        value={formData.season || ''}
        onChange={(e) => handleInputChange('season', e.target.value)}
        placeholder="e.g., 2024 Spring, 2024-2025"
      />

      <div className="flex space-x-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
        
        {onCancel && (
          <Button 
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
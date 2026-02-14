// Player form component for adding and editing players
'use client';

import { useState } from 'react';
import { PlayerFormData } from '../../types/index';
import { Input } from '../ui/Input';
import { LoadingButton } from '../ui/Loading';

interface PlayerFormProps {
  initialData?: Partial<PlayerFormData>;
  onSubmit: (data: PlayerFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
  existingJerseyNumbers?: number[];
}

export function PlayerForm({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  submitLabel = 'Add Player',
  isLoading = false,
  existingJerseyNumbers = []
}: PlayerFormProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    name: initialData.name || '',
    email: initialData.email || '',
    phone: initialData.phone || '',
    position: initialData.position || '',
    jerseyNumber: initialData.jerseyNumber || undefined,
    notes: initialData.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.jerseyNumber && existingJerseyNumbers.includes(formData.jerseyNumber)) {
      newErrors.jerseyNumber = 'This jersey number is already taken';
    }

    if (formData.jerseyNumber !== undefined && (formData.jerseyNumber < 0 || formData.jerseyNumber > 999)) {
      newErrors.jerseyNumber = 'Jersey number must be between 0 and 999';
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

  const handleInputChange = (field: keyof PlayerFormData, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Player Name *"
        value={formData.name}
        onChange={(e) => handleInputChange('name', e.target.value)}
        error={errors.name}
        placeholder="Enter player name"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
          placeholder="player@example.com"
        />

        <Input
          label="Phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Position"
          value={formData.position || ''}
          onChange={(e) => handleInputChange('position', e.target.value)}
          placeholder="e.g., Forward, Midfielder, Goalkeeper"
        />

        <Input
          label="Jersey Number"
          type="number"
          min="0"
          max="999"
          value={formData.jerseyNumber || ''}
          onChange={(e) => handleInputChange('jerseyNumber', e.target.value ? parseInt(e.target.value) : undefined)}
          error={errors.jerseyNumber}
          placeholder="Jersey #"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          rows={3}
          value={formData.notes || ''}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Any additional notes about the player..."
        />
      </div>

      <div className="flex space-x-4">
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          variant="primary"
          className="flex-1"
        >
          {submitLabel}
        </LoadingButton>
        
        {onCancel && (
          <LoadingButton
            type="button" 
            variant="secondary" 
            onClick={onCancel}
            className="flex-1"
            isLoading={false}
          >
            Cancel
          </LoadingButton>
        )}
      </div>
    </form>
  );
}
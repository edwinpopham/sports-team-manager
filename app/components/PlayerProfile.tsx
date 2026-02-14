// PlayerProfile component for displaying and editing player information
'use client';

import { useState } from 'react';
import { Player } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface PlayerProfileProps {
  player: Player;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updatedPlayer: Partial<Player>) => Promise<void>;
  onCancel: () => void;
  onDelete?: (playerId: string) => Promise<void>;
}

export function PlayerProfile({ 
  player, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel,
  onDelete 
}: PlayerProfileProps) {
  const [formData, setFormData] = useState({
    name: player.name,
    email: player.email || '',
    phone: player.phone || '',
    position: player.position || '',
    jerseyNumber: player.jerseyNumber || '',
    notes: player.notes || '',
    isActive: player.isActive
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Player name is required';
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.phone && !isValidPhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (formData.jerseyNumber !== null && formData.jerseyNumber !== undefined && formData.jerseyNumber !== '') {
      const jerseyNum = typeof formData.jerseyNumber === 'string' ? parseInt(formData.jerseyNumber) : formData.jerseyNumber;
      if (isNaN(jerseyNum) || jerseyNum < 0 || jerseyNum > 99) {
        newErrors.jerseyNumber = 'Jersey number must be between 0 and 99';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const updatedData = {
      ...formData,
      jerseyNumber: formData.jerseyNumber && formData.jerseyNumber !== '' ? 
        (typeof formData.jerseyNumber === 'string' ? parseInt(formData.jerseyNumber) : formData.jerseyNumber) : 
        undefined
    };

    try {
      await onSave(updatedData);
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: player.name,
      email: player.email || '',
      phone: player.phone || '',
      position: player.position || '',
      jerseyNumber: player.jerseyNumber || '',
      notes: player.notes || '',
      isActive: player.isActive
    });
    setErrors({});
    onCancel();
  };

  const handleDelete = async () => {
    if (onDelete) {
      try {
        await onDelete(player.id);
        setShowDeleteConfirm(false);
      } catch (error) {
        console.error('Error deleting player:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <Card>
        <div className="p-6">
          {isEditing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    error={errors.name}
                    placeholder="Player name"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jersey #</label>
                  <Input
                    type="number"
                    value={formData.jerseyNumber}
                    onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                    error={errors.jerseyNumber}
                    placeholder="0-99"
                    min={0}
                    max={99}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active Player</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {player.jerseyNumber && (
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xl font-bold">
                      {player.jerseyNumber}
                    </div>
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{player.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {player.position && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {player.position}
                      </span>
                    )}
                    {!player.isActive && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button variant="secondary" onClick={onEdit}>
                  Edit Profile
                </Button>
                {onDelete && (
                  <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Player Details */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          
          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    error={errors.email}
                    placeholder="player@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    error={errors.phone}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <Input
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="e.g., Forward, Midfielder"
                  />
                </div>
                <div>
                  {/* Empty space for layout balance */}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Additional notes about the player..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="primary" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button variant="secondary" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Details</h4>
                  <div className="space-y-2">
                    {player.email ? (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">Email:</span>
                        <a href={`mailto:${player.email}`} className="text-blue-600 hover:underline">
                          {player.email}
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No email on file</div>
                    )}
                    
                    {player.phone ? (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 w-16">Phone:</span>
                        <a href={`tel:${player.phone}`} className="text-blue-600 hover:underline">
                          {player.phone}
                        </a>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No phone on file</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Player Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Added:</span> {new Date(player.dateAdded).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>


              {player.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{player.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Player</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <strong>{player.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button variant="danger" onClick={handleDelete}>
                  Delete Player
                </Button>
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Basic phone validation - allows various formats
  const phoneRegex = /^[\d\s\-\(\)\+\.]{10,}$/;
  return phoneRegex.test(phone);
}
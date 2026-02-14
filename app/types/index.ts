// Core entity types for the Sports Team Manager application

export interface Player {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  jerseyNumber?: number;
  isActive: boolean;
  dateAdded: string;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  coach?: string;
  season?: string;
  dateCreated: string;
  players: Player[];
  isActive: boolean;
}

export interface TeamStats {
  totalPlayers: number;
  activePlayers: number;
  inactivePlayers: number;
  averageAge?: number;
  positionCounts?: Record<string, number>;
}

// Form state interfaces
export interface TeamFormData {
  name: string;
  description?: string;
  coach?: string;
  season?: string;
}

export interface PlayerFormData {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  jerseyNumber?: number;
  notes?: string;
}

// Storage interfaces
export interface StorageData {
  teams: Team[];
  lastUpdated: string;
}
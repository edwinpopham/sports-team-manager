// Local storage utilities for data persistence
import { Team, Player, StorageData } from '../types/index';

const STORAGE_KEY = 'sports-team-manager-data';

// Generic storage operations
export function getStorageData(): StorageData {
  if (typeof window === 'undefined') {
    return { teams: [], lastUpdated: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { teams: [], lastUpdated: new Date().toISOString() };
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return { teams: [], lastUpdated: new Date().toISOString() };
  }
}

export function saveStorageData(data: StorageData): void {
  if (typeof window === 'undefined') return;

  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Team operations
export function getAllTeams(): Team[] {
  const data = getStorageData();
  return data.teams;
}

export function getTeamById(id: string): Team | null {
  const teams = getAllTeams();
  return teams.find(team => team.id === id) || null;
}

export function saveTeam(team: Team): void {
  const data = getStorageData();
  const existingIndex = data.teams.findIndex(t => t.id === team.id);
  
  if (existingIndex >= 0) {
    data.teams[existingIndex] = team;
  } else {
    data.teams.push(team);
  }
  
  saveStorageData(data);
}

export function deleteTeam(id: string): void {
  const data = getStorageData();
  data.teams = data.teams.filter(team => team.id !== id);
  saveStorageData(data);
}

// Player operations
export function addPlayerToTeam(teamId: string, player: Player): boolean {
  const team = getTeamById(teamId);
  if (!team) return false;

  team.players.push(player);
  saveTeam(team);
  return true;
}

export function updatePlayerInTeam(teamId: string, playerId: string, updatedPlayer: Player): boolean {
  const team = getTeamById(teamId);
  if (!team) return false;

  const playerIndex = team.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return false;

  team.players[playerIndex] = updatedPlayer;
  saveTeam(team);
  return true;
}

export function removePlayerFromTeam(teamId: string, playerId: string): boolean {
  const team = getTeamById(teamId);
  if (!team) return false;

  team.players = team.players.filter(p => p.id !== playerId);
  saveTeam(team);
  return true;
}

export function getPlayerById(teamId: string, playerId: string): Player | null {
  const team = getTeamById(teamId);
  if (!team) return null;
  
  return team.players.find(p => p.id === playerId) || null;
}

// Utility functions
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function clearAllData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
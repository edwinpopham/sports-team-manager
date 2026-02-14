// Team management context provider
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Team, Player } from '../types/index';
import * as storage from '../lib/storage';

interface TeamContextType {
  teams: Team[];
  loading: boolean;
  // Team operations
  createTeam: (teamData: Omit<Team, 'id' | 'dateCreated' | 'players'>) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team | null>;
  deleteTeam: (id: string) => Promise<boolean>;
  getTeam: (id: string) => Team | null;
  // Player operations
  addPlayer: (teamId: string, playerData: Omit<Player, 'id' | 'dateAdded'>) => Promise<Player | null>;
  updatePlayer: (teamId: string, playerId: string, updates: Partial<Player>) => Promise<Player | null>;
  removePlayer: (teamId: string, playerId: string) => Promise<boolean>;
  getPlayer: (teamId: string, playerId: string) => Player | null;
  // Data refresh
  refreshData: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType | null>(null);

export function useTeamContext() {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
}

interface TeamProviderProps {
  children: ReactNode;
}

export function TeamProvider({ children }: TeamProviderProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = useCallback(async () => {
    try {
      setLoading(true);
      const storedTeams = storage.getAllTeams();
      setTeams(storedTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = async (teamData: Omit<Team, 'id' | 'dateCreated' | 'players'>): Promise<Team> => {
    const newTeam: Team = {
      ...teamData,
      id: storage.generateId(),
      dateCreated: new Date().toISOString(),
      players: [],
      isActive: true
    };

    storage.saveTeam(newTeam);
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  };

  const updateTeam = async (id: string, updates: Partial<Team>): Promise<Team | null> => {
    const existingTeam = storage.getTeamById(id);
    if (!existingTeam) return null;

    const updatedTeam = { ...existingTeam, ...updates };
    storage.saveTeam(updatedTeam);
    
    setTeams(prev => 
      prev.map(team => team.id === id ? updatedTeam : team)
    );
    
    return updatedTeam;
  };

  const deleteTeam = async (id: string): Promise<boolean> => {
    try {
      storage.deleteTeam(id);
      setTeams(prev => prev.filter(team => team.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  };

  const getTeam = (id: string): Team | null => {
    return teams.find(team => team.id === id) || null;
  };

  const addPlayer = async (teamId: string, playerData: Omit<Player, 'id' | 'dateAdded'>): Promise<Player | null> => {
    const newPlayer: Player = {
      ...playerData,
      id: storage.generateId(),
      dateAdded: new Date().toISOString(),
      isActive: true
    };

    const success = storage.addPlayerToTeam(teamId, newPlayer);
    if (!success) return null;

    // Update local state
    setTeams(prev => 
      prev.map(team => 
        team.id === teamId 
          ? { ...team, players: [...team.players, newPlayer] }
          : team
      )
    );

    return newPlayer;
  };

  const updatePlayer = async (teamId: string, playerId: string, updates: Partial<Player>): Promise<Player | null> => {
    const team = getTeam(teamId);
    if (!team) return null;

    const existingPlayer = team.players.find(p => p.id === playerId);
    if (!existingPlayer) return null;

    const updatedPlayer = { ...existingPlayer, ...updates };
    const success = storage.updatePlayerInTeam(teamId, playerId, updatedPlayer);
    
    if (!success) return null;

    // Update local state
    setTeams(prev => 
      prev.map(team => 
        team.id === teamId 
          ? { 
              ...team, 
              players: team.players.map(p => p.id === playerId ? updatedPlayer : p)
            }
          : team
      )
    );

    return updatedPlayer;
  };

  const removePlayer = async (teamId: string, playerId: string): Promise<boolean> => {
    const success = storage.removePlayerFromTeam(teamId, playerId);
    if (!success) return false;

    // Update local state
    setTeams(prev => 
      prev.map(team => 
        team.id === teamId 
          ? { ...team, players: team.players.filter(p => p.id !== playerId) }
          : team
      )
    );

    return true;
  };

  const getPlayer = (teamId: string, playerId: string): Player | null => {
    const team = getTeam(teamId);
    if (!team) return null;
    return team.players.find(p => p.id === playerId) || null;
  };

  const refreshData = useCallback(async () => {
    await loadTeams();
  }, [loadTeams]);

  const contextValue: TeamContextType = {
    teams,
    loading,
    createTeam,
    updateTeam,
    deleteTeam,
    getTeam,
    addPlayer,
    updatePlayer,
    removePlayer,
    getPlayer,
    refreshData
  };

  return (
    <TeamContext.Provider value={contextValue}>
      {children}
    </TeamContext.Provider>
  );
}
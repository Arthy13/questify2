import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Award, Clock, Target, TrendingUp, Users } from 'lucide-react';
import { User } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  score: number;
  percentage: number;
  time_spent: number;
  rank_position: number;
  completed_at: string;
}

interface LiveLeaderboardProps {
  groupQuizId: string;
  user: User;
  className?: string;
}

export const LiveLeaderboard: React.FC<LiveLeaderboardProps> = ({
  groupQuizId,
  user,
  className = ""
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const { supabase } = useSupabaseData(user);

  useEffect(() => {
    if (groupQuizId && supabase) {
      loadLeaderboard();
      subscribeToUpdates();
    }
  }, [groupQuizId, supabase]);

  const loadLeaderboard = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('leaderboards')
        .select('*')
        .eq('group_quiz_id', groupQuizId)
        .order('rank_position', { ascending: true });

      if (error) throw error;

      setLeaderboard(data || []);
      setTotalParticipants(data?.length || 0);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!supabase) return;

    const subscription = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboards',
          filter: `group_quiz_id=eq.${groupQuizId}`
        },
        (payload) => {
          console.log('Leaderboard update:', payload);
          loadLeaderboard(); // Reload the entire leaderboard for simplicity
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
            {rank}
          </div>
        );
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-400 to-blue-600';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Live Leaderboard</h3>
              <p className="text-sm text-gray-500">Real-time quiz results</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{totalParticipants} participants</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="p-6">
        {leaderboard.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                    entry.user_id === user.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Rank indicator */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${getRankColor(entry.rank_position)}`}></div>
                  
                  <div className="flex items-center justify-between p-4 pl-6">
                    <div className="flex items-center space-x-4">
                      {getRankIcon(entry.rank_position)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className={`font-semibold ${
                            entry.user_id === user.id ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {entry.username}
                          </h4>
                          {entry.user_id === user.id && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Target className="h-3 w-3" />
                            <span>{entry.score} points</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(entry.time_spent)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getPerformanceColor(entry.percentage)}`}>
                        {entry.percentage}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(entry.completed_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Performance bar */}
                  <div className="px-6 pb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          entry.percentage >= 90 ? 'bg-green-500' :
                          entry.percentage >= 80 ? 'bg-blue-500' :
                          entry.percentage >= 70 ? 'bg-yellow-500' :
                          entry.percentage >= 60 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${entry.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No participants yet</p>
            <p className="text-sm text-gray-400">Results will appear here as students complete the quiz</p>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {leaderboard.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(leaderboard.reduce((sum, entry) => sum + entry.percentage, 0) / leaderboard.length)}%
              </div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatTime(Math.round(leaderboard.reduce((sum, entry) => sum + entry.time_spent, 0) / leaderboard.length))}
              </div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {leaderboard.filter(entry => entry.percentage >= 80).length}
              </div>
              <div className="text-xs text-gray-500">High Scorers</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
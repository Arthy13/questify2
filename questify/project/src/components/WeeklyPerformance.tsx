import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Award, Target, Clock, BarChart3 } from 'lucide-react';
import { User } from '../types';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface WeeklyData {
  week_start: string;
  week_end: string;
  total_quizzes: number;
  average_score: number;
  best_score: number;
  rank_position: number;
  improvement_percentage: number;
}

interface WeeklyPerformanceProps {
  user: User;
  className?: string;
}

export const WeeklyPerformance: React.FC<WeeklyPerformanceProps> = ({
  user,
  className = ""
}) => {
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [currentWeek, setCurrentWeek] = useState<WeeklyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { supabase } = useSupabaseData(user);

  useEffect(() => {
    if (user && supabase) {
      loadWeeklyPerformance();
      subscribeToUpdates();
    }
  }, [user, supabase]);

  const loadWeeklyPerformance = async () => {
    if (!supabase) return;

    try {
      // Load last 8 weeks of data
      const { data, error } = await supabase
        .from('weekly_performance')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(8);

      if (error) throw error;

      const sortedData = (data || []).reverse(); // Show oldest to newest for chart
      setWeeklyData(sortedData);
      
      // Current week is the most recent entry
      if (data && data.length > 0) {
        setCurrentWeek(data[0]);
      }
    } catch (error) {
      console.error('Error loading weekly performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    if (!supabase) return;

    const subscription = supabase
      .channel('weekly-performance-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weekly_performance',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Weekly performance update:', payload);
          loadWeeklyPerformance();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const formatWeekRange = (weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getImprovementIcon = (improvement: number) => {
    if (improvement > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (improvement < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Target className="h-4 w-4 text-gray-500" />;
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank <= 3) return 'bg-yellow-100 text-yellow-800';
    if (rank <= 10) return 'bg-blue-100 text-blue-800';
    if (rank <= 20) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-100 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-100 rounded"></div>
            <div className="h-20 bg-gray-100 rounded"></div>
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
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Weekly Performance</h3>
              <p className="text-sm text-gray-500">Track your progress over time</p>
            </div>
          </div>
          {currentWeek && (
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(currentWeek.rank_position)}`}>
              Rank #{currentWeek.rank_position}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Current Week Stats */}
        {currentWeek && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">This Week</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{currentWeek.total_quizzes}</div>
                <div className="text-xs text-gray-600">Quizzes</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(currentWeek.average_score)}%</div>
                <div className="text-xs text-gray-600">Avg Score</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{currentWeek.best_score}%</div>
                <div className="text-xs text-gray-600">Best Score</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className={`text-2xl font-bold flex items-center justify-center space-x-1 ${getImprovementColor(currentWeek.improvement_percentage)}`}>
                  {getImprovementIcon(currentWeek.improvement_percentage)}
                  <span>{Math.abs(currentWeek.improvement_percentage)}%</span>
                </div>
                <div className="text-xs text-gray-600">Change</div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Chart */}
        {weeklyData.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Trend</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="week_start" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    labelFormatter={(value) => `Week of ${new Date(value).toLocaleDateString()}`}
                    formatter={(value: any, name: string) => [
                      name === 'average_score' ? `${Math.round(value)}%` : value,
                      name === 'average_score' ? 'Average Score' : 'Quizzes Taken'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="average_score" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Weekly Breakdown */}
        {weeklyData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Weekly Breakdown</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {weeklyData.slice().reverse().map((week, index) => (
                <motion.div
                  key={`${week.week_start}-${week.week_end}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatWeekRange(week.week_start, week.week_end)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {week.total_quizzes} quizzes • Rank #{week.rank_position}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{Math.round(week.average_score)}%</div>
                    <div className={`text-sm flex items-center space-x-1 ${getImprovementColor(week.improvement_percentage)}`}>
                      {getImprovementIcon(week.improvement_percentage)}
                      <span>{Math.abs(week.improvement_percentage)}%</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {weeklyData.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No weekly data yet</p>
            <p className="text-sm text-gray-400">Complete some quizzes to see your weekly performance</p>
          </div>
        )}
      </div>
    </div>
  );
};
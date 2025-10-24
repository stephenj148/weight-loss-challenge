import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { CompetitionService } from '../services/competitionService';
import { Competition, UserStats } from '../types';
import PersonalProgressChart from '../components/PersonalProgressChart';
import LeaderboardChart from '../components/LeaderboardChart';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [currentCompetition, setCurrentCompetition] = useState<Competition | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load competitions
      const competitionsData = await CompetitionService.getCompetitions();
      setCompetitions(competitionsData);

      // Find current active competition
      const activeCompetition = competitionsData.find(comp => 
        CompetitionService.isCompetitionActive(comp)
      );
      
      if (activeCompetition) {
        setCurrentCompetition(activeCompetition);
        
        // Load user stats for current competition
        const stats = await CompetitionService.getUserStats(activeCompetition.year, user.uid);
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Weight Loss Competition
              </h1>
              <p className="text-gray-600">Welcome back, {user?.displayName}!</p>
            </div>
            <div className="flex items-center space-x-4">
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="btn-outline"
                >
                  Admin Panel
                </Link>
              )}
              <button
                onClick={handleSignOut}
                className="btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentCompetition ? (
          <div className="space-y-6">
            {/* Competition Info */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentCompetition.year} Competition
                </h2>
                <p className="text-gray-600">
                  Week {CompetitionService.getCurrentWeek(currentCompetition.startDate)} of 12
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            {userStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Current Weight"
                  value={`${userStats.currentWeight.toFixed(1)} lbs`}
                  icon="⚖️"
                />
                <StatsCard
                  title="Total Loss"
                  value={`${userStats.totalWeightLoss.toFixed(1)} lbs`}
                  icon="📉"
                  color="success"
                />
                <StatsCard
                  title="Loss Percentage"
                  value={`${userStats.totalWeightLossPercentage.toFixed(1)}%`}
                  icon="📊"
                  color="primary"
                />
                <StatsCard
                  title="Weeks Participated"
                  value={`${userStats.weeksParticipated}/12`}
                  icon="📅"
                />
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Progress Chart */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    Your Progress
                  </h3>
                </div>
                <div className="card-body">
                  <PersonalProgressChart
                    year={currentCompetition.year}
                    userId={user?.uid || ''}
                  />
                </div>
              </div>

              {/* Leaderboard Chart */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium text-gray-900">
                    Competition Leaderboard
                  </h3>
                </div>
                <div className="card-body">
                  <LeaderboardChart
                    year={currentCompetition.year}
                  />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Quick Actions
                </h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/weigh-in"
                    className="btn-primary"
                  >
                    Submit Weigh-In
                  </Link>
                  <button
                    onClick={loadDashboardData}
                    className="btn-outline"
                  >
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="card max-w-md mx-auto">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Active Competition
                </h3>
                <p className="text-gray-600 mb-4">
                  There are no active competitions at the moment.
                </p>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="btn-primary"
                  >
                    Create New Competition
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

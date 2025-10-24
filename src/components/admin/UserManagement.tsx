import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CompetitionService } from '../../services/competitionService';
import { User, Competition, UserStats } from '../../types';

interface UserManagementProps {
  users: User[];
  competitions: Competition[];
  onUserUpdate: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  competitions,
  onUserUpdate,
}) => {
  const [userStats, setUserStats] = useState<{ [userId: string]: UserStats }>({});
  const [loading, setLoading] = useState(true);
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);

  useEffect(() => {
    loadUserStats();
  }, [competitions, users]);

  const loadUserStats = async () => {
    if (competitions.length === 0 || users.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use the most recent active competition or the first one
      const activeCompetition = competitions.find(comp => 
        CompetitionService.isCompetitionActive(comp)
      ) || competitions[0];

      if (!activeCompetition) {
        setLoading(false);
        return;
      }

      setSelectedCompetition(activeCompetition.year);

      // Load stats for all users
      const statsPromises = users.map(async (user) => {
        const stats = await CompetitionService.getUserStats(activeCompetition.year, user.uid);
        return { userId: user.uid, stats };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: { [userId: string]: UserStats } = {};
      
      statsResults.forEach(({ userId, stats }) => {
        if (stats) {
          statsMap[userId] = stats;
        }
      });

      setUserStats(statsMap);
    } catch (error) {
      console.error('Error loading user stats:', error);
      toast.error('Failed to load user statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleEditWeighIn = async (userId: string, weekNumber: number, newWeight: number) => {
    if (!selectedCompetition) return;

    try {
      await CompetitionService.submitWeighIn(
        selectedCompetition,
        userId,
        weekNumber,
        newWeight
      );
      
      toast.success('Weigh-in updated successfully!');
      loadUserStats(); // Reload stats
    } catch (error) {
      console.error('Error updating weigh-in:', error);
      toast.error('Failed to update weigh-in');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCompetition || ''}
            onChange={(e) => setSelectedCompetition(Number(e.target.value))}
            className="input"
          >
            {competitions.map((comp) => (
              <option key={comp.year} value={comp.year}>
                {comp.year} Competition
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Weight
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loss %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Weeks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Weigh-In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const stats = userStats[user.uid];
                return (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium">
                              {user.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.displayName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats?.startWeight.toFixed(1) || 'N/A'} lbs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats?.currentWeight.toFixed(1) || 'N/A'} lbs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        stats && stats.totalWeightLoss > 0 ? 'text-success-600' : 'text-gray-500'
                      }`}>
                        {stats?.totalWeightLoss.toFixed(1) || '0.0'} lbs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${
                        stats && stats.totalWeightLossPercentage > 0 ? 'text-success-600' : 'text-gray-500'
                      }`}>
                        {stats?.totalWeightLossPercentage.toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stats?.weeksParticipated || 0}/12
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats?.lastWeighIn?.toLocaleDateString() || 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          // This would open a modal to edit weigh-ins
                          toast.info('Edit weigh-in feature coming soon!');
                        }}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Edit Weigh-ins
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-primary-600">
              {users.length}
            </p>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-success-600">
              {Object.values(userStats).filter(stats => stats.totalWeightLoss > 0).length}
            </p>
            <p className="text-sm text-gray-500">Users Losing Weight</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-warning-600">
              {Object.values(userStats).reduce((sum, stats) => sum + stats.weeksParticipated, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Weigh-ins</p>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <p className="text-2xl font-bold text-danger-600">
              {Object.values(userStats).reduce((sum, stats) => sum + stats.totalWeightLoss, 0).toFixed(1)}
            </p>
            <p className="text-sm text-gray-500">Total Weight Lost (lbs)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

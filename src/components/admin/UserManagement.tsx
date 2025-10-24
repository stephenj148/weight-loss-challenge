import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CompetitionService } from '../../services/competitionService';
import { User, Competition, UserStats } from '../../types';

interface UserManagementProps {
  users: User[];
  competitions: Competition[];
  onUserUpdate: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, competitions, onUserUpdate }) => {
  console.log('UserManagement component loaded with:', { users: users.length, competitions: competitions.length });
  
  const [selectedCompetition, setSelectedCompetition] = useState<number | null>(null);
  const [allStats, setAllStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, [competitions, users]);

  const loadUserStats = async () => {
    if (competitions.length === 0 || users.length === 0) {
      console.log('Skipping user stats load - no competitions or users');
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
        console.log('No active competition found');
        setLoading(false);
        return;
      }

      console.log(`Loading stats for competition ${activeCompetition.year} with ${users.length} users`);
      setSelectedCompetition(activeCompetition.year);

      // Get stats for each user individually, including users with no weigh-ins
      const statsPromises = users.map(async (user) => {
        console.log(`Getting stats for user: ${user.uid} (${user.displayName})`);
        const userStats = await CompetitionService.getUserStats(activeCompetition.year, user.uid);
        
        // If no stats found, create a default entry for this user
        if (!userStats) {
          console.log(`No weigh-ins found for user ${user.uid}, creating default entry`);
          return {
            userId: user.uid,
            displayName: user.displayName,
            startWeight: 0,
            currentWeight: 0,
            totalWeightLoss: 0,
            totalWeightLossPercentage: 0,
            averageWeeklyLoss: 0,
            weeksParticipated: 0,
            totalWeighIns: 0,
            lastWeighIn: undefined,
            weighIns: []
          };
        } else {
          // Add the user's display name to the stats
          userStats.displayName = user.displayName;
          return userStats;
        }
      });

      const allStats = await Promise.all(statsPromises);
      
      console.log('User stats loaded (including users with no weigh-ins):', allStats);
      setAllStats(allStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
      toast.error('Failed to load user stats');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWeighIn = async (userId: string, weekNumber: number, newWeight: number) => {
    if (!selectedCompetition) return;

    try {
      await CompetitionService.submitWeighIn(selectedCompetition, userId, weekNumber, newWeight);
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
            onChange={(e) => {
              const year = parseInt(e.target.value);
              setSelectedCompetition(year);
              // Reload stats for selected competition
              if (year) {
                CompetitionService.getAllUserStats(year).then(stats => {
                  setAllStats(stats);
                }).catch(error => {
                  console.error('Error loading stats:', error);
                  toast.error('Failed to load stats');
                });
              }
            }}
            className="input"
          >
            <option value="">Select Competition</option>
            {competitions.map(comp => (
              <option key={comp.year} value={comp.year}>
                {comp.year} Competition
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
        </div>
        <div className="card-body">
          {allStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No user data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weigh-ins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight Loss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allStats.map((stat) => {
                    const user = users.find(u => u.uid === stat.userId);
                    return (
                      <tr key={stat.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.displayName || user?.displayName || 'Unknown User'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user?.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user?.role || 'regular'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stat.totalWeighIns || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-semibold">
                          {stat.totalWeighIns > 0 ? `-${stat.totalWeightLoss.toFixed(1)} lbs` : 'No weigh-ins yet'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => {
                              // This would open a modal to edit weigh-ins
                              toast.success('Edit weigh-in feature coming soon!');
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;

import React, { useState, useEffect } from 'react';
import { CompetitionService } from '../../services/competitionService';
import { Competition, UserStats } from '../../types';
import LoadingSpinner from '../LoadingSpinner';

interface CompetitionStatsProps {
  competitions: Competition[];
}

const CompetitionStats: React.FC<CompetitionStatsProps> = ({ competitions }) => {
  const [selectedCompetition, setSelectedCompetition] = useState<Competition | null>(null);
  const [allStats, setAllStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (competitions.length > 0) {
      const activeCompetition = competitions.find(comp => 
        CompetitionService.isCompetitionActive(comp)
      ) || competitions[0];
      setSelectedCompetition(activeCompetition);
    }
  }, [competitions]);

  useEffect(() => {
    if (selectedCompetition) {
      loadCompetitionStats();
    }
  }, [selectedCompetition]);

  const loadCompetitionStats = async () => {
    if (!selectedCompetition) return;

    try {
      setLoading(true);
      const stats = await CompetitionService.getAllUserStats(selectedCompetition.year);
      console.log('Competition stats loaded:' stats);
      setAllStats(stats);
    } catch (error) {
      console.error('Error loading competition stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopPerformers = (limit: number = 5) => {
    return allStats
      .sort((a, b) => b.totalWeightLossPercentage - a.totalWeightLossPercentage)
      .slice(0, limit);
  };

  const getMostConsistent = (limit: number = 5) => {
    return allStats
      .sort((a, b) => b.weeksParticipated - a.weeksParticipated)
      .slice(0, limit);
  };

  const getAverageStats = () => {
    if (allStats.length === 0) return null;

    const totalWeightLoss = allStats.reduce((sum, stats) => sum + stats.totalWeightLoss, 0);
    const totalWeightLossPercentage = allStats.reduce((sum, stats) => sum + stats.totalWeightLossPercentage, 0);
    const totalWeeksParticipated = allStats.reduce((sum, stats) => sum + stats.weeksParticipated, 0);

    return {
      averageWeightLoss: totalWeightLoss / allStats.length,
      averageWeightLossPercentage: totalWeightLossPercentage / allStats.length,
      averageWeeksParticipated: totalWeeksParticipated / allStats.length,
      totalParticipants: allStats.length,
    };
  };

  const averageStats = getAverageStats();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Competition Statistics</h2>
        <select
          value={selectedCompetition?.year || ''}
          onChange={(e) => {
            const comp = competitions.find(c => c.year === Number(e.target.value));
            setSelectedCompetition(comp || null);
          }}
          className="input"
        >
          {competitions.map((comp) => (
            <option key={comp.year} value={comp.year}>
              {comp.year} Competition
            </option>
          ))}
        </select>
      </div>

      {selectedCompetition && (
        <>
          {/* Competition Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedCompetition.year} Competition Overview
              </h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`text-lg font-semibold ${
                    selectedCompetition.status === 'active' ? 'text-success-600' :
                    selectedCompetition.status === 'archived' ? 'text-gray-600' :
                    'text-warning-600'
                  }`}>
                    {selectedCompetition.status.charAt(0).toUpperCase() + selectedCompetition.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Week</p>
                  <p className="text-lg font-semibold">
                    Week {CompetitionService.getCurrentWeek(selectedCompetition.startDate)} of 12
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">
                    {Math.ceil((selectedCompetition.endDate.getTime() - selectedCompetition.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000))} weeks
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Average Stats */}
          {averageStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-3xl font-bold text-primary-600">
                    {averageStats.totalParticipants}
                  </p>
                  <p className="text-sm text-gray-500">Total Participants</p>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-3xl font-bold text-success-600">
                    {averageStats.averageWeightLoss.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">Avg Weight Loss (lbs)</p>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-3xl font-bold text-warning-600">
                    {averageStats.averageWeightLossPercentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Avg Loss Percentage</p>
                </div>
              </div>
              <div className="card">
                <div className="card-body text-center">
                  <p className="text-3xl font-bold text-danger-600">
                    {averageStats.averageWeeksParticipated.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-500">Avg Weeks Participated</p>
                </div>
              </div>
            </div>
          )}

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Weight Loss */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  🏆 Top Performers (Weight Loss %)
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {getTopPerformers().map((stats, index) => (
                    <div key={stats.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' :
                          'bg-primary-100 text-primary-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stats.name}</p>
                          <p className="text-sm text-gray-500">
                            {stats.totalWeightLoss.toFixed(1)} lbs lost
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-success-600">
                          {stats.totalWeightLossPercentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {stats.weeksParticipated} weeks
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Consistent */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">
                  📅 Most Consistent Participants
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {getMostConsistent().map((stats, index) => (
                    <div key={stats.userId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stats.name}</p>
                          <p className="text-sm text-gray-500">
                            {stats.totalWeightLoss.toFixed(1)} lbs lost
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-600">
                          {stats.weeksParticipated}/12 weeks
                        </p>
                        <p className="text-sm text-gray-500">
                          {stats.totalWeightLossPercentage.toFixed(1)}% loss
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Detailed Participant Statistics
              </h3>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
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
                        Avg Weekly Loss
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Weeks Participated
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allStats.map((stats) => (
                      <tr key={stats.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {stats.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stats.startWeight.toFixed(1)} lbs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stats.currentWeight.toFixed(1)} lbs
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`font-medium ${
                            stats.totalWeightLoss > 0 ? 'text-success-600' : 'text-gray-500'
                          }`}>
                            {stats.totalWeightLoss.toFixed(1)} lbs
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`font-medium ${
                            stats.totalWeightLossPercentage > 0 ? 'text-success-600' : 'text-gray-500'
                          }`}>
                            {stats.totalWeightLossPercentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stats.averageWeeklyLoss.toFixed(1)} lbs/week
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {stats.weeksParticipated}/12
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CompetitionStats;

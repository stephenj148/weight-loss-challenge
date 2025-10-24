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
      console.log('Competition stats loaded:', stats);
      setAllStats(stats);
    } catch (error) {
      console.error('Error loading competition stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopPerformers = (limit: number = 5) => {
    return allStats
      .sort((a, b) => b.totalWeightLoss - a.totalWeightLoss)
      .slice(0, limit);
  };

  const getAverageWeightLoss = () => {
    if (allStats.length === 0) return 0;
    const totalLoss = allStats.reduce((sum, stat) => sum + stat.totalWeightLoss, 0);
    return totalLoss / allStats.length;
  };

  const getTotalParticipants = () => {
    return allStats.length;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Competition Statistics</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedCompetition?.year || ''}
            onChange={(e) => {
              const year = parseInt(e.target.value);
              const competition = competitions.find(c => c.year === year);
              if (competition) {
                setSelectedCompetition(competition);
              }
            }}
            className="input"
          >
            {competitions.map(comp => (
              <option key={comp.year} value={comp.year}>
                {comp.year} Competition
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Total Participants</h3>
            <p className="text-3xl font-bold text-primary-600">{getTotalParticipants()}</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Average Weight Loss</h3>
            <p className="text-3xl font-bold text-success-600">
              {getAverageWeightLoss().toFixed(1)} lbs
            </p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900">Competition Status</h3>
            <p className={`text-3xl font-bold ${
              selectedCompetition?.status === 'active' ? 'text-success-600' : 
              selectedCompetition?.status === 'archived' ? 'text-gray-600' : 
              'text-warning-600'
            }`}>
              {selectedCompetition?.status ? selectedCompetition.status.charAt(0).toUpperCase() + selectedCompetition.status.slice(1) : 'Unknown'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
        </div>
        <div className="card-body">
          {allStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No data available</p>
          ) : (
            <div className="space-y-4">
              {getTopPerformers().map((stat, index) => (
                <div key={stat.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{stat.name}</p>
                      <p className="text-sm text-gray-600">{stat.totalWeighIns} weigh-ins</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-success-600">
                      -{stat.totalWeightLoss.toFixed(1)} lbs
                    </p>
                    <p className="text-sm text-gray-600">
                      {stat.totalWeightLossPercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* All Participants */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">All Participants</h3>
        </div>
        <div className="card-body">
          {allStats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No participants yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weigh-ins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weight Loss
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allStats.map((stat, index) => (
                    <tr key={stat.userId}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.totalWeighIns}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 font-semibold">
                        -{stat.totalWeightLoss.toFixed(1)} lbs
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stat.totalWeightLossPercentage.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionStats;

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CompetitionService } from '../services/competitionService';
import { ParticipantChartData } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface LeaderboardChartProps {
  year: number;
}

const COLORS = [
  '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#eab308', '#dc2626', '#7c3aed', '#0891b2'
];

const LeaderboardChart: React.FC<LeaderboardChartProps> = ({ year }) => {
  const [data, setData] = useState<ParticipantChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [year]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      // Get all participants
      const participants = await CompetitionService.getParticipants(year);
      
      if (participants.length === 0) {
        setData([]);
        return;
      }

      // Get weigh-ins for all participants
      const participantData: ParticipantChartData[] = [];
      
      for (let i = 0; i < participants.length; i++) {
        const participant = participants[i];
        const weighIns = await CompetitionService.getWeighIns(year, participant.userId);
        
        if (weighIns.length === 0) continue;

        // Calculate percentage weight loss for each week
        const chartData = weighIns.map(weighIn => {
          const weightLoss = participant.startWeight - weighIn.weight;
          const weightLossPercentage = (weightLoss / participant.startWeight) * 100;
          
          return {
            week: weighIn.weekNumber,
            weight: weighIn.weight,
            weightLossPercentage: Math.max(0, weightLossPercentage), // Ensure non-negative
            weightLoss,
          };
        });

        participantData.push({
          userId: participant.userId,
          name: participant.name,
          data: chartData,
          color: COLORS[i % COLORS.length],
        });
      }

      setData(participantData);
    } catch (error) {
      console.error('Error loading leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">Week {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.dataKey}: <span className="font-medium">{entry.value.toFixed(1)}%</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="chart-container flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium">No competition data yet</p>
          <p className="text-sm">Participants need to submit weigh-ins to see the leaderboard!</p>
        </div>
      </div>
    );
  }

  // Transform data for Recharts (group by week)
  const chartData = Array.from({ length: 12 }, (_, weekIndex) => {
    const week = weekIndex + 1;
    const weekData: any = { week };
    
    data.forEach(participant => {
      const weekEntry = participant.data.find(d => d.week === week);
      if (weekEntry) {
        weekData[participant.name] = weekEntry.weightLossPercentage;
      }
    });
    
    return weekData;
  });

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{ value: 'Weight Loss %', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          {data.map((participant, index) => (
            <Line
              key={participant.userId}
              type="monotone"
              dataKey={participant.name}
              stroke={participant.color}
              strokeWidth={2}
              dot={{ fill: participant.color, strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: participant.color, strokeWidth: 2 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeaderboardChart;

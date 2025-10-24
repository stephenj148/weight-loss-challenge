import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CompetitionService } from '../services/competitionService';
import { PersonalProgressData } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PersonalProgressChartProps {
  year: number;
  userId: string;
}

const PersonalProgressChart: React.FC<PersonalProgressChartProps> = ({ year, userId }) => {
  const [data, setData] = useState<PersonalProgressData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [year, userId]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      
      // Get weigh-ins for the user
      const weighIns = await CompetitionService.getWeighIns(year, userId);
      
      if (weighIns.length === 0) {
        setData([]);
        return;
      }

      // Get participant data to get start weight
      const participants = await CompetitionService.getParticipants(year);
      const participant = participants.find(p => p.userId === userId);
      
      if (!participant) {
        setData([]);
        return;
      }

      // Transform data for chart
      const chartData: PersonalProgressData[] = [];
      
      // Add start weight as week 0
      chartData.push({
        week: 0,
        weight: participant.startWeight,
        weightLoss: 0,
        weightLossPercentage: 0,
        weeklyChange: 0,
      });

      // Add weigh-in data
      weighIns.forEach((weighIn, index) => {
        const weightLoss = participant.startWeight - weighIn.weight;
        const weightLossPercentage = (weightLoss / participant.startWeight) * 100;
        const weeklyChange = index === 0 
          ? participant.startWeight - weighIn.weight
          : weighIns[index - 1].weight - weighIn.weight;

        chartData.push({
          week: weighIn.weekNumber,
          weight: weighIn.weight,
          weightLoss,
          weightLossPercentage,
          weeklyChange,
        });
      });

      setData(chartData);
    } catch (error) {
      console.error('Error loading personal progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">Week {label}</p>
          <p className="text-gray-600">
            Weight: <span className="font-medium">{data.weight.toFixed(1)} lbs</span>
          </p>
          <p className="text-gray-600">
            Total Loss: <span className="font-medium text-success-600">{data.weightLoss.toFixed(1)} lbs</span>
          </p>
          <p className="text-gray-600">
            Loss %: <span className="font-medium text-primary-600">{data.weightLossPercentage.toFixed(1)}%</span>
          </p>
          {data.weeklyChange !== 0 && (
            <p className="text-gray-600">
              Weekly Change: <span className={`font-medium ${data.weeklyChange > 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {data.weeklyChange > 0 ? '-' : '+'}{Math.abs(data.weeklyChange).toFixed(1)} lbs
              </span>
            </p>
          )}
        </div>
      );
    }
    return null;
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
          <p className="text-lg font-medium">No weigh-in data yet</p>
          <p className="text-sm">Submit your first weigh-in to see your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="week" 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280"
            tick={{ fontSize: 12 }}
            label={{ value: 'Weight (lbs)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#0ea5e9"
            strokeWidth={3}
            dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#0ea5e9', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PersonalProgressChart;

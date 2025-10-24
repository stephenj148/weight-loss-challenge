import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { TestDataService } from '../../services/testDataService';
import { CompetitionService } from '../../services/competitionService';
import { Competition } from '../../types';

interface TestDataGeneratorProps {
  competitions: Competition[];
}

const TestDataGenerator: React.FC<TestDataGeneratorProps> = ({ competitions }) => {
  const [generating, setGenerating] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleGenerateTestData = async () => {
    if (competitions.length === 0) {
      toast.error('No competitions available');
      return;
    }

    const activeCompetition = competitions.find(comp => 
      CompetitionService.isCompetitionActive(comp)
    ) || competitions[0];

    if (!activeCompetition) {
      toast.error('No active competition found');
      return;
    }

    setGenerating(true);
    try {
      await TestDataService.generateTestDataForAllUsers(activeCompetition.year);
      toast.success('Test data generated successfully! Refresh the page to see the charts.');
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error('Failed to generate test data');
    } finally {
      setGenerating(false);
    }
  };

  const handleClearTestData = async () => {
    if (competitions.length === 0) {
      toast.error('No competitions available');
      return;
    }

    const activeCompetition = competitions.find(comp => 
      CompetitionService.isCompetitionActive(comp)
    ) || competitions[0];

    if (!activeCompetition) {
      toast.error('No active competition found');
      return;
    }

    if (!window.confirm('Are you sure you want to clear all test data? This cannot be undone.')) {
      return;
    }

    setClearing(true);
    try {
      await TestDataService.clearTestData(activeCompetition.year);
      toast.success('Test data cleared successfully!');
    } catch (error) {
      console.error('Error clearing test data:', error);
      toast.error('Failed to clear test data');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">
        🧪 Test Data Generator
      </h3>
      <p className="text-yellow-700 mb-4">
        Generate 12 weeks of realistic test data to see charts and statistics in action.
      </p>
      <div className="flex space-x-4">
        <button
          onClick={handleGenerateTestData}
          disabled={generating}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating...' : 'Generate Test Data'}
        </button>
        <button
          onClick={handleClearTestData}
          disabled={clearing}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearing ? 'Clearing...' : 'Clear Test Data'}
        </button>
      </div>
      <p className="text-sm text-yellow-600 mt-2">
        ⚠️ This will generate realistic weight loss data for all users. Use only for testing!
      </p>
    </div>
  );
};

export default TestDataGenerator;

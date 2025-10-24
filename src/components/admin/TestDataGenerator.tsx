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
  const [generatingUsers, setGeneratingUsers] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearingUsers, setClearingUsers] = useState(false);

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

  const handleGenerateTestUsers = async () => {
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

    setGeneratingUsers(true);
    try {
      await TestDataService.generateTestUsers(activeCompetition.year);
      toast.success('10 test users created with 12 weeks of data! Refresh the page to see the community charts.');
    } catch (error) {
      console.error('Error generating test users:', error);
      toast.error('Failed to generate test users');
    } finally {
      setGeneratingUsers(false);
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

  const handleClearTestUsers = async () => {
    if (!window.confirm('Are you sure you want to delete all test users? This cannot be undone.')) {
      return;
    }

    setClearingUsers(true);
    try {
      await TestDataService.clearTestUsers();
      toast.success('Test users deleted successfully!');
    } catch (error) {
      console.error('Error clearing test users:', error);
      toast.error('Failed to clear test users');
    } finally {
      setClearingUsers(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">
        🧪 Test Data Generator
      </h3>
      <p className="text-yellow-700 mb-4">
        Generate realistic test data to see charts and statistics in action.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <h4 className="font-medium text-yellow-800">Generate Data</h4>
          <div className="space-y-2">
            <button
              onClick={handleGenerateTestUsers}
              disabled={generatingUsers}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingUsers ? 'Creating Users...' : 'Create 10 Test Users'}
            </button>
            <button
              onClick={handleGenerateTestData}
              disabled={generating}
              className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating...' : 'Generate Data for Existing Users'}
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-yellow-800">Clear Data</h4>
          <div className="space-y-2">
            <button
              onClick={handleClearTestUsers}
              disabled={clearingUsers}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearingUsers ? 'Deleting...' : 'Delete Test Users'}
            </button>
            <button
              onClick={handleClearTestData}
              disabled={clearing}
              className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clearing ? 'Clearing...' : 'Clear All Test Data'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-yellow-600 space-y-1">
        <p><strong>Create 10 Test Users:</strong> Creates 10 fake users with realistic names and 12 weeks of weight loss data</p>
        <p><strong>Generate Data for Existing Users:</strong> Adds 12 weeks of data to your current users</p>
        <p><strong>Delete Test Users:</strong> Removes only the fake test users (keeps your real data)</p>
        <p><strong>Clear All Test Data:</strong> Removes all weigh-in data for the current competition</p>
      </div>
    </div>
  );
};

export default TestDataGenerator;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { CompetitionService } from '../services/competitionService';
import { Competition, WeighInFormData, WeighIn } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const WeighInPage: React.FC = () => {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [currentCompetition, setCurrentCompetition] = useState<Competition | null>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [hasSubmittedThisWeek, setHasSubmittedThisWeek] = useState(false);
  const [lastWeighIn, setLastWeighIn] = useState<WeighIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<WeighInFormData>();

  const weightValue = watch('weight');

  useEffect(() => {
    loadWeighInData();
  }, [user]);

  const loadWeighInData = async () => {
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
        const week = CompetitionService.getCurrentWeek(activeCompetition.startDate);
        setCurrentWeek(week);

        // Check if user has already submitted this week
        const hasSubmitted = await CompetitionService.hasWeighInForWeek(
          activeCompetition.year, 
          user.uid, 
          week
        );
        setHasSubmittedThisWeek(hasSubmitted);

        // Get last weigh-in for reference
        const weighIns = await CompetitionService.getWeighIns(activeCompetition.year, user.uid);
        if (weighIns.length > 0) {
          setLastWeighIn(weighIns[weighIns.length - 1]);
        }
      }
    } catch (error) {
      console.error('Error submitting weigh-in:' error);
      console.error('Error loading weigh-in data:', error);
      toast.error('Failed to load weigh-in data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WeighInFormData) => {
    if (!user || !currentCompetition) return;

    setSubmitting(true);
    try {
      await CompetitionService.submitWeighIn(
        currentCompetition.year,
        user.uid,
        currentWeek,
        data.weight,
        data.notes
      );

      toast.success('Weigh-in submitted successfully!');
      setHasSubmittedThisWeek(true);
      reset();
      
      // Reload data to get updated weigh-ins
      await loadWeighInData();
    } catch (error) {
      console.error('Error submitting weigh-in:' error);
      console.error('Error submitting weigh-in:', error);
      toast.error('Failed to submit weigh-in');
    } finally {
      setSubmitting(false);
    }
  };

  const validateWeight = (value: number) => {
    if (!value || value <= 0) {
      return 'Weight must be greater than 0';
    }
    if (value > 1000) {
      return 'Weight seems too high. Please check your entry.';
    }
    if (lastWeighIn) {
      const change = Math.abs(value - lastWeighIn.weight);
      const percentageChange = (change / lastWeighIn.weight) * 100;
      if (percentageChange > 10) {
        return 'Large weight change detected. Please verify your entry.';
      }
    }
    return true;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentCompetition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Active Competition
          </h2>
          <p className="text-gray-600 mb-6">
            There are no active competitions at the moment.
          </p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Submit Weigh-In
              </h1>
              <p className="text-gray-600">
                {currentCompetition.year} Competition - Week {currentWeek} of 12
              </p>
            </div>
            <Link to="/dashboard" className="btn-outline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Status Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">
                Weigh-In Status
              </h2>
            </div>
            <div className="card-body">
              {hasSubmittedThisWeek ? (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                      <span className="text-success-600 text-sm">✓</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-success-800 font-medium">
                      Weigh-in submitted for Week {currentWeek}
                    </p>
                    <p className="text-gray-600 text-sm">
                      You can submit again next week
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center">
                      <span className="text-warning-600 text-sm">!</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-warning-800 font-medium">
                      Weigh-in due for Week {currentWeek}
                    </p>
                    <p className="text-gray-600 text-sm">
                      Submit your weight to stay on track
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Last Weigh-In Reference */}
          {lastWeighIn && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Last Weigh-In Reference
                </h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Week</p>
                    <p className="text-lg font-semibold">Week {lastWeighIn.weekNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Weight</p>
                    <p className="text-lg font-semibold">{lastWeighIn.weight.toFixed(1)} lbs</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="text-lg font-semibold">
                      {lastWeighIn.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Weigh-In Form */}
          {!hasSubmittedThisWeek && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  Submit Your Weight
                </h3>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="form-group">
                    <label htmlFor="weight" className="form-label">
                      Weight (lbs)
                    </label>
                    <input
                      {...register('weight', {
                        required: 'Weight is required',
                        valueAsNumber: true,
                        validate: validateWeight,
                      })}
                      type="number"
                      step="0.1"
                      min="0"
                      max="1000"
                      className={errors.weight ? 'input-error' : 'input'}
                      placeholder="Enter your weight (e.g., 150.5)"
                    />
                    {errors.weight && (
                      <p className="form-error">{errors.weight.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your weight to 1 decimal place (e.g., 150.5)
                    </p>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                      Notes (Optional)
                    </label>
                    <textarea
                      {...register('notes')}
                      rows={3}
                      className="input"
                      placeholder="Any notes about your week, challenges, or achievements..."
                    />
                  </div>

                  {/* Weight Change Warning */}
                  {lastWeighIn && weightValue && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <span className="text-yellow-400">⚠️</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Weight Change Alert
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>
                              Last weigh-in: {lastWeighIn.weight.toFixed(1)} lbs
                            </p>
                            <p>
                              Current entry: {weightValue.toFixed(1)} lbs
                            </p>
                            <p className="font-medium">
                              Change: {weightValue > lastWeighIn.weight ? '+' : ''}
                              {(weightValue - lastWeighIn.weight).toFixed(1)} lbs
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => reset()}
                      className="btn-outline"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary"
                    >
                      {submitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="loading-spinner h-4 w-4"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        'Submit Weigh-In'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WeighInPage;

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { CompetitionService } from '../services/competitionService';
import { Competition, WeighIn, WeighInFormData } from '../types';

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
  } = useForm<WeighInFormData>();

  useEffect(() => {
    const loadCompetitions = async () => {
      try {
        const comps = await CompetitionService.getCompetitions();
        setCompetitions(comps);
        
        if (comps.length > 0) {
          const activeCompetition = comps.find(comp => 
            CompetitionService.isCompetitionActive(comp)
          ) || comps[0];
          setCurrentCompetition(activeCompetition);
          
          if (activeCompetition) {
            const week = CompetitionService.getCurrentWeek(activeCompetition.startDate);
            setCurrentWeek(week);
            
            // Check if user has already submitted for this week
            if (user) {
              const hasSubmitted = await CompetitionService.hasWeighInForWeek(
                activeCompetition.year,
                user.uid,
                week
              );
              setHasSubmittedThisWeek(hasSubmitted);
              
              // Load last weigh-in data
              const weighIns = await CompetitionService.getWeighIns(
                activeCompetition.year,
                user.uid
              );
              if (weighIns.length > 0) {
                const lastWeighInData = weighIns[weighIns.length - 1];
                setLastWeighIn(lastWeighInData as WeighIn);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading competitions:', error);
        toast.error('Failed to load competitions');
      } finally {
        setLoading(false);
      }
    };

    loadCompetitions();
  }, [user]);

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
    } catch (error) {
      console.error('Error submitting weigh-in:', error);
      toast.error('Failed to submit weigh-in');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading weigh-in data...</p>
        </div>
      </div>
    );
  }

  if (!currentCompetition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Active Competition</h1>
          <p className="text-gray-600 mb-6">There are no active competitions to submit weigh-ins for.</p>
          <Link to="/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
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

        {hasSubmittedThisWeek ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-4">
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
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4">
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
            </div>

            {/* Last Weigh-in Info */}
            {lastWeighIn && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Last Weigh-in
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {lastWeighIn.weight.toFixed(1)} lbs
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Week</p>
                    <p className="text-lg font-semibold text-gray-900">
                      Week {lastWeighIn.weekNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {lastWeighIn.timestamp ? new Date(lastWeighIn.timestamp).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Weigh-in Form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Submit Your Weight
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Weight (lbs)</label>
                  <input
                    {...register('weight', {
                      required: 'Weight is required',
                      valueAsNumber: true,
                      min: { value: 50, message: 'Weight must be at least 50 lbs' },
                      max: { value: 1000, message: 'Weight must be less than 1000 lbs' },
                    })}
                    type="number"
                    step="0.1"
                    className={errors.weight ? 'input-error' : 'input'}
                    placeholder="180.5"
                  />
                  {errors.weight && (
                    <p className="form-error">{errors.weight.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    className="input"
                    placeholder="How are you feeling? Any changes in diet or exercise?"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                  >
                    {submitting ? 'Submitting...' : 'Submit Weigh-in'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeighInPage;

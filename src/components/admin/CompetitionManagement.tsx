import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { CompetitionService } from '../../services/competitionService';
import { Competition, CompetitionSettings } from '../../types';

interface CompetitionManagementProps {
  competitions: Competition[];
  onCompetitionUpdate: () => void;
}

const CompetitionManagement: React.FC<CompetitionManagementProps> = ({
  competitions,
  onCompetitionUpdate,
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CompetitionSettings & { year: number }>();

  const onSubmit = async (data: CompetitionSettings & { year: number }) => {
    console.log("NEW VERSION DEPLOYED - Competition creation with auto-generated dates");
    setLoading(true);
    try {
      // Generate weigh-in dates automatically (every 7 days for 12 weeks)
      const weighInDates = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(data.startDate);
        date.setDate(date.getDate() + (i * 7));
        weighInDates.push(date);
      }

      await CompetitionService.createCompetition(
        data.year,
        {
          startDate: data.startDate,
          weighInDates: weighInDates,
          status: data.status,
        },
        'admin' // This would be the current user ID
      );
      
      toast.success('Competition created successfully!');
      setShowCreateForm(false);
      reset();
      onCompetitionUpdate();
    } catch (error) {
      console.error('Error creating competition:', error);
      toast.error('Failed to create competition');
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveCompetition = async (year: number) => {
    if (!window.confirm('Are you sure you want to archive this competition?')) {
      return;
    }

    try {
      await CompetitionService.archiveCompetition(year);
      toast.success('Competition archived successfully!');
      onCompetitionUpdate();
    } catch (error) {
      console.error('Error archiving competition:', error);
      toast.error('Failed to archive competition');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Competition Management</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create New Competition
        </button>
      </div>

      {/* Competitions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {competitions.map((competition) => (
          <div key={competition.year} className="card">
            <div className="card-header">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {competition.year} Competition
                  </h3>
                  <p className={`text-sm ${
                    competition.status === 'active' ? 'text-success-600' :
                    competition.status === 'archived' ? 'text-gray-600' :
                    'text-warning-600'
                  }`}>
                    {competition.status.charAt(0).toUpperCase() + competition.status.slice(1)}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Week {CompetitionService.getCurrentWeek(competition.startDate)}
                </span>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Start Date:</span>{' '}
                  {competition.startDate.toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">End Date:</span>{' '}
                  {competition.endDate.toLocaleDateString()}
                </p>
                <p>
                  <span className="font-medium">Weigh-in Dates:</span>{' '}
                  {competition.weighInDates.length} scheduled
                </p>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setEditingCompetition(competition)}
                  className="btn-outline text-xs"
                >
                  Edit
                </button>
                {competition.status === 'active' && (
                  <button
                    onClick={() => handleArchiveCompetition(competition.year)}
                    className="btn-danger text-xs"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Competition Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Create New Competition
              </h3>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input
                    {...register('year', {
                      required: 'Year is required',
                      valueAsNumber: true,
                      min: { value: 2024, message: 'Year must be 2024 or later' },
                    })}
                    type="number"
                    className={errors.year ? 'input-error' : 'input'}
                    placeholder="2026"
                  />
                  {errors.year && (
                    <p className="form-error">{errors.year.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    {...register('startDate', {
                      required: 'Start date is required',
                      valueAsDate: true,
                    })}
                    type="date"
                    className={errors.startDate ? 'input-error' : 'input'}
                  />
                  {errors.startDate && (
                    <p className="form-error">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    {...register('status', { required: 'Status is required' })}
                    className={errors.status ? 'input-error' : 'input'}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                  {errors.status && (
                    <p className="form-error">{errors.status.message}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      reset();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Creating...' : 'Create Competition'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionManagement;

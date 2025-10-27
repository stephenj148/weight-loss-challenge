import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { CompetitionService } from '../services/competitionService';
import { AuthService } from '../services/authService';
import { Competition, UserStats, User, UserRole } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import CompetitionManagement from '../components/admin/CompetitionManagement';
import UserManagement from '../components/admin/UserManagement';
import CompetitionStats from '../components/admin/CompetitionStats';

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'competitions' | 'users' | 'stats'>('competitions');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      console.log('Loading admin data...');
      
      // Load competitions
      const competitionsData = await CompetitionService.getCompetitions();
      console.log('Loaded competitions:', competitionsData);
      setCompetitions(competitionsData);

      // Load users (this would need to be implemented in AuthService)
      // For now, we'll load participants from active competitions
      const activeCompetition = competitionsData.find(comp => 
        CompetitionService.isCompetitionActive(comp)
      );
      
      console.log('Active competition:', activeCompetition);
      
      if (activeCompetition) {
        const participants = await CompetitionService.getParticipants(activeCompetition.year);
        console.log('Loaded participants:', participants);
        // Convert participants to user-like objects
        const userData = participants.map(p => ({
          uid: p.userId,
          email: '', // Would need to fetch from users collection
          displayName: p.name,
          role: 'regular' as UserRole,
          createdAt: p.joinedAt,
        }));
        console.log('Converted user data:', userData);
        setUsers(userData);
      } else {
        console.log('No active competition found');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'competitions', name: 'Competitions', icon: '🏆' },
    { id: 'users', name: 'Users', icon: '👥' },
    { id: 'stats', name: 'Statistics', icon: '📊' },
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Panel
              </h1>
              <p className="text-gray-600">
                Manage competitions, users, and view statistics
              </p>
            </div>
            <Link to="/dashboard" className="btn-outline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'competitions' && (
            <CompetitionManagement
              competitions={competitions}
              onCompetitionUpdate={loadAdminData}
            />
          )}
          
          {activeTab === 'users' && (
            <UserManagement
              users={users}
              competitions={competitions}
              onUserUpdate={loadAdminData}
            />
          )}
          
          {activeTab === 'stats' && (
            <CompetitionStats
              competitions={competitions}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPage;

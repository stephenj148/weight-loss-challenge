import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Competition, CompetitionStatus, CompetitionSettings, Participant, WeighIn, UserStats } from '../types';

export class CompetitionService {
  // Get all competitions
  static async getCompetitions(): Promise<Competition[]> {
    const competitionsRef = collection(db, 'competitions');
    const q = query(competitionsRef, orderBy('year', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        year: data.year,
        startDate: data.startDate?.toDate() || new Date(),
        endDate: data.endDate?.toDate() || new Date(),
        status: data.status,
        weighInDates: data.weighInDates?.map((date: Timestamp) => date.toDate()) || [],
        createdAt: data.createdAt?.toDate() || new Date(),
        createdBy: data.createdBy,
      };
    });
  }

  // Get competition by year
  static async getCompetition(year: number): Promise<Competition | null> {
    const competitionRef = doc(db, 'competitions', year.toString());
    const snapshot = await getDoc(competitionRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      year: data.year,
      startDate: data.startDate?.toDate() || new Date(),
      endDate: data.endDate?.toDate() || new Date(),
      status: data.status,
      weighInDates: data.weighInDates?.map((date: Timestamp) => date.toDate()) || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      createdBy: data.createdBy,
    };
  }

  // Create new competition
  static async createCompetition(
    year: number,
    settings: CompetitionSettings,
    createdBy: string
  ): Promise<void> {
    const competitionRef = doc(db, 'competitions', year.toString());
    
    await setDoc(competitionRef, {
      year,
      startDate: settings.startDate,
      endDate: new Date(settings.startDate.getTime() + (12 * 7 * 24 * 60 * 60 * 1000)), // 12 weeks
      status: settings.status,
      weighInDates: settings.weighInDates,
      createdAt: serverTimestamp(),
      createdBy,
    });
  }

  // Update competition settings
  static async updateCompetitionSettings(
    year: number,
    settings: Partial<CompetitionSettings>
  ): Promise<void> {
    const competitionRef = doc(db, 'competitions', year.toString());
    
    const updateData: any = {};
    if (settings.startDate) updateData.startDate = settings.startDate;
    if (settings.weighInDates) updateData.weighInDates = settings.weighInDates;
    if (settings.status) updateData.status = settings.status;

    await updateDoc(competitionRef, updateData);
  }

  // Archive competition
  static async archiveCompetition(year: number): Promise<void> {
    await this.updateCompetitionSettings(year, { status: 'archived' });
  }

  // Get participants for a competition
  static async getParticipants(year: number): Promise<Participant[]> {
    const participantsRef = collection(db, 'competitions', year.toString(), 'participants');
    const snapshot = await getDocs(participantsRef);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        userId: doc.id,
        name: data.name,
        startWeight: data.startWeight,
        joinedAt: data.joinedAt?.toDate() || new Date(),
        isActive: data.isActive,
      };
    });
  }

  // Add participant to competition
  static async addParticipant(
    year: number,
    userId: string,
    name: string,
    startWeight: number
  ): Promise<void> {
    const participantRef = doc(db, 'competitions', year.toString(), 'participants', userId);
    
    await setDoc(participantRef, {
      name,
      startWeight,
      joinedAt: serverTimestamp(),
      isActive: true,
    });
  }

  // Update participant
  static async updateParticipant(
    year: number,
    userId: string,
    updates: Partial<Participant>
  ): Promise<void> {
    const participantRef = doc(db, 'competitions', year.toString(), 'participants', userId);
    
    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.startWeight !== undefined) updateData.startWeight = updates.startWeight;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;

    await updateDoc(participantRef, updateData);
  }

  // Get weigh-ins for a participant
  static async getWeighIns(year: number, userId: string): Promise<WeighIn[]> {
    const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
    const q = query(weighInsRef, orderBy('weekNumber', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        weekNumber: data.weekNumber,
        weight: data.weight,
        date: data.date?.toDate() || new Date(),
        timestamp: data.timestamp?.toDate() || new Date(),
        notes: data.notes,
      };
    });
  }

  // Submit weigh-in
  static async submitWeighIn(
    year: number,
    userId: string,
    weekNumber: number,
    weight: number,
    notes?: string
  ): Promise<void> {
    const weighInRef = doc(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins', weekNumber.toString());
    
    await setDoc(weighInRef, {
      weekNumber,
      weight,
      date: new Date(),
      timestamp: serverTimestamp(),
      notes,
    });
  }

  // Get user statistics for a competition
  static async getUserStats(year: number, userId: string): Promise<UserStats | null> {
    const participantRef = doc(db, 'competitions', year.toString(), 'participants', userId);
    const participantSnap = await getDoc(participantRef);

    if (!participantSnap.exists()) {
      return null;
    }

    const participant = participantSnap.data();
    const weighIns = await this.getWeighIns(year, userId);

    if (weighIns.length === 0) {
      return {
        userId,
        name: participant.name,
        startWeight: participant.startWeight,
        currentWeight: participant.startWeight,
        totalWeightLoss: 0,
        totalWeightLossPercentage: 0,
        averageWeeklyLoss: 0,
        weeksParticipated: 0,
      };
    }

    const latestWeighIn = weighIns[weighIns.length - 1];
    const totalWeightLoss = participant.startWeight - latestWeighIn.weight;
    const totalWeightLossPercentage = (totalWeightLoss / participant.startWeight) * 100;
    const averageWeeklyLoss = totalWeightLoss / weighIns.length;

    return {
      userId,
      name: participant.name,
      startWeight: participant.startWeight,
      currentWeight: latestWeighIn.weight,
      totalWeightLoss,
      totalWeightLossPercentage,
      averageWeeklyLoss,
      weeksParticipated: weighIns.length,
      lastWeighIn: latestWeighIn.date,
    };
  }

  // Get all user statistics for a competition (admin only)
  static async getAllUserStats(year: number): Promise<UserStats[]> {
    const participants = await this.getParticipants(year);
    const statsPromises = participants.map(participant => 
      this.getUserStats(year, participant.userId)
    );
    
    const stats = await Promise.all(statsPromises);
    return stats.filter((stat): stat is UserStats => stat !== null);
  }

  // Check if user has submitted weigh-in for a specific week
  static async hasWeighInForWeek(year: number, userId: string, weekNumber: number): Promise<boolean> {
    const weighInRef = doc(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins', weekNumber.toString());
    const snapshot = await getDoc(weighInRef);
    return snapshot.exists();
  }

  // Get current week number based on competition start date
  static getCurrentWeek(startDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(12, diffWeeks + 1));
  }

  // Check if competition is active
  static isCompetitionActive(competition: Competition): boolean {
    const now = new Date();
    return competition.status === 'active' && 
           now >= competition.startDate && 
           now <= competition.endDate;
  }
}

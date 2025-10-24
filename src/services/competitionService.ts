import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Competition, CompetitionSettings } from '../types';

export class CompetitionService {
  static async createCompetition(
    year: number,
    settings: CompetitionSettings,
    createdBy: string
  ): Promise<void> {
    const competitionRef = doc(db, 'competitions', year.toString());
    
    // Generate weigh-in dates if not provided
    const weighInDates = settings.weighInDates || [];
    if (weighInDates.length === 0) {
      for (let i = 0; i < 12; i++) {
        const date = new Date(settings.startDate);
        date.setDate(date.getDate() + (i * 7));
        weighInDates.push(date);
      }
    }
    
    await setDoc(competitionRef, {
      year,
      startDate: settings.startDate,
      endDate: new Date(settings.startDate.getTime() + (12 * 7 * 24 * 60 * 60 * 1000)), // 12 weeks
      status: settings.status,
      weighInDates: weighInDates,
      createdAt: serverTimestamp(),
      createdBy,
    });
  }

  static async getCompetitions(): Promise<Competition[]> {
    const competitionsRef = collection(db, 'competitions');
    const q = query(competitionsRef, orderBy('year', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        year: data.year,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        status: data.status,
        weighInDates: data.weighInDates?.map((date: Timestamp) => date.toDate()) || [],
        createdAt: data.createdAt?.toDate(),
        createdBy: data.createdBy,
      };
    });
  }

  static async getCompetition(year: number): Promise<Competition | null> {
    const competitionRef = doc(db, 'competitions', year.toString());
    const competitionSnap = await getDoc(competitionRef);
    
    if (!competitionSnap.exists()) {
      return null;
    }
    
    const data = competitionSnap.data();
    return {
      year: data.year,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      status: data.status,
      weighInDates: data.weighInDates?.map((date: Timestamp) => date.toDate()) || [],
      createdAt: data.createdAt?.toDate(),
      createdBy: data.createdBy,
    };
  }

  static async updateCompetition(
    year: number,
    settings: Partial<CompetitionSettings>
  ): Promise<void> {
    const competitionRef = doc(db, 'competitions', year.toString());
    const updateData: any = {
      ...settings,
      updatedAt: serverTimestamp(),
    };
    
    if (settings.weighInDates) updateData.weighInDates = settings.weighInDates;
    
    await updateDoc(competitionRef, updateData);
  }

  static async archiveCompetition(year: number): Promise<void> {
    await this.updateCompetition(year, { status: 'archived' });
  }

  static getCurrentWeek(startDate: Date): number {
    const now = new Date();
    const diffTime = now.getTime() - startDate.getTime();
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, Math.min(12, diffWeeks + 1));
  }

  static getNextWeighInDate(startDate: Date): Date {
    const currentWeek = this.getCurrentWeek(startDate);
    const nextWeighInDate = new Date(startDate);
    nextWeighInDate.setDate(nextWeighInDate.getDate() + (currentWeek * 7));
    return nextWeighInDate;
  }

  static isCompetitionActive(competition: Competition): boolean {
    const now = new Date();
    return competition.status === 'active' && 
           competition.startDate <= now && 
           competition.endDate >= now;
  }

  static async getAllUserStats(year: number): Promise<any[]> {
    try {
      const participantsRef = collection(db, 'competitions', year.toString(), 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      
      const userStats = [];
      
      for (const participantDoc of participantsSnapshot.docs) {
        const userId = participantDoc.id;
        const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
        const weighInsSnapshot = await getDocs(weighInsRef);
        
        const weighIns = weighInsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (weighIns.length > 0) {
          const firstWeight = (weighIns[0] as any).weight;
          const lastWeight = (weighIns[weighIns.length - 1] as any).weight;
          const totalLoss = firstWeight - lastWeight;
          const totalLossPercentage = (totalLoss / firstWeight) * 100;
          
          userStats.push({
            userId,
            displayName: participantDoc.data().displayName || 'Unknown User',
            totalWeighIns: weighIns.length,
            firstWeight,
            lastWeight,
            totalWeightLoss: totalLoss,
            totalWeightLossPercentage: totalLossPercentage,
            weeksParticipated: weighIns.length,
            weighIns: weighIns
          });
        }
      }
      
      return userStats.sort((a, b) => b.totalWeightLoss - a.totalWeightLoss);
    } catch (error) {
      console.error('Error getting user stats:', error);
      return [];
    }
  }

  static async getUserStats(year: number, userId: string): Promise<any> {
    try {
      const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
      const weighInsSnapshot = await getDocs(weighInsRef);
      
      const weighIns = weighInsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      if (weighIns.length === 0) {
        return {
          userId,
          totalWeighIns: 0,
          currentWeight: 0,
          totalWeightLoss: 0,
          totalWeightLossPercentage: 0,
          weeksParticipated: 0,
          weighIns: []
        };
      }
      
      const firstWeight = (weighIns[0] as any).weight;
      const lastWeight = (weighIns[weighIns.length - 1] as any).weight;
      const totalLoss = firstWeight - lastWeight;
      const totalLossPercentage = (totalLoss / firstWeight) * 100;
      
      return {
        userId,
        totalWeighIns: weighIns.length,
        currentWeight: lastWeight,
        totalWeightLoss: totalLoss,
        totalWeightLossPercentage: totalLossPercentage,
        weeksParticipated: weighIns.length,
        weighIns: weighIns
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        userId,
        totalWeighIns: 0,
        currentWeight: 0,
        totalWeightLoss: 0,
        totalWeightLossPercentage: 0,
        weeksParticipated: 0,
        weighIns: []
      };
    }
  }

  static async getLeaderboard(year: number): Promise<any[]> {
    const userStats = await this.getAllUserStats(year);
    return userStats.map((stat, index) => ({
      ...stat,
      rank: index + 1
    }));
  }

  static async getParticipants(year: number): Promise<any[]> {
    try {
      const participantsRef = collection(db, 'competitions', year.toString(), 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      
      return participantsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting participants:', error);
      return [];
    }
  }

  static async getWeighIns(year: number, userId: string): Promise<any[]> {
    const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
    const querySnapshot = await getDocs(weighInsRef);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  static async hasWeighInForWeek(year: number, userId: string, weekNumber: number): Promise<boolean> {
    const weighInRef = doc(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins', weekNumber.toString());
    const weighInSnap = await getDoc(weighInRef);
    return weighInSnap.exists();
  }

  static async submitWeighIn(year: number, userId: string, weekNumber: number, weight: number, notes?: string): Promise<void> {
    const weighInRef = doc(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins', weekNumber.toString());
    
    await setDoc(weighInRef, {
      weekNumber,
      weight,
      notes: notes || '',
      timestamp: serverTimestamp(),
    });
  }
}

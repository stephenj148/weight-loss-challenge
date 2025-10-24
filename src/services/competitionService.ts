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
    // This would return user statistics for the competition
    // For now, return empty array to prevent build errors
    return [];
  }

  static async getUserStats(year: number, userId: string): Promise<any> {
    // This would return individual user stats
    // For now, return empty object to prevent build errors
    return {};
  }

  static async getLeaderboard(year: number): Promise<any[]> {
    // This would return leaderboard data
    // For now, return empty array to prevent build errors
    return [];
  }
}

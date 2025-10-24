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
      console.log(`Getting user stats for year: ${year}`);
      const participantsRef = collection(db, 'competitions', year.toString(), 'participants');
      const participantsSnapshot = await getDocs(participantsRef);
      
      console.log(`Found ${participantsSnapshot.docs.length} participants`);
      
      const userStats = [];
      
      for (const participantDoc of participantsSnapshot.docs) {
        const userId = participantDoc.id;
        console.log(`Processing participant: ${userId}`);
        const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
        const weighInsSnapshot = await getDocs(weighInsRef);
        
        console.log(`Found ${weighInsSnapshot.docs.length} weigh-ins for user ${userId}`);
        
        const weighIns = weighInsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        if (weighIns.length > 0) {
          const firstWeight = (weighIns[0] as any).weight;
          const lastWeight = (weighIns[weighIns.length - 1] as any).weight;
          const totalLoss = firstWeight - lastWeight;
          const totalLossPercentage = (totalLoss / firstWeight) * 100;
          
          const userStat = {
            userId,
            displayName: participantDoc.data().displayName || 'Unknown User',
            startWeight: firstWeight,
            currentWeight: lastWeight,
            totalWeightLoss: totalLoss,
            totalWeightLossPercentage: totalLossPercentage,
            averageWeeklyLoss: totalLoss / weighIns.length,
            weeksParticipated: weighIns.length,
            totalWeighIns: weighIns.length,
            lastWeighIn: (weighIns[weighIns.length - 1] as any)?.timestamp?.toDate(),
            weighIns: weighIns
          };
          
          console.log(`Created user stat:`, userStat);
          userStats.push(userStat);
        }
      }
      
      console.log(`Returning ${userStats.length} user stats`);
      return userStats.sort((a, b) => b.totalWeightLoss - a.totalWeightLoss);
    } catch (error) {
      console.error('Error getting user stats:', error);
      return [];
    }
  }

  static async getUserStats(year: number, userId: string): Promise<any> {
    try {
      console.log(`Getting user stats for year: ${year}, userId: ${userId}`);
      const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
      const weighInsSnapshot = await getDocs(weighInsRef);
      
      console.log(`Found ${weighInsSnapshot.docs.length} weigh-ins for user ${userId}`);
      
      const weighIns = weighInsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Weigh-in doc ${doc.id}:`, data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      if (weighIns.length === 0) {
        console.log(`No weigh-ins found for user ${userId}`);
        return {
          userId,
          displayName: 'Unknown User',
          startWeight: 0,
          currentWeight: 0,
          totalWeightLoss: 0,
          totalWeightLossPercentage: 0,
          averageWeeklyLoss: 0,
          weeksParticipated: 0,
          totalWeighIns: 0,
          lastWeighIn: undefined,
          weighIns: []
        };
      }
      
      const firstWeight = (weighIns[0] as any).weight;
      const lastWeight = (weighIns[weighIns.length - 1] as any).weight;
      const totalLoss = firstWeight - lastWeight;
      const totalLossPercentage = (totalLoss / firstWeight) * 100;
      
      const userStats = {
        userId,
        displayName: 'Unknown User', // Will be populated by caller
        startWeight: firstWeight,
        currentWeight: lastWeight,
        totalWeightLoss: totalLoss,
        totalWeightLossPercentage: totalLossPercentage,
        averageWeeklyLoss: totalLoss / weighIns.length,
        weeksParticipated: weighIns.length,
        totalWeighIns: weighIns.length,
        lastWeighIn: (weighIns[weighIns.length - 1] as any)?.timestamp?.toDate(),
        weighIns: weighIns
      };
      
      console.log(`Created user stats for ${userId}:`, userStats);
      return userStats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        userId,
        displayName: 'Unknown User',
        startWeight: 0,
        currentWeight: 0,
        totalWeightLoss: 0,
        totalWeightLossPercentage: 0,
        averageWeeklyLoss: 0,
        weeksParticipated: 0,
        totalWeighIns: 0,
        lastWeighIn: undefined,
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
    console.log(`Submitting weigh-in: year=${year}, userId=${userId}, week=${weekNumber}, weight=${weight}`);
    
    // Create the weigh-in document
    const weighInRef = doc(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins', weekNumber.toString());
    
    const weighInData = {
      weekNumber,
      weight,
      notes: notes || '',
      timestamp: serverTimestamp(),
    };
    
    console.log('Saving weigh-in data:', weighInData);
    await setDoc(weighInRef, weighInData);
    console.log('Weigh-in saved successfully!');
    
    // Also create/update the participant document
    const participantRef = doc(db, 'competitions', year.toString(), 'participants', userId);
    const participantData = {
      userId,
      name: 'Unknown User', // Will be updated with actual user data
      joinedAt: serverTimestamp(),
      lastWeighIn: serverTimestamp(),
      totalWeighIns: 1, // This should be calculated properly
    };
    
    console.log('Creating/updating participant document:', participantData);
    await setDoc(participantRef, participantData, { merge: true });
    console.log('Participant document saved successfully!');
  }
}

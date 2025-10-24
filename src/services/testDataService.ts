import { CompetitionService } from './competitionService';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export class TestDataService {
  static async generateTestData(year: number, userId: string, displayName: string): Promise<void> {
    console.log(`Generating test data for user ${userId} (${displayName}) in year ${year}`);
    
    // Starting weight (simulate realistic weight loss)
    const startWeight = 200 + Math.random() * 50; // 200-250 lbs
    let currentWeight = startWeight;
    
    // Generate 12 weeks of data
    for (let week = 1; week <= 12; week++) {
      // Simulate realistic weight loss (0.5-2 lbs per week)
      const weeklyLoss = 0.5 + Math.random() * 1.5; // 0.5-2 lbs loss
      currentWeight -= weeklyLoss;
      
      // Add some randomness to make it more realistic
      const randomVariation = (Math.random() - 0.5) * 0.5; // ±0.25 lbs
      currentWeight += randomVariation;
      
      // Ensure weight doesn't go below a reasonable minimum
      currentWeight = Math.max(currentWeight, startWeight * 0.8); // Max 20% loss
      
      const weight = Math.round(currentWeight * 10) / 10; // Round to 1 decimal
      
      console.log(`Week ${week}: ${weight} lbs (loss: ${(startWeight - weight).toFixed(1)} lbs)`);
      
      // Submit the weigh-in
      await CompetitionService.submitWeighIn(
        year,
        userId,
        week,
        weight,
        `Test data - Week ${week}`
      );
      
      // Add a small delay to avoid overwhelming Firebase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`Test data generation complete for ${displayName}`);
    console.log(`Starting weight: ${startWeight.toFixed(1)} lbs`);
    console.log(`Final weight: ${currentWeight.toFixed(1)} lbs`);
    console.log(`Total loss: ${(startWeight - currentWeight).toFixed(1)} lbs`);
  }
  
  static async generateTestDataForAllUsers(year: number): Promise<void> {
    console.log(`Generating test data for all users in year ${year}`);
    
    // Get all users from the users collection
    const { collection, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.docs.length} users`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      const displayName = userData.displayName || 'Test User';
      
      console.log(`Generating test data for user: ${displayName} (${userId})`);
      
      try {
        await this.generateTestData(year, userId, displayName);
      } catch (error) {
        console.error(`Error generating test data for user ${userId}:`, error);
      }
      
      // Add delay between users
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Test data generation complete for all users!');
  }
  
  static async clearTestData(year: number): Promise<void> {
    console.log(`Clearing test data for year ${year}`);
    
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Delete all weigh-ins for this user
      const weighInsRef = collection(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins');
      const weighInsSnapshot = await getDocs(weighInsRef);
      
      for (const weighInDoc of weighInsSnapshot.docs) {
        await deleteDoc(doc(db, 'competitions', year.toString(), 'participants', userId, 'weigh-ins', weighInDoc.id));
      }
      
      // Delete participant document
      const participantRef = doc(db, 'competitions', year.toString(), 'participants', userId);
      await deleteDoc(participantRef).catch(() => {
        // Ignore error if document doesn't exist
      });
    }
    
    console.log('Test data cleared!');
  }
}

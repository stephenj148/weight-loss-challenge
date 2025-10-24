import { CompetitionService } from './competitionService';
import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export class TestDataService {
  // List of realistic names for test users
  private static readonly TEST_USERS = [
    { name: 'Alex Johnson', startWeight: 220 },
    { name: 'Sarah Williams', startWeight: 185 },
    { name: 'Mike Chen', startWeight: 245 },
    { name: 'Emma Davis', startWeight: 165 },
    { name: 'David Rodriguez', startWeight: 280 },
    { name: 'Lisa Thompson', startWeight: 195 },
    { name: 'James Wilson', startWeight: 210 },
    { name: 'Maria Garcia', startWeight: 175 },
    { name: 'Chris Brown', startWeight: 230 },
    { name: 'Jennifer Lee', startWeight: 190 }
  ];

  static async generateTestData(year: number, userId: string, displayName: string, startWeight?: number): Promise<void> {
    console.log(`Generating test data for user ${userId} (${displayName}) in year ${year}`);
    
    // Use provided start weight or generate realistic one
    const baseWeight = startWeight || (200 + Math.random() * 50); // 200-250 lbs
    let currentWeight = baseWeight;
    
    // Generate 12 weeks of data
    for (let week = 1; week <= 12; week++) {
      // Simulate realistic weight loss (0.5-2 lbs per week)
      const weeklyLoss = 0.5 + Math.random() * 1.5; // 0.5-2 lbs loss
      currentWeight -= weeklyLoss;
      
      // Add some randomness to make it more realistic
      const randomVariation = (Math.random() - 0.5) * 0.5; // ±0.25 lbs
      currentWeight += randomVariation;
      
      // Ensure weight doesn't go below a reasonable minimum
      currentWeight = Math.max(currentWeight, baseWeight * 0.8); // Max 20% loss
      
      const weight = Math.round(currentWeight * 10) / 10; // Round to 1 decimal
      
      console.log(`Week ${week}: ${weight} lbs (loss: ${(baseWeight - weight).toFixed(1)} lbs)`);
      
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
    console.log(`Starting weight: ${baseWeight.toFixed(1)} lbs`);
    console.log(`Final weight: ${currentWeight.toFixed(1)} lbs`);
    console.log(`Total loss: ${(baseWeight - currentWeight).toFixed(1)} lbs`);
  }
  
  static async generateTestUsers(year: number): Promise<void> {
    console.log(`Generating ${this.TEST_USERS.length} test users with data for year ${year}`);
    
    for (let i = 0; i < this.TEST_USERS.length; i++) {
      const testUser = this.TEST_USERS[i];
      const userId = `test-user-${i + 1}`;
      
      console.log(`Creating test user: ${testUser.name} (${userId})`);
      
      try {
        // Create user document in users collection
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          uid: userId,
          email: `test${i + 1}@example.com`,
          displayName: testUser.name,
          role: 'regular',
          createdAt: serverTimestamp(),
          isTestUser: true, // Mark as test user
        });
        
        // Generate weigh-in data for this user
        await this.generateTestData(year, userId, testUser.name, testUser.startWeight);
        
        console.log(`✅ Created test user: ${testUser.name}`);
        
        // Add delay between users
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Error creating test user ${testUser.name}:`, error);
      }
    }
    
    console.log(`🎉 Test data generation complete! Created ${this.TEST_USERS.length} users with 12 weeks of data each.`);
  }
  
  static async generateTestDataForAllUsers(year: number): Promise<void> {
    console.log(`Generating test data for all existing users in year ${year}`);
    
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
  
  static async clearTestUsers(): Promise<void> {
    console.log('Clearing all test users...');
    
    const { collection, getDocs, deleteDoc } = await import('firebase/firestore');
    
    // Get all users
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Only delete test users
      if (userData.isTestUser) {
        console.log(`Deleting test user: ${userData.displayName}`);
        
        // Delete user document
        await deleteDoc(doc(db, 'users', userId));
        
        // Delete all weigh-ins for this user (for all years)
        const competitionsRef = collection(db, 'competitions');
        const competitionsSnapshot = await getDocs(competitionsRef);
        
        for (const compDoc of competitionsSnapshot.docs) {
          const year = compDoc.id;
          const weighInsRef = collection(db, 'competitions', year, 'participants', userId, 'weigh-ins');
          const weighInsSnapshot = await getDocs(weighInsRef);
          
          for (const weighInDoc of weighInsSnapshot.docs) {
            await deleteDoc(doc(db, 'competitions', year, 'participants', userId, 'weigh-ins', weighInDoc.id));
          }
          
          // Delete participant document
          const participantRef = doc(db, 'competitions', year, 'participants', userId);
          await deleteDoc(participantRef).catch(() => {
            // Ignore error if document doesn't exist
          });
        }
      }
    }
    
    console.log('Test users cleared!');
  }
}

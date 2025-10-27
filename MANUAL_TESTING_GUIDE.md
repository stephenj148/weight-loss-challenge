# 🧪 Manual Testing Guide - Weight Loss Challenge App

## ✅ Complete Testing Checklist

### 1. ✅ **Authentication** (Already Working)
- [x] User can register
- [x] User can login
- [x] User can logout
- [x] Admin can access admin panel

### 2. **Competition Management** (Test This)
1. **Create Competition**:
   - Go to Admin Panel → Competitions tab
   - Click "Create New Competition"
   - Fill in:
     - Year: `2026`
     - Start Date: `Today's date`
     - End Date: `12 weeks from now`
   - Click "Create Competition"
   - ✅ Verify competition appears in list

2. **Edit Competition**:
   - Find 2026 competition
   - Click "Edit"
   - Change status to "active"
   - ✅ Verify status changed

### 3. **Weigh-In Submission** (Test This)
1. **Submit First Weigh-In**:
   - Logout and login as regular user (or stay logged in)
   - Go to "Weigh-In" page
   - Click "Submit Weigh-In"
   - Enter:
     - Week: `1`
     - Weight: `200` (or any realistic number)
     - Notes: `Starting weight`
   - Submit
   - ✅ Verify: "Success" message appears
   - ✅ Verify: Not redirected to blank screen
   - ✅ Verify: Page reloads with new data

2. **Submit Multiple Weigh-Ins**:
   - Submit 3-4 more weigh-ins for weeks 2, 3, 4
   - Use slightly decreasing weights (e.g., 199, 197.5, 195)
   - ✅ Verify: All weigh-ins are saved

### 4. **Dashboard Display** (Test This)
1. **View Dashboard**:
   - Go to "Dashboard" page
   - ✅ Verify: Personal progress chart shows your data
   - ✅ Verify: Leaderboard shows your entry
   - ✅ Verify: Stats show correct weight loss

2. **Verify Data**:
   - Check "Total Weight Loss" number
   - Check "Average Weekly Loss" number
   - ✅ Verify: Numbers match your submissions

### 5. **Admin Panel** (Test This)
1. **View User Management**:
   - Go to Admin Panel → Users tab
   - ✅ Verify: You see yourself in the user list
   - ✅ Verify: Your stats are displayed
   - ✅ Verify: Total weigh-ins count is correct

2. **View Competition Stats**:
   - Go to Admin Panel → Statistics tab
   - Select 2026 competition
   - ✅ Verify: Your data appears in the statistics
   - ✅ Verify: Community charts show your data

### 6. **Data Persistence** (Verify in Firebase)
1. **Check Firebase Firestore**:
   - Go to: https://console.firebase.google.com/project/weight-loss-challenge-ap-6c2fb/firestore/data
   - Navigate to: `competitions` → `2026`
   - ✅ Verify: Competition document exists
   - Navigate to: `competitions` → `2026` → `participants`
   - ✅ Verify: Your user document exists
   - Navigate to: `competitions` → `2026` → `participants` → `{your-user-id}` → `weigh-ins`
   - ✅ Verify: All your weigh-in documents exist

### 7. **Multiple Users** (Test with Second Account)
1. **Create Second User**:
   - Logout
   - Register a new account (e.g., test@example.com)
   - ✅ Verify: New user can register and login

2. **Submit Weigh-Ins for Second User**:
   - Login as second user
   - Submit 2-3 weigh-ins with different weights
   - ✅ Verify: Data is saved

3. **Check Admin Panel**:
   - Login as admin
   - Go to Admin Panel → Users tab
   - ✅ Verify: Both users appear in the list
   - ✅ Verify: Both users' data is correct

## 🗑️ **How to Reset/Clear Test Data**

### Option 1: Use Admin Panel
1. Go to Admin Panel → Test Data Generator
2. Click "Clear All Test Data"
3. ✅ All weigh-ins for current competition are deleted

### Option 2: Delete in Firebase Console
1. Go to Firebase Console → Firestore
2. Navigate to: `competitions` → `2026` → `participants`
3. Delete each participant document
4. Navigate to: `competitions` → `2026`
5. Delete the competition document (optional)

### Option 3: Keep Data for Real Use
- Just change the competition status to "archived"
- Create a new competition for the real challenge

## 🎯 **Expected Results**

After completing the tests, you should have:
- ✅ 1 competition (2026)
- ✅ 2 users (yourself + test user)
- ✅ 3-4 weigh-ins per user (24 total data points)
- ✅ Dashboard showing progress charts
- ✅ Admin panel showing all users and stats
- ✅ Data persisting in Firebase

## 🚨 **If Something Doesn't Work**

Check these common issues:
1. **Authentication errors**: Make sure you're logged in
2. **Permission errors**: Check Firebase security rules (should be permissive for now)
3. **Data not showing**: Check browser console for errors
4. **Blank screen**: Check for JavaScript errors in console

---

**Good luck testing! 🎉**


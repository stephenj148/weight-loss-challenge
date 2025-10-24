# Family & Friends Weight Loss Competition App

A comprehensive 12-week weight loss competition web application built with React, TypeScript, and Firebase. This app allows families and friends to participate in weight loss competitions with privacy-focused features and detailed progress tracking.

## 🚀 Features

### Core Features
- **Authentication & User Management**
  - Firebase Authentication with email/password
  - "Remember me" functionality
  - User roles: Admin and Regular Users
  - Admin can manage users and view all data

- **Competition Management**
  - Support multiple competition years (2024, 2025, 2026, etc.)
  - Create new competition years
  - Archive previous years' data (viewable but read-only)
  - Admin can set/edit weigh-in reminder dates
  - 12-week competition structure

- **Weigh-In System**
  - Weight input format: XXX.XX (supports decimal precision)
  - Weekly weigh-in submissions
  - Users receive reminders on designated weigh-in dates
  - Each user submits their own weight privately
  - Track week number (Week 1-12)
  - Weight change validation and warnings

- **User Dashboard**
  - **Personal Progress Chart**: Line graph showing user's own weight over 12 weeks
  - **Competition Leaderboard Chart**: Line graph showing ALL participants' progress over 12 weeks
  - Display actual weight values (XXX.XX format)
  - Show weight loss/gain totals and percentage
  - Quick stats cards with key metrics

- **Admin Features**
  - View all participants' actual weights and progress
  - See detailed statistics for each user
  - Ability to edit/correct any weigh-in entry
  - Set and modify weigh-in reminder dates
  - Create new competition years
  - Archive/close previous competitions
  - Comprehensive statistics and leaderboards

### Data Privacy
- **Regular users can ONLY see:**
  - Their own actual weights
  - Their own weight loss percentage
  - Other participants' weight loss percentages (NOT actual weights)
  - Participant names on leaderboard

- **Admin can see:**
  - All actual weights for all participants
  - All detailed statistics
  - Full data access for integrity checking

### Key Calculations
- Calculate percentage weight loss: `((startWeight - currentWeight) / startWeight) * 100`
- Track total pounds/kg lost per user
- Show weekly change (gained/lost since last weigh-in)
- Average weekly weight loss

## 🛠️ Technical Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React Router** for navigation
- **React Hook Form** for form management
- **React Hot Toast** for notifications
- **Headless UI** for accessible components
- **Heroicons** for icons

### Backend/Database
- **Firebase Authentication** for user management
- **Firestore** for data storage
- **Firebase Storage** (for future photo uploads)

### Database Structure
```
competitions/
  {year}/
    settings: { startDate, weigh-in-dates, status }
    participants/
      {userId}/
        profile: { name, startWeight }
        weigh-ins/
          {weekNumber}: { weight, date, timestamp }
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd weight-loss-competition
npm install
```

### 2. Firebase Setup
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Copy your Firebase config values

### 3. Environment Configuration
1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. Firestore Security Rules
Set up your Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admins can read all user documents
    match /users/{userId} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Competition data
    match /competitions/{year} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Participants can read their own data
      match /participants/{userId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
        
        // Weigh-ins
        match /weigh-ins/{weekNumber} {
          allow read, write: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
  }
}
```

### 5. Create Initial Admin User
1. Start the development server: `npm start`
2. Register a new account
3. Manually update the user's role to 'admin' in Firestore:
   - Go to Firestore Console
   - Navigate to `users/{userId}`
   - Update the `role` field to `"admin"`

### 6. Run the Application
```bash
npm start
```

The app will be available at `http://localhost:3000`

## 🎯 Usage Guide

### For Regular Users
1. **Register/Login**: Create an account or sign in
2. **Join Competition**: Admin will add you to a competition
3. **Submit Weigh-ins**: Submit your weight each week
4. **View Progress**: Check your personal progress chart
5. **See Leaderboard**: View competition standings (percentages only)

### For Admins
1. **Create Competitions**: Set up new competition years
2. **Manage Users**: Add participants to competitions
3. **View All Data**: See actual weights and detailed statistics
4. **Edit Weigh-ins**: Correct any submission errors
5. **Archive Competitions**: Close completed competitions

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── LoadingSpinner.tsx
│   ├── ProtectedRoute.tsx
│   ├── StatsCard.tsx
│   ├── PersonalProgressChart.tsx
│   └── LeaderboardChart.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── pages/              # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── WeighInPage.tsx
│   └── AdminPage.tsx
├── services/           # API and external services
│   ├── firebase.ts
│   ├── authService.ts
│   └── competitionService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
├── App.tsx
├── App.css
├── index.tsx
└── index.css
```

### Available Scripts
- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Build: `npm run build`
5. Deploy: `firebase deploy`

### Other Platforms
The app can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

## 🔒 Security Considerations

- All data is stored securely in Firestore
- User authentication is handled by Firebase Auth
- Role-based access control implemented
- Input validation on all forms
- Weight change warnings for unusual entries
- Privacy-focused design (users only see their own actual weights)

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for theme customization
- Update colors in `src/App.css`
- Customize component styles in individual files

### Features
- Add email/SMS reminders
- Implement photo uploads
- Add BMI calculations
- Create achievement badges
- Export data to CSV

## 🐛 Troubleshooting

### Common Issues
1. **Firebase connection errors**: Check your environment variables
2. **Permission denied**: Verify Firestore security rules
3. **Authentication issues**: Ensure Firebase Auth is enabled
4. **Build errors**: Check TypeScript types and imports

### Getting Help
- Check the Firebase Console for errors
- Review browser console for client-side issues
- Verify all environment variables are set correctly

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Happy Weight Loss Journey! 🏆**

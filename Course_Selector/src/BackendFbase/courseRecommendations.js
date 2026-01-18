import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from './Firebase.js';

export const CATEGORY = {
  IT: 'COMPUTER / IT / TECHNOLOGY',
  BIZ: 'BUSINESS / FINANCE / MANAGEMENT',
  HEALTH: 'HEALTH / MEDICAL',
  EDU: 'EDUCATION',
  SOCSCI: 'CRIMINOLOGY / SOCIAL SCIENCE',
  ARTS: 'ARTS / DESIGN / MEDIA',
  AGRI: 'AGRICULTURE / ENVIRONMENT',
  HOSP: 'HOSPITALITY / TOURISM',
  SCI: 'PURE & APPLIED SCIENCES',
};

// Static fallback data (keep this as backup)
const recommendations = {
  [CATEGORY.IT]: [
    'BS Computer Science',
    'BS Information Technology',
    'BS Information Systems',
    'BS Computer Engineering',
    'BS Software Engineering',
    'BS Data Science',
    'BS Cybersecurity',
    'BS Multimedia Computing',
    'BS Game Development',
  ],
  [CATEGORY.BIZ]: [
    'BS Accountancy',
    'BS Management Accounting',
    'BS Business Administration (Marketing / Finance / Operations / HR)',
    'BS Entrepreneurship',
    'BS Economics',
    'BS Office Administration',
    'BS Customs Administration',
  ],
  [CATEGORY.HEALTH]: [
    'BS Nursing',
    'BS Medical Technology',
    'BS Radiologic Technology',
    'BS Pharmacy',
    'BS Physical Therapy',
    'BS Occupational Therapy',
    'BS Nutrition and Dietetics',
    'BS Midwifery',
    'BS Public Health',
  ],
  [CATEGORY.EDU]: [
    'BS Elementary Education',
    'BS Secondary Education (English / Math / Science / Filipino / Social Studies)',
    'BS Special Needs Education',
    'BS Physical Education',
  ],
  [CATEGORY.SOCSCI]: [
    'BS Criminology',
    'BS Psychology',
    'BS Political Science',
    'BS Social Work',
    'BS Sociology',
    'BS Public Administration',
    'BS International Studies',
  ],
  [CATEGORY.ARTS]: [
    'BS Architecture',
    'BS Interior Design',
    'BS Industrial Design',
    'BS Fine Arts',
    'BS Multimedia Arts',
    'BS Animation',
    'BS Film',
    'BS Fashion Design',
  ],
  [CATEGORY.AGRI]: [
    'BS Agriculture',
    'BS Agribusiness',
    'BS Agricultural Engineering',
    'BS Fisheries',
    'BS Forestry',
    'BS Environmental Science',
  ],
  [CATEGORY.HOSP]: [
    'BS Hospitality Management',
    'BS Hotel and Restaurant Management',
    'BS Tourism Management',
    'BS Culinary Arts',
  ],
  [CATEGORY.SCI]: [
    'BS Biology',
    'BS Chemistry',
    'BS Physics',
    'BS Mathematics',
    'BS Applied Mathematics',
    'BS Statistics',
  ],
};

// Get recommendations from Programs collection (with fallback to static data)
export async function getRecommendedPrograms(category) {
  try {
    const q = query(
      collection(db, 'Programs'),
      where('category', '==', category)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const programs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Check if programs field exists, otherwise use program name
        if (data.programs) {
          programs.push(...data.programs);
        } else if (data.programName) {
          programs.push(data.programName);
        } else if (data.name) {
          programs.push(data.name);
        }
      });
      return programs;
    } else {
      // Fallback to static data if no data in Firebase
      return recommendations[category] || [];
    }
  } catch (error) {
    console.error('Error fetching from Programs collection:', error);
    // Fallback to static data on error
    return recommendations[category] || [];
  }
}

// Initialize Programs collection with static data (run once to populate database)
export async function initializeRecommendationsInFirebase() {
  try {
    for (const [category, programs] of Object.entries(recommendations)) {
      await setDoc(doc(db, 'Programs', category), {
        category: category,
        programs: programs,
        lastUpdated: new Date()
      });
    }
    console.log('Programs initialized in Firebase');
  } catch (error) {
    console.error('Error initializing Programs data:', error);
  }
}

// Function to get field name from category
function getFieldNameFromCategory(category) {
  const fieldMapping = {
    [CATEGORY.IT]: 'Computer/IT/Technology',
    [CATEGORY.BIZ]: 'Business/Finance/Management',
    [CATEGORY.HEALTH]: 'Health/Medical',
    [CATEGORY.EDU]: 'Education',
    [CATEGORY.SOCSCI]: 'Criminology/Social Science',
    [CATEGORY.ARTS]: 'Arts/Design/Media',
    [CATEGORY.AGRI]: 'Agriculture/Environment',
    [CATEGORY.HOSP]: 'Hospitality/Tourism',
    [CATEGORY.SCI]: 'Pure & Applied Sciences',
  };
  
  return fieldMapping[category] || category;
}

// Save user quiz results to Programs collection
export async function saveQuizResults(userId, answers, recommendedCategory, recommendedPrograms = []) {
  try {
    // Calculate score from answers
    let totalScore = 0;
    Object.values(answers).forEach(score => {
      totalScore += score;
    });

    // Get the simplified field name
    const recommendedField = getFieldNameFromCategory(recommendedCategory);

    await addDoc(collection(db, 'Programs'), {
      userId: userId,
      recommendedPrograms: recommendedPrograms,
      Score: totalScore,
      Recommended_Field: recommendedField, // Now stores the simplified field name
      timestamp: new Date()
    });
    console.log('Quiz results saved to Programs collection');
  } catch (error) {
    console.error('Error saving quiz results to Programs:', error);
  }
}

// Get user's saved programs from Programs collection
export async function getUserSavedPrograms(userId) {
  try {
    const q = query(
      collection(db, 'Programs'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const userPrograms = [];
    
    querySnapshot.forEach((doc) => {
      userPrograms.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return userPrograms;
  } catch (error) {
    console.error('Error fetching user programs:', error);
    return [];
  }
}

// Delete a saved program by document id (verifies ownership before delete)
export async function deleteUserProgram(docId, userId) {
  try {
    const ref = doc(db, 'Programs', docId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    if (data.userId !== userId) throw new Error('Unauthorized delete attempt.');
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting user program:', error);
    throw error;
  }
}
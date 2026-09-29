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
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Information Technology',
    'Bachelor of Science in Computer Engineering',
    'Bachelor of Library and Information Science',
    'Bachelor of Science in Technical Communication',
    'Bachelor of Science in Information Technology Ã¢– Mobile and Web Applications',
  ],
  [CATEGORY.BIZ]: [
    'Bachelor of Science in Accountancy',
    'BSBA Management Ã¢– Business Analytics',
    'Bachelor of Science in Human Capital Development',
    'BSBA Marketing',
    'BSBA Finance',
    'BSBA Business Process Outsourcing',
    'BSBA Entrepreneurship',
    'Bachelor of Science in Accounting Technology',
    'Bachelor of Science in Management',
    'Bachelor of Science in Marketing',
    'Bachelor of Science in Business Administration Ã¢– Marketing Management',
    'Bachelor of Science in Office Administration',
    'Bachelor of Science in Management Accounting',
    'Bachelor of Science in Business Administration Ã¢– Financial Management',
    'Human Resource Management',
  ],
  [CATEGORY.HEALTH]: [
    'Bachelor of Science in Nursing',
    'Bachelor of Science in Medical Technology',
    'Bachelor of Science in Physical Therapy',
  ],
  [CATEGORY.EDU]: [
    'Bachelor of Early Childhood Education',
    'Bachelor of Technology and Livelihood Education Ã¢– Home Economics',
  ],
  [CATEGORY.SOCSCI]: [
    'BA Psychology',
    'Bachelor of Science in Psychology',
    'Bachelor of Science in Criminology',
    'Bachelor of Arts in Communication',
  ],
  [CATEGORY.ARTS]: [
    'Bachelor of Science in Industrial Design',
    'Bachelor of Science in Multimedia Arts and Sciences',
    'BFA Theater Arts',
    'Bachelor of Science in Digital Illustration and Animation',
    'BA Communication',
    'BA Literature',
    'Bachelor of Fine Arts',
  ],
  [CATEGORY.AGRI]: [
    'Bachelor of Science in Environmental Planning and Management',
    'Bachelor of Science in Geological Science and Engineering',
    'Bachelor of Science in Geology',
    'Bachelor of Science in Environmental and Sanitary Engineering',
  ],
  [CATEGORY.HOSP]: [
    'Bachelor of Science in Hotel and Restaurant Management',
    'Bachelor of Science in Hotel Management',
    'Bachelor of Science in Tourism Management',
    'Bachelor of Science in Leisure and Tourism Management',
    'Bachelor in International Hotel Management',
    'Bachelor of Science in Hospitality Management',
    'Bachelor of Science in Tourism Management',
  ],
  [CATEGORY.SCI]: [
    'Bachelor of Science in Chemistry',
    'Bachelor of Science in Biological Engineering',
    'Bachelor of Science in Materials Science and Engineering',
    'Bachelor of Science in Manufacturing Engineering',
    'Bachelor of Science in Management Science and Engineering',
    'Bachelor of Science in Service Engineering and Management',
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Electronics Engineering',
    'Bachelor of Science in Electrical Engineering',
    'Bachelor of Science in Industrial Engineering',
    'Bachelor of Science in Mechanical Engineering',
    'Bachelor of Science in Chemical Engineering',
    'Bachelor of Industrial Technology Ã¢– Automotive Technology',
    'Bachelor of Industrial Technology Ã¢– Drafting Technology',
    'Bachelor of Industrial Technology Ã¢– Electrical Technology',
    'Bachelor of Industrial Technology Ã¢– Electronics Technology',
    'Bachelor of Industrial Technology Ã¢– Food Trades',
    'Bachelor of Science in Computer Engineering',
    'Bachelor of Science in Civil Engineering',
    'Bachelor of Science in Architecture',
    'Bachelor of Physical Education',
  ],
};

const canonicalizeProgram = (programName) => {
  if (typeof programName !== 'string') return null;
  const trimmedName = programName.trim();
  return trimmedName;
};

const getProgramKey = (programName) => programName
  .toLowerCase()
  .replace(/^\s*bachelor\s+of\s+science\s+in\s+/i, 'Bachelor of Science in ')
  .replace(/^\s*bs\s+/i, 'Bachelor of Science in ')
  .replace(/^\s*bachelor\s+of\s+arts\s+in\s+/i, 'ba ')
  .replace(/^\s*bachelor\s+of\s+fine\s+arts\s+in\s+/i, 'bfa ')
  .replace(/[^a-z0-9]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const dedupePrograms = (programs = []) => {
  const uniquePrograms = new Map();
  programs.forEach((programName) => {
    const canonicalName = canonicalizeProgram(programName);
    if (!canonicalName) return;
    const key = getProgramKey(canonicalName);
    if (!uniquePrograms.has(key)) uniquePrograms.set(key, canonicalName);
  });
  return [...uniquePrograms.values()];
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
      return dedupePrograms(programs);
    } else {
      // Fallback to static data if no data in Firebase
      return dedupePrograms(recommendations[category] || []);
    }
  } catch (error) {
    console.error('Error fetching from Programs collection:', error);
    // Fallback to static data on error
    return dedupePrograms(recommendations[category] || []);
  }
}

// Initialize Programs collection with static data (run once to populate database)
export async function initializeRecommendationsInFirebase() {
  try {
    for (const [category, programs] of Object.entries(recommendations)) {
      await setDoc(doc(db, 'Programs', category), {
        category: category,
        programs: dedupePrograms(programs),
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
      recommendedPrograms: dedupePrograms(recommendedPrograms),
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
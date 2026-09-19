import { universities } from '../data/universities';
import {
  getMatchingPrograms,
  normalizeProgram,
} from './programMatching';

export const getSchoolsForProgram = (programName, schoolCatalog = universities) => schoolCatalog
  .map((university) => {
    const matchedProgram = getMatchingPrograms(programName, university.programs)[0];
    if (!matchedProgram) return null;

    return {
      ...university,
      matchedProgram,
      details: university.programDetails?.[matchedProgram],
    };
  })
  .filter(Boolean);

export const getProgramDetails = (programName, schoolCatalog = universities) => schoolCatalog
  .map((university) => university.programDetails?.[programName])
  .find(Boolean) || {
    duration: 'Not publicly specified',
    status: 'Not publicly specified',
  };

export const getCanonicalPrograms = (schoolCatalog = universities) => {
  const uniquePrograms = new Map();

  schoolCatalog.flatMap((university) => university.programs).forEach((programName) => {
    const key = normalizeProgram(programName);
    if (!uniquePrograms.has(key)) uniquePrograms.set(key, programName);
  });

  return [...uniquePrograms.values()];
};

export const getProgramKey = (programName) => normalizeProgram(programName);

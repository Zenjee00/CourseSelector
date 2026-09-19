export const normalizeProgram = (programName) => programName
  .toLowerCase()
  .replace(/^\s*bachelor\s+of\s+(science|arts)\s+in\s+/i, '')
  .replace(/^\s*bachelor\s+of\s+/i, '')
  .replace(/^\s*bachelor\s+in\s+/i, '')
  .replace(/^\s*(bfa|ba|bsba|bs)\s+/i, '')
  .replace(/[^a-z0-9]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const programsMatch = (requestedProgram, listedProgram) => {
  const requested = normalizeProgram(requestedProgram);
  const listed = normalizeProgram(listedProgram);
  if (!requested || !listed) return false;
  return requested === listed || requested.includes(listed) || listed.includes(requested);
};

export const getProgramMatchRank = (requestedProgram, listedProgram) => {
  const requested = normalizeProgram(requestedProgram);
  const listed = normalizeProgram(listedProgram);
  if (requested === listed) return 0;
  if (requested.includes(listed) || listed.includes(requested)) return 1;
  return 2;
};

export const getMatchingPrograms = (requestedProgram, programs = []) => programs
  .filter((listedProgram) => programsMatch(requestedProgram, listedProgram))
  .sort((left, right) => getProgramMatchRank(requestedProgram, left) - getProgramMatchRank(requestedProgram, right));

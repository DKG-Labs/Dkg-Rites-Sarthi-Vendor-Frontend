/** Identity of a sleeper in the basket (batch + sleeper ID) */
export const sleeperRefKey = (s) => `${(s.batchNo || '').trim()}|${(s.sleeperNo || '').trim()}`;

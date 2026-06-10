/**
 * Single source of truth for the locked-in trip.
 * Every component reads from here, so a future date or location change is one edit.
 */

export interface Trip {
  /** Full display name. */
  destination: string;
  /** Short stat-row form (e.g. "CDA"). */
  destinationShort: string;
  /** State abbrev. */
  destinationState: string;
  /** Closest commercial airport — used by Field Intel + Logistics. */
  airportCode: string;
  /** Trip kickoff. Use a real timezone offset so countdowns are honest. */
  start: Date;
  /** Trip end — everyone splits after this. */
  end: Date;
  /** Wedding day — referenced in The Code and the hero context. */
  weddingDate: Date;
  /** Wedding city. */
  weddingLocation: string;
  /** ID from src/data/dates.ts that won the weekend vote. */
  winningDateId: string;
  /** Name from src/data/destinations.ts that won the place vote. */
  winningDestinationName: string;
}

export const TRIP: Trip = {
  destination: 'Coeur d\u2019Alene',
  destinationShort: 'CDA',
  destinationState: 'ID',
  airportCode: 'GEG',
  start: new Date('2026-07-24T14:00:00-07:00'),
  end: new Date('2026-07-26T12:00:00-07:00'),
  weddingDate: new Date('2026-08-28T16:00:00-07:00'),
  weddingLocation: 'San Clemente, CA',
  winningDateId: 'jul-25',
  winningDestinationName: "Coeur d'Alene",
};

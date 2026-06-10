export interface PartyDate {
  /** KV key suffix — must be URL/storage safe. Do not change after launch. */
  id: string;
  /** Display label on the vote button. */
  label: string;
  /** Small one-liner under the date — site voice, slightly snarky. */
  sublabel?: string;
  /**
   * When true, render the "wedding-adjacent" tag if this date is in the lead.
   * Mirrors the Yakima "suspiciously high" easter egg on the place vote.
   */
  weddingAdjacent?: boolean;
}

export const partyDates: PartyDate[] = [
  {
    id: 'jun-27',
    label: 'June 27',
    sublabel: 'summer has barely started',
  },
  {
    id: 'jul-04',
    label: 'July 4',
    sublabel: 'fireworks outrank the groom',
  },
  {
    id: 'jul-18',
    label: 'July 18',
    sublabel: 'the dark-horse weekend',
  },
  {
    id: 'jul-25',
    label: 'July 25',
    sublabel: 'peak summer, no excuses',
  },
  {
    id: 'aug-08',
    label: 'August 8',
    sublabel: 'last gasp before wedding logistics eat everyone',
  },
  {
    id: 'aug-15',
    label: 'August 15',
    sublabel: 't-minus two weeks — risky',
  },
  {
    id: 'aug-25',
    label: 'August 25 & 26',
    sublabel: 'in Cali — already on a plane for the wedding',
    weddingAdjacent: true,
  },
];

/** Ordered list of date ids — used by API + client to validate input. */
export const partyDateIds = partyDates.map((d) => d.id);

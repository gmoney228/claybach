export interface CrewMember {
  /** Display name shown big on the card. Can be a callsign (KingCon, G-Money). */
  name: string;
  /** Short mono pill rendered at the top of the card. */
  status: string;
  /** One-line role under the name. Use middot " · " for sub-clauses. */
  role: string;
  /** Dossier paragraph below role. Keep to ~2 sentences. */
  intel: string;
  /** True only for the groom \u2014 amber border + inverted status pill. */
  subject?: boolean;
}

export const crew: CrewMember[] = [
  {
    name: 'Clay',
    status: 'Subject',
    role: 'Groom \u00b7 the reason any of us are flying',
    intel:
      'Not actually a smoker. Once the drinks come out, though, the room starts chanting his name \u2014 and somehow a cigarette always shows up next to him.',
    subject: true,
  },
  {
    name: 'Ben',
    status: 'Best Man',
    role: 'Operations \u00b7 Busch Light specialist',
    intel:
      'Hydrates exclusively with Busch Light. Single point of failure on logistics \u2014 do not lose Ben, and do not let Ben lose a cooler.',
  },
  {
    name: 'KingCon',
    status: 'Blood',
    role: 'Conner \u00b7 Brother of the Subject',
    intel:
      'Family. No appeals process. Knows the stories that pre-date the rest of the room. Has been instructed not to share. Will share anyway.',
  },
  {
    name: 'Seth',
    status: 'Veteran',
    role: 'College OG \u00b7 new father as of July',
    intel: 'College OG. New father as of July.',
  },
  {
    name: 'James',
    status: 'The Mark',
    role: 'Designated friction',
    intel:
      'The crew\u2019s designated roast target. He has earned it. He will earn it again this weekend. He will also roast back, harder. He stays.',
  },
  {
    name: 'G-Money',
    status: 'Architect',
    role: 'a.k.a. G-Spot \u00b7 Greyson',
    intel:
      'Built this site. Did not pick either of these callsigns. Has accepted both. Will not be taking questions on which is preferred.',
  },
];

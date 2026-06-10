export type ItemConfidence = 'firm' | 'tbd' | 'classified';

export interface ItineraryItem {
  /** Tabular time. Use "LATE", "???", or "TBD" for soft markers. */
  time: string;
  /** Headline label, dossier-style. */
  label: string;
  /** Optional second-line note. */
  note?: string;
  /** Drives the confidence pill color. Defaults to "firm". */
  confidence?: ItemConfidence;
}

export interface ItineraryDay {
  /** Day-of-week banner. */
  weekday: string;
  /** Calendar date in dossier format (e.g. "07.24.2026"). */
  date: string;
  /** Quick framing line that sits under the date. */
  motto?: string;
  items: ItineraryItem[];
}

export const itinerary: ItineraryDay[] = [
  {
    weekday: 'Friday',
    date: '07.24.2026',
    motto: 'Insertion. Eyes open, mouths shut.',
    items: [
      {
        time: 'PM',
        label: 'Arrive Coeur d\u2019Alene',
        note: 'Most crew flies into GEG, drives in. Lodging check-in.',
        confidence: 'firm',
      },
      {
        time: 'Evening',
        label: 'Group dinner',
        note: 'Venue TBD. Light pour. Save the powder.',
        confidence: 'tbd',
      },
      {
        time: 'Night',
        label: 'Lakefront recon',
        note: 'Optional. Stretch the legs, scout downtown.',
        confidence: 'firm',
      },
    ],
  },
  {
    weekday: 'Saturday',
    date: '07.25.2026',
    motto: 'The main event.',
    items: [
      {
        time: 'AM',
        label: 'Brunch',
        note: 'Eat. Hydrate. You will need both.',
        confidence: 'firm',
      },
      {
        time: 'Midday',
        label: 'Wakeboat \u2014 Lake Coeur d\u2019Alene',
        note: 'We rented it. We drive it. Wake-surf rotation, captain rotation, phones in the dry bag.',
        confidence: 'firm',
      },
      {
        time: 'PM',
        label: 'Off the water',
        note: 'Recovery window. Shower. Nap if you\u2019re smart.',
        confidence: 'firm',
      },
      {
        time: 'Evening',
        label: 'Dinner downtown',
        note: 'Solid floor before the night gets weird.',
        confidence: 'tbd',
      },
      {
        time: 'Night',
        label: 'Nashville North',
        note: 'Collared shirts on. Boots if you brought them.',
        confidence: 'firm',
      },
      {
        time: 'Late',
        label: 'Downtown CDA bars',
        note: 'Move as a unit. Account for the groom every 30 min.',
        confidence: 'firm',
      },
      {
        time: '???',
        label: 'Operating discretion of the crew',
        note: 'Off-book. No group photos.',
        confidence: 'classified',
      },
    ],
  },
  {
    weekday: 'Sunday',
    date: '07.26.2026',
    motto: 'Extraction.',
    items: [
      {
        time: 'AM',
        label: 'Recovery breakfast',
        note: 'Hangover food. Long table. Trade stories you\u2019ll deny later.',
        confidence: 'firm',
      },
      {
        time: 'PM',
        label: 'Hard split',
        note: 'Drives + flights home. Clay must be returned intact.',
        confidence: 'firm',
      },
    ],
  },
];

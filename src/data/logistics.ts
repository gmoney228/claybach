export interface LogisticsCard {
  /** Short label rendered above the value (e.g. "LODGING"). */
  label: string;
  /** Display value. Use "TBD" while undecided. */
  value: string;
  /** Optional secondary line shown below value (address, notes). */
  meta?: string;
  /** Optional click target (booking link, playlist, Venmo, group chat invite). */
  href?: string;
  /** When true, render the "TBD" pill regardless of value. */
  pending?: boolean;
}

export const logistics: LogisticsCard[] = [
  {
    label: 'Lodging',
    value: 'TBD',
    meta: 'House on the lake side. 6\u20138 beds. Booking by mid-June.',
    pending: true,
  },
  {
    label: 'Wakeboat',
    value: 'Rented \u00b7 we drive',
    meta: 'Saturday on Lake CDA. Crew rotates as captain. Boat company + slot TBD. Deposit split on Venmo.',
    pending: true,
  },
  {
    label: 'Group chat',
    value: 'Open invite',
    meta: 'Hit Ben for the link. Mute it at your own risk.',
    pending: true,
  },
  {
    label: 'Playlist',
    value: 'Open contributions',
    meta: 'Add tracks. Every man brings two. No skips on the boat.',
    pending: true,
  },
  {
    label: 'Venmo pool',
    value: 'TBD',
    meta: 'Single point of settlement after the weekend. No IOUs.',
    pending: true,
  },
  {
    label: 'Dress code',
    value: 'Lake \u00b7 collared \u00b7 closed',
    meta: 'Day: swim + sun. Nashville North: collar required. Late: anything that\u2019s yours.',
  },
];

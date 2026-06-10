export interface Article {
  /** Roman numeral display (I, II, III…) — keep ordered. */
  numeral: string;
  /** Short headline. */
  title: string;
  /** One or two sentences. Direct voice. */
  body: string;
}

export const code: Article[] = [
  {
    numeral: 'I',
    title: 'Attendance',
    body:
      'You said you would be there. Be there. Flake on the trip and you will be eulogized at the wedding by name.',
  },
  {
    numeral: 'II',
    title: 'Phones on the lake',
    body:
      'Dry bag, sealed, at the back of the boat. The lake is a no-screen zone. The man at the wheel is not your photographer.',
  },
  {
    numeral: 'III',
    title: 'The Groom drinks free',
    body:
      'Clay does not pay for a drink between 14:00 Friday and 10:00 Sunday. Whoever is closest grabs the round. We settle up later.',
  },
  {
    numeral: 'IV',
    title: 'The Lake',
    body:
      'What happens on the water stays on the water. What happens on land is evidence. The man at the helm stays sober \u2014 backseat-drivers swim back.',
  },
  {
    numeral: 'V',
    title: 'Nashville North',
    body:
      'Collared shirt or you are not getting past the door. Boots optional. Confidence non-negotiable.',
  },
  {
    numeral: 'VI',
    title: 'The Late Night',
    body:
      'After midnight, no group photos. What is not photographed did not happen. The crew moves together; nobody peels off solo.',
  },
  {
    numeral: 'VII',
    title: 'The Wedding',
    body:
      'Clay is returned to San Clemente by August 28 in fully operable condition. No casts, no stitches that show. This is the only article that does not bend.',
  },
];

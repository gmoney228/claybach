/**
 * 24 prediction tiles + 1 FREE center = 25 cells, indexed 0..24.
 * Order matters: cell 12 is the center and is rendered as FREE.
 */
export const bingoTiles: string[] = [
  // Row 1
  'Clay falls in the lake',
  'A phone goes in the water',
  'Group photo before noon',
  'Yakima gets mentioned unironically',
  'Clay bums a cigarette off a stranger',

  // Row 2
  'Wake-surf wipeout caught on film',
  'Clay refuses a sash',
  'James gets roasted before the boat launches',
  'Crew loses one to bed before midnight',
  'Nashville North dress-code denial',

  // Row 3 (center is FREE)
  'Two-step attempted, executed poorly',
  'Audio note that must be deleted',
  'FREE \u2014 the wedding still happens',
  'Mystery Sunday-morning bruise',
  'Chain restaurant proposed unironically',

  // Row 4
  'Tab passed without protest',
  'Clay quotes his fianc\u00e9e verbatim',
  'Someone goes barefoot in a venue',
  'Cash-only bar surprise',
  'Ben opens a Busch Light before 11 a.m.',

  // Row 5
  'Group chat 50+ unread by Sunday',
  'Uber driver hears the full life story',
  'Late-night swim, fully clothed',
  'Recovery breakfast: water only',
  'Hard split delayed by an hour+',
];

export const BINGO_FREE_INDEX = 12;

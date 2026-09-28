// Arrow-word puzzles. Row 0 holds the down clues, column 0 the across clues;
// the answer grid is a word square so every row and column is a real word.
export type ArrowPuzzle = {
  answers: string[]; // rows of the answer grid
  across: string[]; // clue per row
  down: string[]; // clue per column
  given: [number, number][]; // pre-filled cells
};

export const PUZZLES: ArrowPuzzle[] = [
  {
    answers: ['CARD', 'AREA', 'REAR', 'DART'],
    across: ['ACE OF SPADES', 'ZONE', 'BACK END', 'PUB MISSILE'],
    down: ['GREETING ___', 'REGION', 'BEHIND', 'BULLSEYE THROW'],
    given: [[0, 0], [2, 2]],
  },
  {
    answers: ['BATS', 'AREA', 'TEAR', 'SARI'],
    across: ['CAVE FLIERS', 'SQUARE FEET', 'RIP', 'INDIAN DRAPE'],
    down: ['CRICKET GEAR', 'FIELD', 'CRY DROP', 'SILK GARMENT'],
    given: [[0, 3], [3, 0]],
  },
  {
    answers: ['HEART', 'EMBER', 'ABUSE', 'RESIN', 'TREND'],
    across: ['♥', 'GLOWING COAL', 'MISUSE', 'PINE SAP', 'FASHION WAVE'],
    down: ['LOVE ORGAN', 'HOT ASH', 'MISTREAT', 'AMBER SOURCE', 'GOING VIRAL'],
    given: [[0, 0], [2, 2], [4, 4]],
  },
  {
    answers: ['SCAR', 'CAVE', 'AVID', 'REDS'],
    across: ['OLD WOUND', 'GROTTO', 'KEEN', 'CHERRIES, E.G.'],
    down: ['SKIN MARK', 'BAT HOME', 'EAGER', 'COMMUNISTS'],
    given: [[1, 1], [3, 3]],
  },
];

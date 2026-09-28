// Arrow-word puzzles. Row 0 holds the down clues, column 0 the across clues;
// the answer grid is a word square so every row and column is a real word.
export type ArrowPuzzle = {
  answers: string[]; // rows of the answer grid
  across: string[]; // clue per row
  down: string[]; // clue per column
  given: [number, number][]; // pre-filled cells
  /** Picture clues shown instead of text, keyed 'a<row>' / 'd<col>'. The text clue stays as the accessible label. */
  pics?: Record<string, string>;
};

export const PUZZLES: ArrowPuzzle[] = [
  {
    answers: ['CARD', 'AREA', 'REAR', 'DART'],
    across: ['ACE OF SPADES', 'ZONE', 'BACK END', 'PUB MISSILE'],
    down: ['GREETING ___', 'REGION', 'BEHIND', 'BULLSEYE THROW'],
    given: [[0, 0], [2, 2]],
    pics: { a0: '🃏', d3: '🎯' },
  },
  {
    answers: ['BATS', 'AREA', 'TEAR', 'SARI'],
    across: ['CAVE FLIERS', 'SQUARE FEET', 'RIP', 'INDIAN DRAPE'],
    down: ['CRICKET GEAR', 'FIELD', 'CRY DROP', 'SILK GARMENT'],
    given: [[0, 3], [3, 0]],
    pics: { a0: '🦇', d2: '💧' },
  },
  {
    answers: ['HEART', 'EMBER', 'ABUSE', 'RESIN', 'TREND'],
    across: ['♥', 'GLOWING COAL', 'MISUSE', 'PINE SAP', 'FASHION WAVE'],
    down: ['LOVE ORGAN', 'HOT ASH', 'MISTREAT', 'AMBER SOURCE', 'GOING VIRAL'],
    given: [[0, 0], [2, 2], [4, 4]],
    pics: { a0: '❤️', d4: '📈' },
  },
  {
    answers: ['SCAR', 'CAVE', 'AVID', 'REDS'],
    across: ['OLD WOUND', 'GROTTO', 'KEEN', 'CHERRIES, E.G.'],
    down: ['SKIN MARK', 'BAT HOME', 'EAGER', 'COMMUNISTS'],
    given: [[1, 1], [3, 3]],
    pics: { d1: '🦇' },
  },
  // --- 4×4 ---
  {
    answers: ['SHIP', 'HIDE', 'IDEA', 'PEAK'],
    across: ['OCEAN LINER', 'ANIMAL SKIN', 'BRIGHT THOUGHT', 'SUMMIT'],
    down: ['SEND BY POST', '___ AND SEEK', 'NOTION', 'TOP OF A MOUNTAIN'],
    given: [[0, 0], [3, 3]],
    pics: { a0: '🚢', a2: '💡', d3: '🏔️' },
  },
  {
    answers: ['CASH', 'AREA', 'SEEN', 'HAND'],
    across: ['BANKNOTES', 'LENGTH × WIDTH', 'SPOTTED', 'FIVE FINGERS'],
    down: ['PAY IN ___', 'DISTRICT', 'WITNESSED', 'GIVE A ___ (HELP)'],
    given: [[1, 1], [3, 0]],
    pics: { a0: '💵', d3: '✋' },
  },
  {
    answers: ['DARE', 'ACID', 'RING', 'EDGE'],
    across: ['TRUTH OR ___', 'LEMON JUICE, E.G.', 'WEDDING BAND', 'BRINK'],
    down: ['CHALLENGE', 'SOUR STUFF', 'BOXING AREA', 'KNIFE SIDE'],
    given: [[0, 0], [2, 2]],
    pics: { a2: '💍', d1: '🧪' },
  },
  {
    answers: ['DRAW', 'RARE', 'AREA', 'WEAR'],
    across: ['SKETCH', 'UNCOMMON', 'SQUARE METRES', 'PUT ON'],
    down: ['TIED GAME', 'UNDERCOOKED', 'REGION', '___ AND TEAR'],
    given: [[0, 3], [2, 0]],
    pics: { a0: '✏️', d1: '🥩' },
  },
  {
    answers: ['RISK', 'IRON', 'SOME', 'KNEW'],
    across: ['GAMBLE', 'PRESS CLOTHES', 'A FEW', 'WAS AWARE'],
    down: ['DANGER', 'METAL, FE', 'NOT ALL', 'UNDERSTOOD'],
    given: [[1, 1], [3, 3]],
    pics: { d0: '🎲' },
  },
  {
    answers: ['WIDE', 'IDEA', 'DEER', 'EARN'],
    across: ['BROAD', 'LIGHTBULB MOMENT', 'BAMBI, E.G.', 'MAKE MONEY'],
    down: ['NOT NARROW', 'PLAN', 'ANTLERED ANIMAL', 'DESERVE'],
    given: [[0, 0], [2, 2]],
    pics: { a2: '🦌', d3: '💰' },
  },
  {
    answers: ['KICK', 'IRON', 'CODE', 'KNEE'],
    across: ['PENALTY ___', 'GOLF CLUB', 'SECRET CIPHER', 'LEG JOINT'],
    down: ['PUNT', 'PRESS SHIRTS', 'PROGRAM TEXT', 'KNEEL ON IT'],
    given: [[0, 3], [3, 0]],
    pics: { a0: '⚽', a3: '🦵', d2: '💻' },
  },
  {
    answers: ['DISH', 'INTO', 'STAR', 'HORN'],
    across: ['PLATE', 'INSIDE OF', 'TWINKLER', 'CAR HONKER'],
    down: ['MEAL', 'ENTERING', 'FILM LEAD', 'RHINO FEATURE'],
    given: [[1, 1], [2, 2]],
    pics: { a0: '🍽️', a2: '⭐', d3: '📯' },
  },
  {
    answers: ['CAST', 'AREA', 'SEAL', 'TALK'],
    across: ['ACTORS', 'ZONE', 'ENVELOPE CLOSER', 'CHAT'],
    down: ['THROW A LINE', 'SPACE', 'FLIPPERED MAMMAL', 'SPEAK'],
    given: [[0, 0], [3, 3]],
    pics: { a2: '🦭', d3: '💬' },
  },
  // --- 5×5 ---
  {
    answers: ['FEAST', 'EARTH', 'ARMOR', 'STONE', 'THREE'],
    across: ['BANQUET', 'OUR PLANET', 'KNIGHT PLATE', 'PEBBLE', '1 + 2'],
    down: ['BIG MEAL', 'SOIL', 'TANK PLATING', 'ROCK', 'TRIO NUMBER'],
    given: [[0, 0], [2, 2], [4, 4]],
    pics: { a1: '🌍', d2: '🛡️', a4: '3️⃣' },
  },
  {
    answers: ['SALAD', 'AWARE', 'LABEL', 'ARENA', 'DELAY'],
    across: ['GREEN STARTER', 'CONSCIOUS', 'PRICE TAG', 'STADIUM', 'HOLD UP'],
    down: ['CAESAR ___', 'IN THE KNOW', 'RECORD COMPANY', 'CONCERT VENUE', 'POSTPONE'],
    given: [[0, 4], [2, 2], [4, 0]],
    pics: { a0: '🥗', d2: '🏷️' },
  },
  {
    answers: ['PASTA', 'ARMOR', 'SMOKE', 'TOKEN', 'ARENA'],
    across: ['PENNE, E.G.', 'SHIELDING', 'CHIMNEY OUTPUT', 'ARCADE COIN', 'SPORTS HALL'],
    down: ['SPAGHETTI', 'SUIT OF METAL', 'SIGN OF FIRE', 'KEEPSAKE', 'BATTLE GROUND'],
    given: [[0, 0], [2, 2], [4, 4]],
    pics: { a0: '🍝', d2: '💨', a3: '🪙' },
  },
  {
    answers: ['BLAST', 'LUNCH', 'ANGER', 'SCENE', 'THREE'],
    across: ['EXPLOSION', 'MIDDAY MEAL', 'RAGE', 'MOVIE PART', 'HAT TRICK'],
    down: ['ROCKET OFF', 'SANDWICH TIME', 'FURY', 'SETTING', 'THIRD NUMBER'],
    given: [[1, 1], [3, 3], [4, 0]],
    pics: { a0: '💥', a1: '🥪', d2: '😠' },
  },
  {
    answers: ['SOLVE', 'ONION', 'LIMIT', 'VOICE', 'ENTER'],
    across: ['CRACK A PUZZLE', 'TEARY VEGGIE', 'SPEED ___', 'SINGING SOUND', 'KEY ON A KEYBOARD'],
    down: ['FIGURE OUT', 'LAYERED BULB', 'MAXIMUM', 'SAY OUT LOUD', 'COME IN'],
    given: [[0, 0], [2, 2], [4, 4]],
    pics: { a1: '🧅', d3: '🎤' },
  },
];

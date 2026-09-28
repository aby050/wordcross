import { WORDS } from './words';

export const N = 11;
export const CENTER = 5;

export type Premium = '' | '2L' | '3L' | '2W' | '3W' | '★';
export type Cell = string | null;
export type Board = Cell[][];
export type Placement = { r: number; c: number; letter: string };

const DICT = new Set(WORDS.split(' '));
export const isWord = (w: string) => DICT.has(w);

// Common words the bot plays from — a small list keeps its search fast.
const BOT_WORDS = `at an as am be by do go he if in is it me my no of on or so to up us we
ace act add age ago aid aim air all and ant any ape arc are arm art ask ate bad bag ban bar bat bay bed bee bet big bin bit
box boy bud bug bun bus but buy cab can cap car cat cow cry cub cup cut dad day den dew did die dig dim dip dog dot dry due
ear eat egg ego elf elk end era eve eye fan far fat fed fee few fig fin fit fix fly foe fog for fox fry fun fur gap gas gel
gem get gin god got gum gun gut guy hat hay hen her hid him hip his hit hog hot how hub hue hug hum hut ice icy ill ink inn
ion jab jam jar jaw jet job jog joy jug keg key kid kin kit lab lad lap law lay led leg let lid lie lip lit log lot low mad
man map mat men met mix mob mom mop mud mug nap net new nod not now nut oak oar oat odd oil old one orb ore our out owl own
pad pal pan paw pay pea peg pen pet pie pig pin pit pod pop pot pro pub pun pup put rag ram ran rap rat raw ray red rib rid
rim rip rob rod rot row rub rug run rye sad sag sat saw say sea see set sew she shy sin sip sir sit six ski sky sly sob son
sow soy spa spy sun tab tag tan tap tar tax tea ten the tie tin tip toe ton too top tow toy try tub tug two use van vat vet
via war was wax way web wed wet who why wig win wit won woo wow yak yam yes yet you zap zip zoo
able acid aged also area army away baby back bake ball band bank base bath bear beat been beer bell belt best bike bird
blow blue boat body bold bone book boom boot born boss both bowl burn busy cafe cake call calm came camp card care cart case
cash cast cell chat chef chip city clay club coal coat code coin cold come cook cool copy core corn cost crew crop cure cute
dare dark data date dawn days dead deal dear deep deer desk diet dirt dish dive dock does done door dose down draw drop drum
duck dust duty each earn ease east easy edge else even ever exam exit face fact fade fail fair fall fame farm fast fate fear
feed feel feet fell felt file fill film find fine fire firm fish five flag flat flew flip flow folk food foot form fort four
free frog from fuel full fund gain game gate gave gear gift girl give glad glow goal goat gold golf gone good grab gray grew
grid grow hair half hall hand hard harm hate have head heal hear heat held help hero hide high hike hill hint hire hold hole
home hope horn host hour huge hunt idea inch into iron item jazz join joke jump just keen keep kept kick kind king kiss kite
knee knew know lace lack lady lake lamp land lane last late lazy lead leaf lean left lend less life lift like lime line link
lion list live load loan lock logo long look loop lord lose loss lost loud love luck made mail main make male many mark mask
mass mate math meal mean meat meet melt menu mild milk mind mine mint miss mode mood moon more most move much must name navy
near neat neck need nest news next nice nine none nose note oath odds once only open oven over pace pack page paid pain pair
palm park part pass past path peak pear pick pile pine pink pipe plan play plot plug plus poem poet pole pool poor pork port
pose post pour pray pull pure push quiz race rack rain rank rare rate read real rear rely rent rest rice rich ride ring rise
risk road rock role roll roof room root rope rose ruby rule rush safe sage said sail salt same sand save seal seat seed seek
seem seen self sell send ship shoe shop shot show shut sick side sign silk sing sink site size skin slip slow snap snow soap
sock soft soil sold sole some song soon sort soul soup spin spot star stay step stir stop such suit sure swim tail take tale
talk tall tank tape task team tear tell tend tent term test text than that them then they thin this tide tidy tile time tiny
tire told toll tone took tool tour town trap tree trip true tube tune turn twin type unit upon used user vast verb very view
vote wage wait wake walk wall want warm wash wave weak wear week well went were west what when whom wide wife wild will wind
wine wing wire wise wish with wolf wood word wore work yard yarn year yoga zero zone
about above actor adopt after again agent agree ahead alarm album alert alike alive allow alone along alter angel anger
angle angry apple apply arena argue arise armor aside audio avoid award aware badge baker basic beach beard beast begin being
bench berry birth black blade blame blank blast blend bless blind block blood bloom board boast bonus boost bound brain brand
brave bread break brick bride brief bring broad brown brush build bunch burst cabin cable camel candy cargo carry catch cause
chain chair chalk charm chart chase cheap check cheek chess chest chief child chili civic claim class clean clear climb clock
close cloud coach coast color coral count court cover craft crane crash cream crime crisp crowd crown crush curve cycle daily
dance dealt delay depth dozen draft drama dream dress drink drive eager eagle early earth eight elbow elder enemy enjoy enter
equal error event exact extra faith false fancy feast fence fever field fifth fifty fight final flame flash fleet float flock
flood floor flour fluid focus force forge forth forum found frame fresh front frost fruit giant glass globe glory grace grade
grain grand grant grape grass great green greet grind group guard guess guest guide habit happy heart heavy hedge honey honor
horse hotel house human humor ideal image index inner input irony ivory jelly jewel joint judge juice knife known label large
laser later laugh layer learn lemon level light limit linen liver lodge logic loose lover lower loyal lucky lunar lunch magic
major maker maple march match mayor medal media melon mercy metal minor model money month moral motor mount mouse mouth movie
music nerve never night noble noise north novel nurse ocean offer often olive onion opera orbit order other outer owner paint
panel paper party pasta peace pearl pedal penny phase phone photo piano piece pilot pitch pizza place plain plane plant plate
point polar pound power press price pride prime print prize proof proud queen quick quiet quote radar radio raise range rapid
ratio reach ready realm relax reply rider ridge right rival river roast robot rocky round route royal rural salad sauce scale
scene scent score scout sense serve seven shade shake shape share shark sharp sheep shelf shell shift shine shirt shock shore
short shout sight skill slice slide smart smile smoke snake solar solid solve sound south space spare spark speak speed spell
spend spice spine spoon sport staff stage stair stamp stand start state steam steel stick still stock stone store storm story
stove style sugar sunny super sweet swift sword table taste teach thank theme thick thing think three throw thumb tiger title
toast token total touch tower toxic trace track trade trail train treat trend trial tribe trick truck truly trust truth twist
uncle under union unity upper urban usual value vapor video visit vital voice waste watch water whale wheat wheel white whole
world worry worth write wrong young youth zebra`.toUpperCase().split(/\s+/).filter((w) => w && DICT.has(w));

export const VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
  N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};
const COUNTS: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9, J: 1, K: 1, L: 4, M: 2,
  N: 6, O: 8, P: 2, Q: 1, R: 6, S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
};

export const PREMIUM: Premium[][] = (() => {
  const p: Premium[][] = Array.from({ length: N }, () => Array<Premium>(N).fill(''));
  const set = (r: number, c: number, v: Premium) => {
    for (const [a, b] of [[r, c], [c, r]])
      for (const [x, y] of [[a, b], [a, N - 1 - b], [N - 1 - a, b], [N - 1 - a, N - 1 - b]]) p[x][y] = v;
  };
  set(0, 0, '3W');
  set(0, 3, '2L'); set(1, 1, '2W'); set(2, 2, '2W'); set(1, 4, '3L');
  set(3, 3, '2L'); set(4, 4, '3L'); set(2, 5, '2L'); set(0, 5, '3L');
  p[CENTER][CENTER] = '★';
  return p;
})();

export const emptyBoard = (): Board => Array.from({ length: N }, () => Array<Cell>(N).fill(null));

export function newBag(): string[] {
  const bag: string[] = [];
  for (const [l, n] of Object.entries(COUNTS)) for (let i = 0; i < n; i++) bag.push(l);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

export type MoveResult =
  | { ok: true; score: number; words: string[] }
  | { ok: false; error: string };

const inside = (r: number, c: number) => r >= 0 && c >= 0 && r < N && c < N;

export function validateMove(board: Board, placed: Placement[]): MoveResult {
  if (!placed.length) return { ok: false, error: 'Place some tiles first' };
  const rows = new Set(placed.map((p) => p.r));
  const cols = new Set(placed.map((p) => p.c));
  if (rows.size > 1 && cols.size > 1) return { ok: false, error: 'Tiles must be in one line' };

  const grid = board.map((row) => row.slice());
  const fresh = new Set<string>();
  for (const p of placed) {
    if (grid[p.r][p.c]) return { ok: false, error: 'Square taken' };
    grid[p.r][p.c] = p.letter;
    fresh.add(`${p.r},${p.c}`);
  }

  const across = rows.size === 1 && (placed.length > 1 || hasNeighbor(grid, placed[0], 0, 1));
  const [dr, dc] = across ? [0, 1] : [1, 0];

  // No gaps along the main line.
  const sorted = [...placed].sort((a, b) => a.r - b.r || a.c - b.c);
  const first = sorted[0], last = sorted[sorted.length - 1];
  for (let r = first.r, c = first.c; r <= last.r && c <= last.c; r += dr, c += dc)
    if (!grid[r][c]) return { ok: false, error: 'Tiles must be connected' };

  const boardEmpty = board.every((row) => row.every((x) => !x));
  if (boardEmpty) {
    if (!fresh.has(`${CENTER},${CENTER}`)) return { ok: false, error: 'First word must cover ★' };
  } else if (!placed.some((p) => [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([a, b]) => {
    const r = p.r + a, c = p.c + b;
    return inside(r, c) && !!board[r][c];
  }))) return { ok: false, error: 'Must connect to the board' };

  const words: { cells: [number, number][] }[] = [];
  const main = wordAt(grid, first.r, first.c, dr, dc);
  if (main.length > 1) words.push({ cells: main });
  for (const p of placed) {
    const cross = wordAt(grid, p.r, p.c, dc, dr);
    if (cross.length > 1) words.push({ cells: cross });
  }
  if (!words.length) return { ok: false, error: 'Words need 2+ letters' };

  let score = 0;
  const out: string[] = [];
  for (const w of words) {
    const text = w.cells.map(([r, c]) => grid[r][c]).join('');
    if (!isWord(text)) return { ok: false, error: `"${text}" is not a word` };
    out.push(text);
    let sum = 0, mult = 1;
    for (const [r, c] of w.cells) {
      let v = VALUES[grid[r][c]!];
      if (fresh.has(`${r},${c}`)) {
        const pr = PREMIUM[r][c];
        if (pr === '2L') v *= 2;
        if (pr === '3L') v *= 3;
        if (pr === '2W' || pr === '★') mult *= 2;
        if (pr === '3W') mult *= 3;
      }
      sum += v;
    }
    score += sum * mult;
  }
  if (placed.length === 7) score += 35;
  return { ok: true, score, words: out };
}

function hasNeighbor(grid: Board, p: Placement, dr: number, dc: number) {
  const a = [p.r - dr, p.c - dc], b = [p.r + dr, p.c + dc];
  return (inside(a[0], a[1]) && !!grid[a[0]][a[1]]) || (inside(b[0], b[1]) && !!grid[b[0]][b[1]]);
}

function wordAt(grid: Board, r: number, c: number, dr: number, dc: number): [number, number][] {
  while (inside(r - dr, c - dc) && grid[r - dr][c - dc]) { r -= dr; c -= dc; }
  const cells: [number, number][] = [];
  while (inside(r, c) && grid[r][c]) { cells.push([r, c]); r += dr; c += dc; }
  return cells;
}

/** Best move for a rack. `skill` 0..1 — lower picks weaker moves. */
export function findMove(board: Board, rack: string[], skill = 1): { placed: Placement[]; score: number } | null {
  const found: { placed: Placement[]; score: number }[] = [];
  for (const word of BOT_WORDS) {
    if (word.length > N) continue;
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      for (let line = 0; line < N; line++) {
        for (let start = 0; start + word.length <= N; start++) {
          const r0 = dr ? start : line, c0 = dr ? line : start;
          const br = r0 - dr, bc = c0 - dc, ar = r0 + dr * word.length, ac = c0 + dc * word.length;
          if (inside(br, bc) && board[br][bc]) continue;
          if (inside(ar, ac) && board[ar][ac]) continue;
          const pool = rack.slice();
          const placed: Placement[] = [];
          let fits = true;
          for (let i = 0; i < word.length; i++) {
            const r = r0 + dr * i, c = c0 + dc * i, cur = board[r][c];
            if (cur) { if (cur !== word[i]) { fits = false; break; } continue; }
            const k = pool.indexOf(word[i]);
            if (k < 0) { fits = false; break; }
            pool.splice(k, 1);
            placed.push({ r, c, letter: word[i] });
          }
          if (!fits || !placed.length) continue;
          const res = validateMove(board, placed);
          if (res.ok) found.push({ placed, score: res.score });
        }
      }
    }
  }
  if (!found.length) return null;
  found.sort((a, b) => b.score - a.score);
  const idx = Math.min(found.length - 1, Math.floor((1 - skill) * Math.random() * found.length * 0.5));
  return found[idx];
}

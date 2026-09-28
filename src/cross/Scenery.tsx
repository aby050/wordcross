import { memo, ReactElement, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient as LG, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';
import type { ThemeId } from './store';
import { Ambient } from './motion';

// Hand-built vector scenes, one per theme. Drawn on a 400×800 canvas and cropped to fill.
// A seeded scatter keeps stars/petals/bubbles identical between renders.
function scatter(n: number, seed: number, w = 400, h = 800) {
  let a = seed;
  const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => ({ x: r() * w, y: r() * h, s: r() }));
}

const Sky = ({ id, stops }: { id: string; stops: [string, number][] }) => (
  <>
    <Defs>
      <LG id={id} x1="0" y1="0" x2="0" y2="1">
        {stops.map(([c, o]) => <Stop key={o} offset={o} stopColor={c} />)}
      </LG>
    </Defs>
    <Rect width="400" height="800" fill={`url(#${id})`} />
  </>
);

const Pine = ({ x, y, h, c }: { x: number; y: number; h: number; c: string }) => (
  <Polygon points={`${x},${y - h} ${x - h * 0.28},${y} ${x + h * 0.28},${y}`} fill={c} />
);

function Lake() {
  return (
    <>
      <Sky id="lk" stops={[['#3B2F7A', 0], ['#8E5AA8', 0.35], ['#F29A7B', 0.55], ['#FFD39A', 0.62]]} />
      <Circle cx="290" cy="470" r="46" fill="#FFE7B0" opacity={0.9} />
      {scatter(30, 7, 400, 300).map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={0.6 + p.s} fill="#fff" opacity={0.6} />)}
      <Path d="M0 470 L60 380 L120 440 L190 350 L260 430 L330 370 L400 440 L400 520 L0 520Z" fill="#6A4C93" opacity={0.75} />
      <Path d="M0 500 L80 420 L150 480 L230 410 L300 470 L360 430 L400 460 L400 530 L0 530Z" fill="#4B356F" />
      {[20, 55, 90, 330, 365, 395].map((x, i) => <Pine key={i} x={x} y={530} h={70 + (i % 3) * 18} c="#2C1F45" />)}
      <Rect y="528" width="400" height="272" fill="#5E4A8A" />
      <Rect y="528" width="400" height="272" fill="#F29A7B" opacity={0.18} />
      {scatter(26, 11, 400, 250).map((p, i) => (
        <Rect key={i} x={p.x} y={540 + p.y} width={20 + p.s * 50} height={2} rx={1} fill="#FFD9B0" opacity={0.35} />
      ))}
      <Path d="M0 760 Q100 720 200 750 T400 740 L400 800 L0 800Z" fill="#2C1F45" />
    </>
  );
}

function Blossom() {
  const branch = (flip: boolean) => (
    <G transform={flip ? 'translate(400,0) scale(-1,1)' : undefined}>
      <Path d="M-10 60 Q80 90 150 70 Q200 55 240 90 M60 78 Q90 130 70 180 M150 70 Q170 30 210 20" stroke="#6B3A4A" strokeWidth={7} fill="none" strokeLinecap="round" />
      {scatter(28, flip ? 31 : 17, 240, 180).map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y + 10} r={6 + p.s * 8} fill={i % 3 ? '#FFB7CE' : '#FF8FB1'} opacity={0.95} />
      ))}
    </G>
  );
  return (
    <>
      <Sky id="bl" stops={[['#FFD6E4', 0], ['#FFE9F0', 0.5], ['#FFC2D6', 1]]} />
      <Path d="M0 640 Q120 580 240 620 T400 600 L400 800 L0 800Z" fill="#F7A8C0" opacity={0.6} />
      <Path d="M0 690 Q140 650 260 690 T400 670 L400 800 L0 800Z" fill="#F08DAE" opacity={0.6} />
      {branch(false)}
      <G transform="translate(0,560)">{branch(true)}</G>
      {scatter(40, 5).map((p, i) => (
        <Ellipse key={i} cx={p.x} cy={p.y} rx={4 + p.s * 3} ry={2.5} fill="#FF9CBC" opacity={0.7} transform={`rotate(${p.s * 180} ${p.x} ${p.y})`} />
      ))}
    </>
  );
}

function Nature() {
  const leaf = (x: number, y: number, r: number, s: number, c: string, k: number) => (
    <G key={k} transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
      <Path d="M0 0 Q40 -30 90 0 Q40 30 0 0Z" fill={c} />
      <Path d="M0 0 L90 0" stroke="#0E2A18" strokeWidth={1.5} opacity={0.4} />
    </G>
  );
  return (
    <>
      <Sky id="nt" stops={[['#9ED9A0', 0], ['#4E9E62', 0.45], ['#1F5A36', 1]]} />
      <Path d="M0 420 Q100 360 200 400 T400 380 L400 800 L0 800Z" fill="#2F7A48" opacity={0.7} />
      <Path d="M0 520 Q120 470 230 510 T400 490 L400 800 L0 800Z" fill="#23603A" />
      {[30, 80, 330, 380].map((x, i) => <Pine key={i} x={x} y={520} h={120 + (i % 2) * 40} c="#174A2B" />)}
      <Path d="M0 640 Q140 600 260 640 T400 620 L400 800 L0 800Z" fill="#163F26" />
      {[[-20, 30, 20, 1.3, '#2E8B4E'], [-10, 110, 40, 1.1, '#3FA35F'], [330, 20, 150, 1.4, '#2E8B4E'], [360, 120, 170, 1.1, '#48B06A'],
        [-20, 700, -30, 1.4, '#2E8B4E'], [340, 720, 200, 1.3, '#3FA35F'], [120, 780, -60, 1.1, '#48B06A']].map((l, i) =>
        leaf(l[0] as number, l[1] as number, l[2] as number, l[3] as number, l[4] as string, i))}
      {scatter(24, 23, 400, 500).map((p, i) => <Circle key={i} cx={p.x} cy={250 + p.y} r={1.5 + p.s * 1.5} fill="#EFFF9A" opacity={0.5 + p.s * 0.4} />)}
    </>
  );
}

function Ocean() {
  return (
    <>
      <Sky id="oc" stops={[['#5FD0F5', 0], ['#1E8FD8', 0.4], ['#0B4E9C', 1]]} />
      {[40, 130, 230, 320].map((x, i) => (
        <Polygon key={i} points={`${x},0 ${x + 40},0 ${x + 110},800 ${x + 20},800`} fill="#fff" opacity={0.06} />
      ))}
      {scatter(34, 13).map((p, i) => <Circle key={i} cx={p.x} cy={p.y} r={2 + p.s * 6} stroke="#DFF6FF" strokeWidth={1.5} fill="none" opacity={0.5} />)}
      <Path d="M0 720 Q100 690 200 715 T400 705 L400 800 L0 800Z" fill="#E8C98E" />
      {[[40, '#FF7A6B'], [80, '#FFB347'], [320, '#FF6FA3'], [360, '#FF7A6B']].map(([x, c], i) => (
        <Path key={i} d={`M${x} 730 q-10 -40 -25 -60 M${x} 730 q5 -50 0 -80 M${x} 730 q15 -35 30 -55`} stroke={c as string} strokeWidth={8} strokeLinecap="round" fill="none" />
      ))}
      {[150, 190, 260].map((x, i) => (
        <Path key={i} d={`M${x} 730 q-15 -40 0 -80 q15 -40 0 -80`} stroke="#2BB673" strokeWidth={6} fill="none" strokeLinecap="round" />
      ))}
      {[[70, 300, 1, '#FFB347'], [320, 420, -1, '#FFE066'], [120, 560, 1, '#FF7A6B']].map(([x, y, d, c], i) => (
        <G key={i} transform={`translate(${x},${y}) scale(${d},1)`}>
          <Ellipse cx="0" cy="0" rx="20" ry="11" fill={c as string} />
          <Polygon points="18,0 32,-10 32,10" fill={c as string} />
          <Circle cx="-10" cy="-3" r="2.5" fill="#123" />
        </G>
      ))}
    </>
  );
}

function Night() {
  return (
    <>
      <Sky id="ng" stops={[['#0B0930', 0], ['#26206A', 0.6], ['#3B2F8F', 1]]} />
      {scatter(90, 3).map((p, i) => <Circle key={i} cx={p.x} cy={p.y * 0.75} r={0.5 + p.s * 1.4} fill="#fff" opacity={0.4 + p.s * 0.6} />)}
      <Defs>
        <RadialGradient id="mg" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0.6" stopColor="#FFF3C4" stopOpacity={0.35} />
          <Stop offset="1" stopColor="#FFF3C4" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="310" cy="120" r="80" fill="url(#mg)" />
      <Path d="M330 80 A45 45 0 1 0 330 160 A36 36 0 1 1 330 80Z" fill="#FFE9A0" />
      <Path d="M0 640 Q110 580 220 620 T400 600 L400 800 L0 800Z" fill="#1A1550" />
      <Path d="M0 700 Q140 660 260 700 T400 680 L400 800 L0 800Z" fill="#100C38" />
      {[25, 60, 350, 385].map((x, i) => <Pine key={i} x={x} y={710} h={80 + (i % 2) * 25} c="#0A0826" />)}
    </>
  );
}

function Autumn() {
  const leaf = (x: number, y: number, r: number, c: string, k: number) => (
    <G key={k} transform={`translate(${x},${y}) rotate(${r})`}>
      <Path d="M0 -12 L4 -4 L12 -6 L8 2 L12 8 L3 6 L0 14 L-3 6 L-12 8 L-8 2 L-12 -6 L-4 -4Z" fill={c} />
    </G>
  );
  return (
    <>
      <Sky id="au" stops={[['#FFB35C', 0], ['#F2793A', 0.55], ['#B8452A', 1]]} />
      <Circle cx="110" cy="210" r="50" fill="#FFE3A3" opacity={0.7} />
      <Path d="M0 520 Q110 460 220 500 T400 480 L400 800 L0 800Z" fill="#C8562D" />
      <Path d="M0 600 Q130 560 250 600 T400 580 L400 800 L0 800Z" fill="#9A3B1F" />
      {[[40, 600], [95, 590], [320, 585], [370, 600]].map(([x, y], i) => (
        <G key={i}>
          <Rect x={x - 4} y={y - 40} width={8} height={40} fill="#5A2A14" />
          <Circle cx={x} cy={y - 60} r={34} fill={i % 2 ? '#F29B38' : '#E0602C'} />
        </G>
      ))}
      {scatter(30, 19).map((p, i) => leaf(p.x, p.y, p.s * 360, ['#FFB347', '#E0602C', '#FFD166', '#C8452A'][i % 4], i))}
    </>
  );
}

function Wood() {
  return (
    <>
      <Sky id="wd" stops={[['#C79A6B', 0], ['#A87B4F', 1]]} />
      {Array.from({ length: 11 }, (_, i) => (
        <G key={i}>
          <Rect x={i * 40} y="0" width="40" height="800" fill={i % 2 ? '#B88A5C' : '#C09163'} />
          <Rect x={i * 40} y="0" width="2" height="800" fill="#6E4A2A" opacity={0.5} />
        </G>
      ))}
      {scatter(40, 29).map((p, i) => (
        <Ellipse key={i} cx={Math.floor(p.x / 40) * 40 + 20} cy={p.y} rx={5 + p.s * 8} ry={2} fill="#7A5230" opacity={0.25} />
      ))}
    </>
  );
}

const SCENES: Record<ThemeId, () => ReactElement> = {
  classic: Lake, blossom: Blossom, forest: Nature, ocean: Ocean, night: Night, paper: Wood, autumn: Autumn,
};

export const Scenery = memo(function Scenery({ theme, particles = 18 }: { theme: ThemeId; particles?: number }) {
  const Scene = SCENES[theme] ?? Lake;
  const [box, setBox] = useState({ w: 0, h: 0 });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
        <Scene />
      </Svg>
      {box.w > 0 && particles > 0 && <Ambient key={theme} theme={theme} count={particles} width={box.w} height={box.h} />}
    </View>
  );
});

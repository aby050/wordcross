import { useEffect, useRef, useState, RefObject } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { Tile } from './ui';
import { play } from './sound';

// Stops mouse drags from selecting text on web; ignored on native.
const webNoSelect = { userSelect: 'none', cursor: 'grab' };

type Props = {
  letter: string; value?: number; size: number; selected?: boolean; faded?: boolean;
  disabled?: boolean; highlight?: string;
  /** Bounce in on mount — used for tiles that just landed on the board. */
  pop?: boolean;
  onTap?: () => void;
  /** Called with the finger's window coordinates when a drag ends. */
  onDrop: (x: number, y: number) => void;
};

/** A tile that can be tapped or dragged. Built on PanResponder so it works on iOS, Android and web. */
export function DragTile({ disabled, onTap, onDrop, highlight, pop, ...tile }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(pop ? 1.35 : 1)).current;
  useEffect(() => {
    if (pop) Animated.spring(scale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: false }).start();
  }, []);
  // Missed drops glide back home instead of teleporting.
  const home = () => Animated.spring(pan, { toValue: { x: 0, y: 0 }, friction: 6, tension: 120, useNativeDriver: false }).start();
  const lift = (up: boolean) => Animated.spring(scale, { toValue: up ? 1.18 : 1, friction: 5, useNativeDriver: false }).start();
  const [dragging, setDragging] = useState(false);
  const cb = useRef({ onTap, onDrop, disabled });
  cb.current = { onTap, onDrop, disabled };

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !cb.current.disabled,
    onMoveShouldSetPanResponder: () => !cb.current.disabled,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => { setDragging(true); lift(true); play('pickup'); },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      setDragging(false);
      lift(false);
      home();
      if (Math.abs(g.dx) + Math.abs(g.dy) > 8) cb.current.onDrop(g.moveX, g.moveY);
      else cb.current.onTap?.();
    },
    onPanResponderTerminate: () => { setDragging(false); lift(false); home(); },
  })).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{ ...(webNoSelect as object), zIndex: dragging ? 999 : 1, elevation: dragging ? 12 : 0, transform: [...pan.getTranslateTransform(), { scale }] }}
    >
      <View pointerEvents="none">
        <Tile {...tile} selected={tile.selected && !dragging}
          style={highlight ? { borderColor: highlight, borderWidth: 2 } : undefined} />
      </View>
    </Animated.View>
  );
}

/** Maps a window point to a grid cell of a measured board. Calls back with null when outside. */
export function hitCell(
  ref: RefObject<View | null>, x: number, y: number, offset: number, cell: number, n: number,
  cb: (rc: [number, number] | null) => void,
) {
  const node = ref.current;
  if (!node) return cb(null);
  node.measureInWindow((bx, by) => {
    const c = Math.floor((x - bx - offset) / cell), r = Math.floor((y - by - offset) / cell);
    cb(r >= 0 && c >= 0 && r < n && c < n ? [r, c] : null);
  });
}

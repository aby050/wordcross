import { useRef, useState, RefObject } from 'react';
import { Animated, PanResponder, View } from 'react-native';
import { Tile } from './ui';

// Stops mouse drags from selecting text on web; ignored on native.
const webNoSelect = { userSelect: 'none', cursor: 'grab' };

type Props = {
  letter: string; value?: number; size: number; selected?: boolean; faded?: boolean;
  disabled?: boolean; highlight?: string;
  onTap?: () => void;
  /** Called with the finger's window coordinates when a drag ends. */
  onDrop: (x: number, y: number) => void;
};

/** A tile that can be tapped or dragged. Built on PanResponder so it works on iOS, Android and web. */
export function DragTile({ disabled, onTap, onDrop, highlight, ...tile }: Props) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const cb = useRef({ onTap, onDrop, disabled });
  cb.current = { onTap, onDrop, disabled };

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !cb.current.disabled,
    onMoveShouldSetPanResponder: () => !cb.current.disabled,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      setDragging(false);
      pan.setValue({ x: 0, y: 0 });
      if (Math.abs(g.dx) + Math.abs(g.dy) > 8) cb.current.onDrop(g.moveX, g.moveY);
      else cb.current.onTap?.();
    },
    onPanResponderTerminate: () => { setDragging(false); pan.setValue({ x: 0, y: 0 }); },
  })).current;

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{ ...(webNoSelect as object), zIndex: dragging ? 999 : 1, elevation: dragging ? 12 : 0, transform: [...pan.getTranslateTransform(), { scale: dragging ? 1.15 : 1 }] }}
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

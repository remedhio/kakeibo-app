import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import { layout } from '@/constants/theme';

export function useIsCompact(breakpoint = layout.compactBreakpoint) {
  const [compact, setCompact] = useState(() => Dimensions.get('window').width < breakpoint);

  useEffect(() => {
    const onChange = ({ window }: { window: { width: number } }) => {
      setCompact(window.width < breakpoint);
    };
    const sub = Dimensions.addEventListener('change', onChange);
    return () => sub.remove();
  }, [breakpoint]);

  return compact;
}

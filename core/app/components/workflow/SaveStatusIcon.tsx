import { FloppyDisk } from '@phosphor-icons/react';
import { useMemo } from 'react';

import { memo } from 'react';

// Memoized save status icon component to prevent unnecessary rerenders
const SaveStatusIcon = memo(({ saveStatus }: { saveStatus: string }) => {
  const iconClass = useMemo(() => {
    return `
      ${saveStatus === 'saving' ? 'text-yellow-500 animate-pulse' : ''}
      ${saveStatus === 'saved' ? 'text-green-500' : ''}
      ${saveStatus === 'error' ? 'text-red-500' : ''}
      ${saveStatus === 'idle' ? 'text-gray-400' : ''}
    `;
  }, [saveStatus]);

  return <FloppyDisk size={18} weight="fill" className={iconClass} />;
});
SaveStatusIcon.displayName = 'SaveStatusIcon';

export default SaveStatusIcon;

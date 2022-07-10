import { onStart } from './onStart';
import { adminPanelThread } from './adminPanel';

import type { Context } from './types';

function applyScripts(context: Context) {
  const { telegram } = context;

  telegram.configureScript('/start', onStart.bind(context));
  telegram.configureScript('/admin', adminPanelThread.bind(context));
}

export default applyScripts;

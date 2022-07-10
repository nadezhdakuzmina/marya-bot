import { onStart } from './onStart';

import type { Context } from './types';

function applyScripts(context: Context) {
  const { telegram } = context;
  telegram.configureScript('/start', onStart.bind(context));
}

export default applyScripts;

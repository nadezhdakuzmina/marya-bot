import { onStart } from './onStart';

import type Telegram from '@modules/core';

function applyScripts(telegram: Telegram) {
  telegram.configureScript('/start', onStart);
}

export default applyScripts;

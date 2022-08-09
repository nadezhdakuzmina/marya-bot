import type { Settings, StoreData } from './types';

export const DEFAULT_TELEGRAM_CREDENTIALS: StoreData['credentials'] = {
  token: '',
};

export const DEFAULT_SETTINGS: Settings = {
  sendMessageDelay: 100,
  inviteCodeLength: 6,
  referalBonusPercent: 0.05,
  referalSale: 0.05,
};

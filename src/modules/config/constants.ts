import type { Settings, SettingsDescription, StoreData } from './types';

export const DEFAULT_TELEGRAM_CREDENTIALS: StoreData['credentials'] = {
  token: '',
};

export const DEFAULT_SETTINGS: Settings = {
  sendMessageDelay: 100,
  inviteCodeLength: 6,
};

export const SETTINGS_DESCRIPTION: SettingsDescription = {
  inviteCodeLength: 'длина пригласительного кода',
  inviteCodeExpires: 'время действия пригласительного кода',
};

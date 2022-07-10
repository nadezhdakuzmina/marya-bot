import type Store from '@modules/store';

export interface InitParams {
  store: Store<StoreData>;
}

export interface Settings {
  sendMessageDelay: number;
  inviteCodeLength: number;
}

export interface SettingsDescription {
  [key: string]: string;
}

export interface StoreData {
  credentials: {
    token: string;
  };
  settings: Settings;
}

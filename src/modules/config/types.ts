import type Store from '@modules/store';

export interface InitParams {
  store: Store<StoreData<any>>;
}

export interface Settings {
  sendMessageDelay: number;
}

export interface SettingsDescription {
  [key: string]: string;
}

export interface StoreData<U> {
  credentials: {
    token: string;
  };
  settings: Settings;
}

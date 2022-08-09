import type Store from '@modules/store';

export interface InitParams {
  store: Store<StoreData>;
}

export interface Settings {
  sendMessageDelay: number;
  inviteCodeLength: number;
  referalBonusPercent: number;
  referalSale: number;
}

export interface StoreData {
  credentials: {
    token: string;
  };
  settings: Settings;
}

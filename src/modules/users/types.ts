import type Config from '@modules/config';
import type Store from '@modules/store';

export interface InitParams {
  store: Store<StoreData>;
  config: Config;
}

export interface UserData {
  fullName: string;
  phone: string;
  bonuce: number;
  inviteCode: string;
  procedures: Procedure[];
}

export interface Procedure {
  sum: number;
  name: number;
  date: string;
}

export interface StoreData {
  inviteCodes: {
    [uid: string]: string;
  };
  users: {
    [key: string]: UserData;
  };
}

export type UpdateUserData = Omit<UserData, 'procedures' | 'inviteCode'> &
  Partial<Pick<UserData, 'procedures'>>;

import type Config from '@modules/config';
import type Store from '@modules/store';

export enum Permitions {
  admin = 'admin',
  user = 'user',
}

export interface InitParams {
  store: Store<StoreData>;
  config: Config;
}

export interface UserData {
  fullName: string;
  phone: string;
  bonus: number;
  permitions: Permitions;
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
    [code: string]: number;
  };
  users: {
    [key: string]: UserData;
  };
}

export type CreateUserData = Omit<UserData, 'procedures' | 'inviteCode'> &
Partial<Pick<UserData, 'procedures'>>;

export type UpdateUserData = Partial<UserData>;

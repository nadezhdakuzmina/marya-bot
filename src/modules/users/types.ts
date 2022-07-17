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

export interface Sale {
  value: number; // в долях
  name: string;
}

export interface UserData {
  id: number;
  fullName: string;
  phone: string;
  birthday: string;
  bonus: number;
  permitions: Permitions;
  inviteCode: string;
  procedures: Procedure[];
  sales: Sale[];
  inviter?: number;
}

export interface Procedure {
  sum: number;
  name: string;
  date: number;
}

export interface StoreData {
  inviteCodes: {
    [code: string]: number;
  };
  users: {
    [key: string]: UserData;
  };
}

export type CreateUserData = Omit<
  UserData,
  'procedures' | 'inviteCode' | 'sales'
> &
  Partial<Pick<UserData, 'procedures'>> & {
    code?: string;
  };

export type UpdateUserData = Partial<UserData>;

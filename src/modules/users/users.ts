import {
  DEFAULT_INVITE_CODES,
  DEFAULT_USERS_LIST,
  MAIN_INVITE_CODE,
} from './constants';

import { Permitions } from './types';

import type Config from '@modules/config';
import type Store from '@modules/store';
import type {
  CreateUserData,
  InitParams,
  StoreData,
  UpdateUserData,
  UserData,
} from './types';

export class Users {
  public users: StoreData['users'];
  public inviteCodes: StoreData['inviteCodes'];

  private store: Store<StoreData>;
  private config: Config;

  constructor(params: InitParams) {
    const { store, config } = params;
    this.store = store;
    this.config = config;
  }

  public async initUsers(): Promise<void> {
    this.users = {
      ...DEFAULT_USERS_LIST,
      ...this.store.store.users,
    };

    this.inviteCodes = {
      ...DEFAULT_INVITE_CODES,
      ...this.store.store.inviteCodes,
    };

    return this.store.update({
      users: this.users,
      inviteCodes: this.inviteCodes,
    });
  }

  public checkAccess(uid: number, permitions: Permitions): boolean {
    return this.users[uid]?.permitions === permitions;
  }

  public getUser(uid: number): UserData {
    return this.users[uid];
  }

  public updateInviteCodes(uid: number, code: string): void {
    this.inviteCodes = {
      ...this.inviteCodes,
      [code]: uid,
    };

    this.store.update({
      inviteCodes: this.inviteCodes,
    });
  }

  public updateUser(uid: number, user: UpdateUserData): void {
    const newUser = {
      ...this.users[uid],
      ...user,
    };

    this.insertUser(uid, newUser);
  }

  public createUser(uid: number, user: CreateUserData): void {
    const newUser: UserData = {
      ...user,
      inviteCode: this.generateInviteCode(uid),
      procedures: [],
    };

    this.insertUser(uid, newUser);
  }

  public deleteUser(uid: number): void {
    this.insertUser(uid);
  }

  public generateInviteCode(uid?: number): string {
    const {
      settings: { inviteCodeLength },
    } = this.config;

    // Проверяем, что главный код уже сгенерирован
    const mainInviteCode = Object.entries(this.inviteCodes).find(
      ([_, userID]) => userID === MAIN_INVITE_CODE
    );

    if (mainInviteCode) {
      return mainInviteCode[0];
    }

    const maxCodeNum = 10 ** inviteCodeLength - 1;
    const minCodeNum = 10 ** (inviteCodeLength - 1);

    let code: string;

    while (!code || code in this.inviteCodes) {
      const codeNum = Math.random() * (maxCodeNum - minCodeNum) + minCodeNum;
      code = Math.floor(codeNum).toString();
    }

    this.updateInviteCodes(uid || MAIN_INVITE_CODE, code);
    return code;
  }

  public applyInviteCode(uid: number, code: string): void {
    const inviteCodeCreater = this.inviteCodes[code];

    if (inviteCodeCreater === MAIN_INVITE_CODE) {
      this.updateUser(uid, { permitions: Permitions.admin });
      return;
    }

    // Здесь нужно разрулить начисление бонусов
  }

  private insertUser(uid: number, user?: UserData): void {
    this.users = {
      ...this.users,
      [uid]: user,
    };

    this.store.update({
      users: this.users,
    });
  }
}

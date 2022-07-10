import {
  DEFAULT_INVITE_CODES,
  DEFAULT_USERS_LIST,
  MAIN_INVITE_CODE,
} from './constants';

import type Config from '@modules/config';
import type Store from '@modules/store';
import type { InitParams, StoreData, UpdateUserData, UserData } from './types';

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

  public getUser(uid: string): UserData {
    return this.users[uid];
  }

  public updateInviteCodes(uid: string, code: string): void {
    this.inviteCodes = {
      ...this.inviteCodes,
      [uid]: code,
    };

    this.store.update(this.inviteCodes);
  }

  public updateUsers(uid: string, user?: UserData): void {
    this.users = {
      ...this.users,
      [uid]: user,
    };

    this.store.update(this.users);
  }

  public createUser(uid: string, user: UpdateUserData): void {
    const newUser: UserData = {
      ...user,
      inviteCode: this.generateInviteCode(uid),
      procedures: [],
    };

    this.updateUsers(uid, newUser);
  }

  public deleteUser(uid: string): void {
    this.updateUsers(uid);
  }

  private generateInviteCode(uid?: string): string {
    const {
      settings: { inviteCodeLength },
    } = this.config;

    const maxCodeNum = 10 ** inviteCodeLength - 1;
    const minCodeNum = 10 ** (inviteCodeLength - 1);

    const codeNum = Math.random() * (maxCodeNum - minCodeNum) + minCodeNum;
    const code = Math.floor(codeNum).toString();

    this.updateInviteCodes(uid || MAIN_INVITE_CODE, code);
    return code;
  }
}

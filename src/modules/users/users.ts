import {
  DEFAULT_INVITE_CODES,
  DEFAULT_USERS_LIST,
  MAIN_INVITE_CODE,
} from './constants';

import makeShingles from '@utils/makeShingles';
import normalizePhone from '@utils/normalizePhone';

import { Permitions, Procedure } from './types';

import type Config from '@modules/config';
import type Store from '@modules/store';
import type {
  CreateUserData,
  InitParams,
  StoreData,
  UpdateUserData,
  UserData,
} from './types';

const SHINGLE_SIZE = 3;
const MAX_USERS_IN_SEARCH = 10;

export class Users {
  public users: StoreData['users'];
  public inviteCodes: StoreData['inviteCodes'];

  private store: Store<StoreData>;
  private config: Config;
  private userIndexes: Map<string, number[]>;
  private isSearchReady: boolean;

  constructor(params: InitParams) {
    const { store, config } = params;

    this.store = store;
    this.config = config;

    this.userIndexes = new Map<string, number[]>();
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

    this.makeUsersIndexes();

    return this.store.update({
      users: this.users,
      inviteCodes: this.inviteCodes,
    });
  }

  public findUsers(nameOrPhone: string): UserData[] {
    if (!this.isSearchReady) {
      return [];
    }

    const userEntries = new Map<number, number>();

    try {
      nameOrPhone = normalizePhone(nameOrPhone);
    } catch (e) {}

    const entries = nameOrPhone
      .toLowerCase()
      .split(' ')
      .reduce(
        (shingles, word) => [...shingles, ...makeShingles(word, SHINGLE_SIZE)],
        []
      );

    entries.forEach((key) => {
      if (!this.userIndexes.has(key)) {
        return;
      }

      const usersID = this.userIndexes.get(key);
      usersID.forEach((userID) => {
        const entriesCount = userEntries.get(userID) || 0;
        userEntries.set(userID, entriesCount + 1);
      });
    });

    return Array.from(userEntries.entries())
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, MAX_USERS_IN_SEARCH)
      .map(([userID]) => this.users[userID]);
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

  public captureProcedure(uid: number, procedure: Procedure): void {
    const user = this.users[uid];

    if (!user) {
      return;
    }

    if (!user.procedures.length) {
      const inviter = this.users[user.inviter];

      if (inviter) {
        inviter.bonus += procedure.sum * 0.05;
      }
    }

    this.updateUser(uid, {
      procedures: [...this.users[uid].procedures, procedure],
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
    const { code, ...otherParams } = user;

    const newUser: UserData = {
      ...otherParams,
      id: uid,
      sales: [],
      phone: normalizePhone(user.phone),
      inviteCode: this.generateInviteCode(uid),
      procedures: [],
    };

    this.insertUser(uid, newUser);
    this.insertUserInIndex(newUser);

    if (!code) {
      return;
    }

    this.applyInviteCode(uid, code);
  }

  public deleteUser(uid: number): void {
    this.insertUser(uid);
  }

  public generateInviteCode(uid?: number): string {
    const {
      settings: { inviteCodeLength },
    } = this.config;

    if (!uid) {
      // Проверяем, что главный код уже сгенерирован
      const mainInviteCode = Object.entries(this.inviteCodes).find(
        ([_, userID]) => userID === MAIN_INVITE_CODE
      );

      if (mainInviteCode) {
        return mainInviteCode[0];
      }
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

  private makeUsersIndexes(): void {
    const usersList = Object.values(this.users);
    let index = 0;

    const indexUser = () =>
      setTimeout(() => {
        const user = usersList[index++];
        this.insertUserInIndex(user);

        if (index < usersList.length) {
          indexUser();
          return;
        }

        this.isSearchReady = true;
      });

    indexUser();
  }

  private insertUserInIndex(user: UserData): void {
    const entries = [
      ...makeShingles(user.phone, SHINGLE_SIZE),
      ...user.fullName
        .toLowerCase()
        .split(' ')
        .reduce(
          (shingles, word) => [
            ...shingles,
            ...makeShingles(word, SHINGLE_SIZE),
          ],
          []
        ),
    ];

    entries.forEach((key) => {
      if (!this.userIndexes.has(key)) {
        this.userIndexes.set(key, []);
      }

      const userEntries = this.userIndexes.get(key);
      if (!userEntries.includes(user.id)) {
        userEntries.push(user.id);
      }
    });
  }

  private applyInviteCode(uid: number, code: string): void {
    const inviteCodeCreater = this.inviteCodes[code];

    if (inviteCodeCreater === MAIN_INVITE_CODE) {
      this.updateUser(uid, { permitions: Permitions.admin });
      return;
    }

    const user = this.getUser(uid);
    if (user.inviter) {
      return;
    }

    this.updateUser(uid, {
      inviter: this.inviteCodes[code],
      sales: [
        {
          value: 0.05,
          name: 'startSale',
        },
      ],
    });
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

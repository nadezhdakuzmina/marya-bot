import input from '@utils/input';

import { DEFAULT_SETTINGS, DEFAULT_TELEGRAM_CREDENTIALS } from './constants';

import type Store from '@modules/store';
import type { StoreData } from './types';
import type { InitParams, Settings } from './types';

export const SECTION_LENGTH = 10;

export class Config {
  public settings: Settings;
  public credentials: StoreData['credentials'];

  private store: Store<StoreData>;

  constructor(params: InitParams) {
    const { store } = params;

    this.store = store;
  }

  public async initConfig(): Promise<void> {
    this.settings = {
      ...DEFAULT_SETTINGS,
      ...this.store.store.settings,
    };

    await this.initTelegramCredentials();

    await this.store.update({
      settings: this.settings,
      credentials: this.credentials,
    });
  }

  public updateSettings(data: Partial<Settings>): void {
    this.settings = {
      ...this.settings,
      ...data,
    };

    this.store.update({
      settings: this.settings,
    });
  }

  public updateTelegramCredentials(
    data: Partial<StoreData['credentials']>
  ): void {
    this.credentials = {
      ...this.credentials,
      ...data,
    };

    this.store.update({
      credentials: this.credentials,
    });
  }

  private async initWrapper(
    name: string,
    func: () => Promise<void>
  ): Promise<void> {
    const section =
      name +
      (name.length < SECTION_LENGTH
        ? ' '.repeat(SECTION_LENGTH - name.length)
        : '');

    console.log(`==== ${section} ====`);
    await func();
    console.log('='.repeat(SECTION_LENGTH + 10));
  }

  /* <Telegram-settings managers> */

  private async initTelegramCredentials(): Promise<void> {
    this.credentials = {
      ...DEFAULT_TELEGRAM_CREDENTIALS,
      ...this.store.store.credentials,
    };

    if (!this.credentials.token) {
      return this.initWrapper('Telegram', async () => {
        this.credentials.token = await input('Telegram token: ');
      });
    }
  }

  /* </Telegram-settings managers> */
}

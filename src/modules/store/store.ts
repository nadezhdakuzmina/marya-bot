import { readFile, writeFile } from 'fs/promises';

export class Store<T> {
  public store: Partial<T>;

  private filePath: string;
  private writePromise: Promise<any>;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  public async load(): Promise<void> {
    this.store = await readFile(this.filePath)
      .then((buffer) => JSON.parse(buffer.toString()))
      .catch(async () => {
        const newStore = {};
        await this.update(newStore);
        return newStore;
      });
  }

  public async save(): Promise<void> {
    if (this.writePromise) {
      await this.writePromise;
    }

    const payload = JSON.stringify(this.store, null, 2);
    this.writePromise = writeFile(this.filePath, payload);

    return this.writePromise;
  }

  public update(data: Partial<T>): Promise<void> {
    this.store = {
      ...this.store,
      ...data,
    };

    return this.save();
  }
}

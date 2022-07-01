export type DefaultFunction<A extends [], R> = (...args: A) => Promise<R>;

export interface CacheTable<T> {
  [key: string]: {
    data: T;
    expires: number;
  };
}

export type SelectorFunction<A extends []> = (...args: A) => any;

const cacheBounder =
  <A extends [], R>(cacheTime: number, propsSelector?: SelectorFunction<A>) =>
  (
    target: object,
    propertyName: string,
    /* tslint:disable-next-line */
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    const func = descriptor.value;
    const cacheTable: CacheTable<R> = {};

    descriptor.value = function (...args: A) {
      let hashKey: string;
      if (propsSelector) {
        hashKey = JSON.stringify(propsSelector(...args));
      } else {
        hashKey = JSON.stringify(args);
      }

      const cacheData = cacheTable[hashKey];
      if (cacheData?.expires > Date.now()) {
        return cacheData.data;
      }

      const data = func.call(this, ...args);

      cacheTable[hashKey] = {
        expires: Date.now() + cacheTime,
        data,
      };

      return data.catch((error: Error) => {
        delete cacheTable[hashKey];
        throw error;
      });
    };
  };

export default cacheBounder;

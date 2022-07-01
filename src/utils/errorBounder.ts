import timeout from '@utils/timeout';

export type DefaultFunction<A extends [], R> = (...args: A) => Promise<R>;

export interface RetriesCount {
  [key: string]: number;
}

export const DEFAULT_RETRIES_COUNT = 3;

export const DEFAULT_DELAY_TIME = 500;

const errorBounder =
  <A extends [], R>(
    retries = DEFAULT_RETRIES_COUNT,
    delay = DEFAULT_DELAY_TIME,
    giveUp?: boolean
  ) =>
  (
    target: object,
    propertyName: string,
    /* tslint:disable-next-line */
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    const func = descriptor.value;
    descriptor.value = function (...args: A) {
      let retriesCount: number = retries;

      const retryFunc = () =>
        func.call(this, ...args).catch(async (error: Error): Promise<R> => {
          await timeout(delay);

          if (retriesCount-- > 0) {
            return retryFunc();
          }

          if (!giveUp) {
            throw error;
          }
        });

      return retryFunc();
    };
  };

export default errorBounder;

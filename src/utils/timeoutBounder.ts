export type DefaultFunction<A extends [], R> = (...args: A) => Promise<R>;

export const TimeoutError = new Error('Timeout');

const timeoutBounder =
  <A extends [], R>(timeout: number) =>
  (
    target: object,
    propertyName: string,
    /* tslint:disable-next-line */
    descriptor: TypedPropertyDescriptor<Function>
  ) => {
    const func = descriptor.value;
    descriptor.value = function (...args: A) {
      return new Promise((resolve, reject) => {
        let isFinished = false;
        const timer = setTimeout(() => {
          if (isFinished) {
            return;
          }

          isFinished = true;
          reject(TimeoutError);
        }, timeout);

        func
          .call(this, ...args)
          .then(resolve)
          .catch(reject)
          .finally(() => {
            if (isFinished) {
              return;
            }

            clearTimeout(timer);
            isFinished = true;
          });
      });
    };
  };

export default timeoutBounder;

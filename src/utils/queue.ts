export type DefaultFunc<Result> = (...args: any) => Promise<Result>;

export default function queue<Result>(
  func: DefaultFunc<Result>,
  threads: number
): DefaultFunc<Result> {
  const stack: Array<Promise<Result>> = [];
  const callsQueue: Array<() => void> = [];

  const createThread = (resolve: (result: Result) => void, args: any) => {
    const threadPromise = func.call(this, ...args);
    stack.push(threadPromise);

    threadPromise.then((result: Result) => {
      const index = stack.indexOf(threadPromise);
      if (index !== -1) {
        stack.splice(index, 1);
      }

      const nextTask = callsQueue.shift();
      if (nextTask) {
        nextTask.call(this, ...args);
      }

      resolve(result);
    });
  };

  return (...args) =>
    new Promise((resolve) => {
      if (stack.length < threads) {
        return createThread(resolve, args);
      }

      callsQueue.push(() => createThread(resolve, args));
    });
}

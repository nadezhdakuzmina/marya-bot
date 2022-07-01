export type ExtendedPromise = Promise<void> & {
  clearTimeout: () => void;
};

const timeout = (delay: number): ExtendedPromise => {
  let timer: NodeJS.Timeout;
  const promise = new Promise((resolve) => {
    timer = setTimeout(resolve, delay);
  });

  // @ts-ignore
  promise.clearTimeout = () => clearTimeout(timer);

  // @ts-ignore
  return promise;
};

export default timeout;

const makeShingles = (word: string, size: number): string[] => {
  const letters = word.split('');
  const shingles: string[] = [];

  for (let index = 0; index <= letters.length - size; index += 1) {
    let shingle = '';

    for (let i = index; i < index + size; i += 1) {
      shingle += letters[i];
    }

    shingles.push(shingle);
  }

  return shingles;
};

export default makeShingles;

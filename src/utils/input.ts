import { stdin, stdout } from 'process';
import readline from 'readline';

const RLInterface = readline.createInterface({
  input: stdin,
  output: stdout,
});

const input = async (question?: string): Promise<string> =>
  new Promise((resolve) => RLInterface.question(question, resolve));

export default input;

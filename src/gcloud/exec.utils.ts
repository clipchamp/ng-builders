import { spawn } from 'child_process';

function processChunk(
  chunk: string | Buffer,
  callback: (line: string) => void
): void {
  const ar = chunk
    .toString()
    .replace(/\s*$/, '')
    .split(/[\r\n]+/);
  for (let i = 0; i < ar.length; ++i) {
    const line = ar[i];
    callback(line);
  }
}

export function exec(
  command: string,
  args: string[],
  cwd?: string,
  logLine?: (logLevel: string, line: string) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = {
      cwd
    };
    const process = spawn(command, args, options);
    process.stdout.setEncoding('utf8');
    process.stderr.setEncoding('utf8');
    process.stderr.on('data', chunk =>
      processChunk(chunk, line => logLine('error', line))
    );
    process.stdout.on('data', chunk =>
      processChunk(chunk, line => logLine('info', line))
    );
    process.on('close', (code, signal) => {
      if (code > 0) {
        return reject(signal);
      }
      return resolve();
    });
  });
}

export function capture(
  command: string,
  args: string[],
  cwd?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    const options = {
      cwd
    };
    const process = spawn(command, args, options);
    process.stdout.setEncoding('utf8');
    process.stdout.on('data', chunk => (stdout += chunk));
    process.on('close', (code, signal) => {
      if (code > 0) {
        return reject(signal);
      }
      return resolve(stdout.trim());
    });
  });
}

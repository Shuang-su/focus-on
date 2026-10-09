import { constants } from 'node:fs';
import { lstat, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function outputDirectory(project: string, requested: string): Promise<string> {
  const boundary = path.join(project, '.codex-work', 'tmp');
  const destination = path.resolve(requested);
  if (destination !== boundary && !destination.startsWith(boundary + path.sep)) throw new Error('--out must be inside this project .codex-work/tmp');
  let cursor = project;
  for (const segment of path.relative(project, destination).split(path.sep)) {
    cursor = path.join(cursor, segment);
    try {
      const stat = await lstat(cursor);
      if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('Output path must use real project directories');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      await mkdir(cursor);
    }
  }
  return destination;
}
export async function writeOutput(directory: string, filename: string, text: string): Promise<void> {
  await writeFile(path.join(directory, filename), text, { flag: constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | constants.O_NOFOLLOW, mode: 0o600 });
}

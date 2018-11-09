import {
  existsSync,
  lstatSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  readdirSync
} from 'fs';
import { join, basename } from 'path';

export function copyFileSync(source: string, target: string): void {
  let targetFile = target;

  //if target is a directory a new file with the same name will be created
  if (existsSync(target)) {
    if (lstatSync(target).isDirectory()) {
      targetFile = join(target, basename(source));
    }
  }

  writeFileSync(targetFile, readFileSync(source));
}

export function copyFolderRecursiveSync(source: string, target: string): void {
  let files = [];

  //check if folder needs to be created or integrated
  const targetFolder = join(target, basename(source));
  if (!existsSync(targetFolder)) {
    mkdirSync(targetFolder);
  }

  //copy
  if (lstatSync(source).isDirectory()) {
    files = readdirSync(source);
    files.forEach(function(file) {
      const curSource = join(source, file);
      if (lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, targetFolder);
      } else {
        copyFileSync(curSource, targetFolder);
      }
    });
  }
}

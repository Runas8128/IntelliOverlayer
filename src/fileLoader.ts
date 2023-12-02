import { workspace } from 'vscode';
import { readFileSync } from 'fs';
import { resolve } from 'path';


export class FileLoader {
  static loadLocal(...path: string[]) {
    return this.load(__dirname, '..', ...path);
  }

  static loadImpl(...path: string[]) {
    return this.load(this.scriptsFolder, ...path);
  }

  static load(...path: string[]) {
    return readFileSync(resolve(...path), { encoding: 'utf-8' });
  }

  static get modsFolder() {
    const defaultLocation = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\A Dance of Fire and Ice\\Mods';

    return workspace
      .getConfiguration('intellioverlayer')
      .get<string>('modsFolder') ??
      defaultLocation;
  }

  static get scriptsFolder() {
    return resolve(this.modsFolder, 'Overlayer', 'Scripts');
  }
}

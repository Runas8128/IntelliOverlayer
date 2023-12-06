import { workspace } from 'vscode';
import { readFileSync } from 'fs';
import { resolve } from 'path';


export class FileLoader {
  private static _overlayerRoot?: string;
  private static _scriptsFolder?: string;

  static loadLocal(...path: string[]) {
    return this.load(__dirname, '..', ...path);
  }

  static loadOverlayer(...path: string[]) {
    return this.load(this.overlayerRoot, ...path);
  }

  static loadScripts(...path: string[]) {
    return this.load(this.scriptsFolder, ...path);
  }

  private static load(...path: string[]) {
    return readFileSync(resolve(...path), { encoding: 'utf-8' });
  }

  static get overlayerRoot() {
    if (!this._overlayerRoot) {
      const modsFolder = workspace
        .getConfiguration('intellioverlayer')
        .get<string>('modsFolder') ??
        'C:\\Program Files (x86)\\Steam\\steamapps\\common\\A Dance of Fire and Ice\\Mods';
      this._overlayerRoot = resolve(modsFolder, 'Overlayer');
    }
    return this._overlayerRoot;
  }

  static get scriptsFolder() {
    if (!this._scriptsFolder) {
      const info = JSON.parse(this.loadOverlayer('info.json'));

      const majorVersion = Number(info.Version.split('.')[0]);
      this._scriptsFolder = majorVersion <= 2 ?
        resolve(this.overlayerRoot, 'Scripts') :
        resolve(this.overlayerRoot, 'Modules', 'Scripting', 'Scripts');
    }
    return this._scriptsFolder;
  }
}

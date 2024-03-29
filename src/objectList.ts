import { readdirSync } from 'fs';
import { generate, parser } from 'peggy';

import { IObject } from './types';
import { FileLoader } from './fileLoader';
import { Logger } from './logger';

function isSyntaxError(e: unknown): e is parser.SyntaxError {
  return e instanceof Object &&
    'location' in e &&
    'expected' in e &&
    'found' in e;
};

export class ObjectList {
  private static _list: IObject[] = [];

  static get list() {
    return this._list;
  }

  static load() {
    Logger.log(`Loading impl.js contents...`);

    const parser = generate(FileLoader.loadLocal('peg', 'JS.peg')).parse;
    let success = 0, total = 0;

    for (const fName of readdirSync(FileLoader.scriptsFolder)) {
      if (fName === `Impl.js` || fName.endsWith(`_Proxy.js`)) {
        total++;
        if (this.parseFile(fName, parser)) { success++; }
      }
    }
    
    Logger.log(success + " / " + total + ` js files are loaded.`);
    Logger.log("Total loaded functions: " + ObjectList._list.length);
  }

  static parseFile(fName: string, parser: (_0: string) => any) {
    try {
      ObjectList._list.push(...parser(FileLoader.loadOverlayer('Scripts', fName)));
      Logger.log(`Loading ${fName} successed.`);
      return true;
    }
    catch (e) {
      Logger.log(`Loading ${fName} failed.`);
      if (isSyntaxError(e)) {
        const { start, end } = e.location;
        Logger.log(`Location: [(${start.line}, ${start.column}), (${end.line}, ${end.column})`);
        Logger.log(`Message: ${e.message}`);
      }
      return false;
    }
  }
}

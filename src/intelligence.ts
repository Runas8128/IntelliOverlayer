/**
 * Simple Code Suggester / Hover docs generator
 * 
 * Author: Runas
 */

import { readdirSync } from 'fs';
import { generate } from 'peggy';

import { IObject } from './types';
import {
  Lang,
  LOGGER, scriptsFolder,
  loadImpl, loadLocal, isSyntaxError,
} from './util';

export class Intelligence {
  static _pObj: { js: IObject[], py: IObject[] } = { js: [], py: [] };

  static init() {
    this._init('js', 'js');
    this._init('python', 'py');
  }

  static _init(related: string, extension: Lang) {
    LOGGER.appendLine(`Loading ${related} related contents...`);

    const { parse } = generate(loadLocal('peg', extension.toUpperCase() + '.peg'));
    let success = 0;

    const files = readdirSync(scriptsFolder)
      .filter(fName =>  fName === `Impl.${extension}` ||
                        fName.endsWith(`_Proxy.${extension}`));

    files.forEach(file => {
      try {
        Intelligence._pObj[extension].push(...parse(loadImpl(file)));
        LOGGER.appendLine("Loading " + file + " successed.");
        success++;
      }
      catch (e) {
        LOGGER.appendLine("Loading " + file + " failed.");
        if (isSyntaxError(e)) {
          LOGGER.appendLine(
            "Location: [(" + e.location.start.line + ", " + e.location.start.column + ')' + ", " + 
            '(' + e.location.end.line + ", " + e.location.end.column + ")]"
          );
          LOGGER.appendLine("Message: " + e);
        }
      }
    });
    
    LOGGER.appendLine(success + " / " + files.length + ` ${extension} files are loaded.`);
    LOGGER.appendLine("Total loaded functions: " + Intelligence._pObj[extension].length);
  }
}

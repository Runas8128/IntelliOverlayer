/**
 * Simple Code Suggester / Hover docs generator
 * 
 * Author: Runas
 */

import { readdirSync } from 'fs';
import { generate } from 'peggy';

import { IObject } from './types';
import {
  LOGGER, scriptsFolder,
  loadImpl, loadLocal, isSyntaxError,
} from './util';

export class Intelligence {
  static _pObj: IObject[] = [];

  static init() {
    LOGGER.appendLine(`Loading impl.js contents...`);

    const { parse } = generate(loadLocal('peg', 'JS.peg'));
    let success = 0;

    const files = readdirSync(scriptsFolder)
      .filter(fName =>  fName === `Impl.js` ||
                        fName.endsWith(`_Proxy.js`));

    files.forEach(file => {
      try {
        Intelligence._pObj.push(...parse(loadImpl(file)));
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
    
    LOGGER.appendLine(success + " / " + files.length + ` js files are loaded.`);
    LOGGER.appendLine("Total loaded functions: " + Intelligence._pObj.length);
  }
}

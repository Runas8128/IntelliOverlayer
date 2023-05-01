import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { generate } from 'peggy';
import { window, workspace } from "vscode";

export const LOGGER = window.createOutputChannel("IntelliOverlayer");

const modsFolder = workspace
  .getConfiguration('intellioverlayer')
  .get<string>('modsFolder') ??
'C:\\Program Files (x86)\\Steam\\steamapps\\common\\A Dance of Fire and Ice\\Mods';

const scriptsFolder = resolve(modsFolder, 'Overlayer', 'Scripts');

const load = (...path: string[]) => readFileSync(resolve(...path), { encoding: 'utf-8' });
const loadLocal = (...path: string[]) => load(__dirname, '..', ...path);
const loadImpl = (...path: string[]) => load(scriptsFolder, ...path);

type Arg = { name: string, type: string };
export type Function = { type: 'function', name: string, args: Arg[], returns: string };

export class Intelligence {
  static _pObj: { js: Function[], py: Function[] } = { js: [], py: [] };

  static init() {
    this._init('js', 'js');
    this._init('python', 'py');
  }

  static _init(related: string, extension: 'js' | 'py') {
    LOGGER.appendLine(`Loading ${related} related contents...`);

    const { parse } = generate(loadLocal('peg', extension.toUpperCase() + '.peg'));
    let success = 0;

    const files = readdirSync(scriptsFolder).filter(fName => fName.endsWith('.' + extension));

    files.forEach(file => {
      try {
        Intelligence._pObj[extension].push(...parse(loadImpl(file)));
        LOGGER.appendLine("Loading " + file + " successed.");
        success++;
      }
      catch (e) {
        LOGGER.appendLine("Loading " + file + " failed.");
      }
    });
    
    LOGGER.appendLine(success + " / " + files.length + ` ${extension} files are loaded.`);
    LOGGER.appendLine("Total loaded functions: " + Intelligence._pObj[extension].length);
  }

  static getObject(name: string, lang: 'js' | 'py') {
    LOGGER.appendLine("Getting object named " + name + " in " + lang);
    return Intelligence._pObj[lang].find(func => func.name === name);
  }

  static suggestObject(partialName: string, lang: 'js' | 'py') {
    LOGGER.appendLine("Suggesting object which name has " + partialName + " in " + lang);
    const result = Intelligence._pObj[lang]
      .filter(func => func.name.toLowerCase().includes(partialName.toLowerCase()));
    LOGGER.appendLine("Found " + result.length + " object starting with" + result[0]?.name);
    return result;
  }
}

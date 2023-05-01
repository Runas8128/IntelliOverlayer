import { readdirSync } from 'fs';
import { generate } from 'peggy';
import { Hover, MarkdownString } from "vscode";

import { Function } from './types';
import { LOGGER, loadImpl, loadLocal, obj2comp, obj2hoverStr, scriptsFolder } from './util';

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

export const getSuggest = (lang: 'js' | 'py') =>
  async (name: string) =>
    Intelligence
      .suggestObject(name, lang)
      .map(obj => obj2comp[obj.type](obj));

export const getHover = (lang: 'js' | 'py') =>
  async (name: string) => {
    const obj = Intelligence.getObject(name, lang);
    if (!obj) { return; }

    const mdStr = new MarkdownString();
    mdStr.supportHtml = true;
    mdStr.appendCodeblock(
      obj2hoverStr[obj.type](obj, lang),
      lang === 'js' ? 'typescript' : 'python'
    );
    return new Hover(mdStr);
  };

/**
 * Simple Code Suggester / Hover docs generator
 * 
 * Author: Runas
 */

import { readdirSync } from 'fs';
import { generate } from 'peggy';
import { Hover, MarkdownString } from "vscode";

import { IObject, isClass, isFunction } from './types';
import {
  Lang,
  LOGGER, scriptsFolder,
  loadImpl, loadLocal, isSyntaxError,
  obj2comp, obj2hoverStr,
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

    const files = readdirSync(scriptsFolder).filter(fName => fName.endsWith('.' + extension));

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

class IGetter {
  full: string;
  parentToken: string[];
  mainToken: string;
  lang: Lang;
  globals: IObject[];

  constructor(name: string, lang: Lang) {
    this.full = name;
    this.parentToken = name.split('.');
    this.mainToken = this.parentToken.pop() || '';
    this.lang = lang;
    this.globals = Intelligence._pObj[lang];
  }

  get suggest() {
    if (this.mainToken === '') { return []; }

    const result = this.globals
      .filter(obj => obj.name.toLowerCase().includes(this.mainToken.toLowerCase()));

    const parent = this.parent;
    if (parent && isClass(parent)) {
      result.push(
        ...parent.fields.filter(f => f.name.toLowerCase().includes(this.mainToken.toLowerCase())),
        ...parent.methods.filter(m => m.name.toLowerCase().includes(this.mainToken.toLowerCase())),
      );
    }

    return result;
  }

  get object() {
    return this._getObject(this.mainToken, this.parent);
  }

  get parent() : IObject | undefined {
    let parent : IObject | undefined = undefined;
    this.parentToken.forEach(token => { parent = this._getObject(token, parent); });
    return parent;
  }

  _getObject(token: string, parent: IObject | undefined = undefined) : IObject | undefined {
    if (parent && isClass(parent)) {
      const field = parent.fields.find(f => f.name === token);
      if (field) { return field; }

      const method = parent.methods.find(m => m.name === token);
      if (method) { return method; }
    }

    // Default: find in global namespace
    return this.globals.find(o => o.name === token);
  }
}

export const getSuggest = (lang: Lang) =>
  async (name: string) =>
    new IGetter(name, lang).suggest
      .map(obj => obj2comp[obj.type](obj));

export const getHover = (lang: Lang) =>
  async (name: string) => {
    const obj = new IGetter(name, lang).object;
    if (obj) { return generateHoverDoc(obj, lang); }
  };

const generateHoverDoc = (obj: IObject, lang: Lang) => {
  const mdStr = new MarkdownString();
  mdStr.supportHtml = true;
  
  mdStr.appendCodeblock(
    obj2hoverStr[obj.type](obj, lang),
    lang === 'js' ? 'typescript' : 'python'
  );

  if (isFunction(obj) && obj.comment.length > 0) {
    mdStr.appendMarkdown(obj.comment);
  }
  
  return new Hover(mdStr);
};

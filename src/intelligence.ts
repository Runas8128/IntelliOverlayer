/**
 * Simple Code Suggester / Hover docs generator
 * 
 * Author: Runas
 */

import { readdirSync } from 'fs';
import { generate, parser } from 'peggy';
import { Hover, MarkdownString } from "vscode";

import { Class, IObject } from './types';
import { LOGGER, loadImpl, loadLocal, obj2comp, obj2hoverStr, scriptsFolder } from './util';

const isSyntaxError = (e: unknown): e is parser.SyntaxError => (
  e instanceof Object &&
  'location' in e &&
  'expected' in e &&
  'found' in e
);

type Lang = 'js' | 'py';

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

  static getObject(name: string, lang: Lang) {
    LOGGER.appendLine("Getting object named " + name + " in " + lang);
    return Intelligence._pObj[lang].find(func => func.name === name);
  }

  static suggestObject(partialName: string, lang: Lang) {
    LOGGER.appendLine("Suggesting object which name has " + partialName + " in " + lang);
    
    const result = Intelligence._pObj[lang]
      .filter(func => func.name.toLowerCase().includes(partialName.toLowerCase()));
    LOGGER.appendLine("Found " + result.length + " object starting with" + result[0]?.name);
    return result;
  }

  static _getObject(name: string, parent: IObject | undefined = undefined) : IObject | undefined {
    if (!parent || !isClass(parent)) { return; }

    const field = parent.fields.find(field => field.name === name);
    if (field) { return field; }

    const method = parent.methods.find(method => method.name === name);
    if (method) { return method; }
  }

  static getObjRec(name: string, lang: Lang) : IObject | undefined {
    if (name === '') { return undefined; } // string literal length is 0

    const ls = name.split('.');
    const first = ls.shift(), last = ls.pop();
    if (!first) { return undefined; } // Length is 0

    let parent : IObject | undefined = this.getObject(first, lang);
    if (!last) { return parent; } // Length is 1

    ls.forEach(elem => parent = this._getObject(elem, parent));
    if (parent && isClass(parent)) { return this._getObject(last, parent); }

    return undefined; // Nothing found
  }
}

function isClass(obj: IObject) : obj is Class {
  return obj.type === 'class';
}

export const getSuggest = (lang: Lang) =>
  async (name: string) =>
    Intelligence
      .suggestObject(name, lang)
      .map(obj => obj2comp[obj.type](obj));

export const getHover = (lang: Lang) =>
  async (name: string) => {
    const obj = Intelligence.getObjRec(name, lang);
    if (!obj) { return; }

    const mdStr = new MarkdownString();
    mdStr.supportHtml = true;
    mdStr.appendCodeblock(
      obj2hoverStr[obj.type](obj, lang),
      lang === 'js' ? 'typescript' : 'python'
    );
    return new Hover(mdStr);
  };

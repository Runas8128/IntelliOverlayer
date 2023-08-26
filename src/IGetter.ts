import { IObject, isClass, isFunction } from './types';
import { Lang, obj2comp, obj2hoverStr } from './util';
import { Intelligence } from './intelligence';
import { Hover, MarkdownString } from 'vscode';

export class IGetter {
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
        ...parent.methods.filter(m => m.name.toLowerCase().includes(this.mainToken.toLowerCase()))
      );
    }

    return result;
  }

  get object() {
    return this._getObject(this.mainToken, this.parent);
  }

  get parent(): IObject | undefined {
    let parent: IObject | undefined = undefined;
    this.parentToken.forEach(token => { parent = this._getObject(token, parent); });
    return parent;
  }

  _getObject(token: string, parent: IObject | undefined = undefined): IObject | undefined {
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

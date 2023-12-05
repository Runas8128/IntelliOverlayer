import { IObject, isClass } from './types';
import { ObjectList } from './objectList';

const _isSimilar = (target: IObject, keyword: string) =>
  target.name.toLowerCase().includes(keyword.toLowerCase());

const bind = <T1, T2, R>(callback: (_0: T1, _1: T2) => R, bindArg: T2) =>
  (restArg: T1) => callback(restArg, bindArg);

export class Tokenizer {
  full: string;
  parentToken?: string;
  mainToken: string;

  constructor(token: string) {
    this.full = token;

    const dotIndex = token.lastIndexOf('.');
    if (dotIndex === -1) {
      this.mainToken = token;
    } else {
      this.parentToken = token.substring(0, dotIndex);
      this.mainToken = token.substring(dotIndex);
    }
  }

  get suggest() {
    const isSimilar = bind(_isSimilar, this.mainToken);

    const result = ObjectList.list.filter(isSimilar);

    const parent = this.parent;
    if (parent && isClass(parent)) {
      result.push(
        ...parent.fields.filter(isSimilar),
        ...parent.methods.filter(isSimilar)
      );
    }

    return result;
  }

  get object() {
    return this._getObject(this.mainToken, this.parent);
  }

  get parent(): IObject | undefined {
    return this.parentToken ? this._getObject(this.parentToken) : undefined;
  }

  _getObject(token: string, parent: IObject | undefined = undefined): IObject | undefined {
    if (parent) {
      if (isClass(parent)) {
        const field = parent.fields.find(f => f.name === token);
        if (field) { return field; }
  
        const method = parent.methods.find(m => m.name === token);
        if (method) { return method; }
      }
      // TODO: check if parent is variable and it's type can be found in ObjectList
    }

    // Default: find in global namespace
    return ObjectList.list.find(o => o.name === token);
  }
}

import { IObject, isClass } from './types';
import { ObjectList } from './objectList';

export class IGetter {
  full: string;
  parentToken: string[];
  mainToken: string;
  globals: IObject[];

  constructor(name: string) {
    this.full = name;
    this.parentToken = name.split('.');
    this.mainToken = this.parentToken.pop() || '';
    this.globals = ObjectList.list;
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

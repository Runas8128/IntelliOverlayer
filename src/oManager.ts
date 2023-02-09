import { readFileSync } from 'fs';
import { resolve } from 'path';

import { CompletionItem, Hover, MarkdownString, Position, TextDocument, workspace } from 'vscode';
import { OClass, OConstructor, OEnum, OEnumMember, OFunction, OObject, OVariable } from './types';

function isCustomTag() {
  const workspaceFolder = workspace
    .getConfiguration('intellioverlayer')
    .get<string[]>('workspaceFolder');

  return workspaceFolder?.includes(workspace.name ?? '');
}

export default class Manager {
  static list: Array<OObject> = [];

  static async suggest(d: TextDocument, p: Position): Promise<CompletionItem[]> {
    // ignore non-overlayer workspace
    if (!isCustomTag()) { return []; }
  
    const wordProvider = new WordProvider(d, p);
    let target = wordProvider.getWord(/[A-Za-z]+\.?/),
        targetObjs: OObject[];
    if (!target) { return []; }
  
    if (!target.endsWith('.')) {
      // General object completion
      targetObjs = Manager.list
        .filter(obj => obj.name.toLowerCase().includes(target!.toLowerCase()));
    }
    else {
      // Member object completion
      if (target === 'tiles.') { target = 'Tiles.'; }
      const parent = Manager.list.find(obj => obj.name + '.' === target);
  
      targetObjs = parent instanceof OClass
        ? parent.member
        : parent instanceof OEnum
          ? parent.vars
          : []; // if targetObj is none of them, there is no member below it
    }
  
    return targetObjs.map(obj => obj.toCompletionItem({ position: p }));
  }

  static async getHover(d: TextDocument, p: Position): Promise<Hover | undefined> {
    // ignore non-overlayer workspace
    if (!isCustomTag()) { return; }
    
    let parentObj: OObject | undefined, targetObj: OObject | undefined;
    const wordProvider = new WordProvider(d, p);

    const localObj = wordProvider.local;
    if (localObj) {
      // target is Member object
      if (localObj[0] === 'tiles') { localObj[0] = 'Tiles'; }
      parentObj = Manager.find(localObj[0]);
      if (parentObj instanceof OClass) {
        targetObj = parentObj.member.find(obj => obj.name === localObj[1]);
      }
    }
    else {
      // target is Global object
      targetObj = Manager.find(wordProvider.global);
      if (targetObj instanceof OClass && wordProvider.isStrictlyFunc) {
        targetObj = targetObj.member.find(obj => obj instanceof OConstructor);
      }
    }

    if (!targetObj) { return; }

    const text = targetObj.toHoverDesc({ parent: parentObj });
    const mdStr = new MarkdownString();
    mdStr.supportHtml = true;
    mdStr.appendCodeblock(text || '', 'typescript');
    mdStr.appendCodeblock(targetObj?.desc || '', 'typescript');

    return new Hover(mdStr);
  }

  static find = (name?: string) => Manager.list.find(obj => obj.name === name);

  static init() {
    const data = readFileSync(resolve(__dirname, '..', 'tags.json'), { encoding: 'utf-8' });
    const payloads = JSON.parse(data);
    Manager.list = payloads.map((payload: OPayload) => parsePayload(payload));
  }
}

type OPayload = {
  name: string;
  desc?: string;
  type?: string;
  value?: number;
  vars?: OPayload[];
  args?: OPayload[];
  retType?: string;
  member?: OPayload[];
};

function parsePayload(payload: OPayload, parent?: OPayload): OObject {
  if (payload.type !== undefined) {
    return new OVariable(payload.name, payload.type, payload.desc);
  } else if (payload.value !== undefined) {
    return new OEnumMember(payload.name, payload.value);
  } else if (payload.vars !== undefined) {
    return new OEnum(
      payload.name,
      payload.vars
        .map(vari =>parsePayload(vari, payload))
        .filter((payload: OPayload): payload is OEnumMember => payload.value !== undefined),
      payload.desc);
  } else if (payload.args !== undefined && payload.retType !== undefined) {
    const args = payload.args
      .map(arg => parsePayload(arg, payload))
      .filter((payload: OPayload): payload is OVariable => payload.type !== undefined);

    if (parent?.name === payload.name) { // constructor
      return new OConstructor(payload.name, args, payload.desc);
    }
    else { // general function
      return new OFunction(payload.name, args, payload.retType, payload.desc);
    }
  } else if (payload.member !== undefined) {
    return new OClass(
      payload.name,
      payload.member
        .map(mem => parsePayload(mem, payload)),
      payload.desc);
  } else {
    throw new Error(`What the hell is this payload?!\npayload = ${payload}`);
  }
}

class WordProvider {
  d: TextDocument;
  p: Position;

  constructor(d: TextDocument, p: Position) {
    this.d = d;
    this.p = p;
  }

  getWord(regex?: RegExp): string | undefined {
    const range = this.d.getWordRangeAtPosition(this.p, regex);
    return range ? this.d.getText(range) : undefined;
  }

  get local() {
    let target = this.getWord( /\.[A-Za-z]+/ );
    if (!target) {
      // target is not a member object
      return;
    }

    const full = this.getWord( /[A-Za-z]+.[A-Za-z]+/ );
    if (!full) {
      // cannot find parent object
      return [undefined, target];
    }

    return full.split('.'); // target === _member
  }

  get global() {
    return this.getWord( /[A-Za-z]+/ );
  }

  get isStrictlyFunc() {
    return this.getWord( /[A-Za-z]+\(/ ) !== undefined;
  }
}

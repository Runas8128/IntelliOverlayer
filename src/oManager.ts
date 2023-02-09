/**
 * Overlayer IntelliCode Extension
 * 
 * author: Runas
 */

import { CompletionItem, Hover, MarkdownString, Position, TextDocument, workspace } from 'vscode';
import * as payload from './payload';
import { OClass, OConstructor, OEnum, OObject } from './types';
import { WordProvider } from './WordProvider';

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
    Manager.list = [];

    // Load tags
    ['adofai.gg', 'color', 'hardware', 'judgement', 'other', 'play', 'time']
      .map(tagClass => payload.load('Tags', tagClass + 'json'))
      .forEach(tags => Manager.list.push(...tags));
    
    // Load classes and enums
    Manager.list.push(
      ...payload.load('Classes.json'),
      ...payload.load('Enums.json'),
    );
  }
}

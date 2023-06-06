/**
 * Utils for IntelliOverlayer logics
 *
 * author: Runas
 */

import {
  SnippetString, CompletionItem, CompletionItemKind,
  Position, TextDocument, workspace, window
} from 'vscode';

import { Class, Function } from './types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export const LOGGER = window.createOutputChannel("IntelliOverlayer");

const modsFolder = workspace
  .getConfiguration('intellioverlayer')
  .get<string>('modsFolder') ??
'C:\\Program Files (x86)\\Steam\\steamapps\\common\\A Dance of Fire and Ice\\Mods';

export const scriptsFolder = resolve(modsFolder, 'Overlayer', 'Scripts');

const load = (...path: string[]) => readFileSync(resolve(...path), { encoding: 'utf-8' });
export const loadLocal = (...path: string[]) => load(__dirname, '..', ...path);
export const loadImpl = (...path: string[]) => load(scriptsFolder, ...path);

export const obj2comp: { [key: string]: (_: any) => CompletionItem } = {
  'function': ({ name, args }: Function) => ({
    label: name,
    insertText: new SnippetString(
      name + `(`
        + args
          .map((arg, index) => `$\{${index + 1}:${arg.name}\}`)
          .join(', ')
        + ')$0'
    ),
    kind: CompletionItemKind.Function,
  }),
  'class': ({ name }: Class) => ({
    label: name,
    kind: CompletionItemKind.Class,
  }),
};

export const obj2hoverStr: { [key: string]: (_0: any, _1: 'js' | 'py') => string } = {
  'function': ({ name, args, returns }: Function, lang: 'js' | 'py') =>
    (lang === 'js' ? '(function) ' : 'def ')
      + name + '('
      + args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
      + ')'
      + (lang === 'js' ? ': ' : ' -> ')
      + returns,
  'class': ({ name }: Class, lang: 'js' | 'py') =>
    (lang === 'js' ? 'class ' : '(class) ')
     + name
};

const isCustomTag = () =>
  workspace
    .getConfiguration('intellioverlayer')
    .get<string[]>('workspaceFolder')
    ?.includes(workspace.name ?? '');

export const consume = <T>(callback: (_: string) => Promise<T>, _default: T) =>
  async (d: TextDocument, p: Position) => {
    let range;
    return isCustomTag() && (range = d.getWordRangeAtPosition(p))
      ? callback(d.getText(range))
      : _default;
  };

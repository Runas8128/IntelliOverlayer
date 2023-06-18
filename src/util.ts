/**
 * Utils for IntelliOverlayer logics
 *
 * author: Runas
 */

import {
  SnippetString, CompletionItem, CompletionItemKind,
  Position, TextDocument, workspace, window
} from 'vscode';
import { parser } from 'peggy';

import { Class, Function, Variable, isField, isMethod } from './types';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export type Lang = 'js' | 'py';

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
  'function': (obj: Function) => ({
    label: obj.name,
    insertText: new SnippetString(
      obj.name + `(`
        + obj.args
          .map((arg, index) => `$\{${index + 1}:${arg.name}\}`)
          .join(', ')
        + ')$0'
    ),
    kind: isMethod(obj) ? CompletionItemKind.Method : CompletionItemKind.Function,
  }),
  'class': ({ name }: Class) => ({
    label: name,
    kind: CompletionItemKind.Class,
  }),
  'variable': (obj: Variable) => ({
    label: obj.name,
    kind: isField(obj) ? CompletionItemKind.Field : CompletionItemKind.Variable,
  }),
};

export const obj2hoverStr: { [key: string]: (_0: any, _1: Lang) => string } = {
  'function': (obj: Function, lang: Lang) =>
    (isMethod(obj) ? '(method) ' : (lang === 'js' ? '(function) ' : 'def '))
      + obj.name + '('
      + obj.args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
      + ')'
      + (lang === 'js' ? ': ' : ' -> ')
      + obj.returns,
  'class': ({ name }: Class, lang: Lang) =>
    (lang === 'js' ? 'class ' : '(class) ')
     + name,
  'variable': (obj: Variable, lang: Lang) =>
    (lang === 'py' ? '(variable) ' : 'const ')
     + obj.name + ': ' + obj.varType,
};

export const isSyntaxError = (e: unknown): e is parser.SyntaxError => (
  e instanceof Object &&
  'location' in e &&
  'expected' in e &&
  'found' in e
);

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

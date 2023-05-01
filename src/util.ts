/**
 * Simple utils including Code Suggester / Hover docs generator wrappers
 *
 * author: Runas
 */

import {
  SnippetString, CompletionItem, CompletionItemKind,
  Hover, MarkdownString,
  Position, TextDocument, workspace
} from 'vscode';

import { Function, Intelligence } from './intelligence';

const obj2comp: { [key: string]: (_: any) => CompletionItem } = {
  'function': ({ name, args }: Function) => ({
    label: name,
    insertText: new SnippetString(
      name + `(`
        + args
          .map((arg, index) => `$\{${index + 1}:${arg.name}\}`)
          .join(', ')
        + ')$0'
    ),
    sortText: name,
    kind: CompletionItemKind.Function,
  }),
};

const obj2hoverStr: { [key: string]: (_0: any, _1: 'js' | 'py') => string } = {
  'function': ({ name, args, returns }: Function, lang: 'js' | 'py') =>
    (lang === 'js' ? '(function) ' : 'def ')
      + name + '('
      + args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
      + ')'
      + (lang === 'js' ? ': ' : ' -> ')
      + returns,
};

export const getSuggest = (lang: 'js' | 'py') =>
  async (name: string) : Promise<CompletionItem[]> =>
    Intelligence
      .suggestObject(name, lang)
      .map(obj => obj2comp[obj.type](obj));

export const getHover = (lang: 'js' | 'py') =>
  async (name: string) : Promise<Hover | undefined> => {
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

import { isFunction } from './types';
import { completionItemGenerator, hoverDocsGenerator } from './generator';
import { Hover, MarkdownString, Position, TextDocument, workspace } from 'vscode';
import { Tokenizer } from './tokenizer';


export const getSuggest = async (name: string) => new Tokenizer(name).suggest
  .map(obj => completionItemGenerator[obj.type](obj));

export const getHover = async (name: string) => {
  const obj = new Tokenizer(name).object;
  if (!obj) { return undefined; }

  const mdStr = new MarkdownString();
  mdStr.supportHtml = true;

  mdStr.appendCodeblock(hoverDocsGenerator[obj.type](obj), 'typescript');

  if (isFunction(obj) && obj.comment.length > 0) {
    mdStr.appendMarkdown(obj.comment);
  }

  return new Hover(mdStr);
};

export function consume<T>(callback: (_: string) => Promise<T>, _default: T) {
  return async (d: TextDocument, p: Position) => {
    const workspaceFolder = workspace
      .getConfiguration('intellioverlayer')
      .get<string[]>('workspaceFolder');

    if (workspaceFolder?.includes(workspace.name ?? '')) {
      const range = d.getWordRangeAtPosition(p);
      return range ? callback(d.getText(range)) : _default;
    }
    else {
      return _default;
    }
  };
}

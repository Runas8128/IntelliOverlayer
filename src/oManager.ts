/**
 * Object Manager that provides Suggestion and Hover documentation
 *
 * author: Runas
 */

import { CompletionItem, Hover, Position, TextDocument, workspace } from 'vscode';
import { getHover, getSuggest } from "./intelligence";

const isCustomTag = () => workspace
  .getConfiguration('intellioverlayer')
  .get<string[]>('workspaceFolder')
  ?.includes(workspace.name ?? '');

export const suggest = (lang: 'js' | 'py') => async (d: TextDocument, p: Position)
  : Promise<CompletionItem[]> => {
  let range;
  return isCustomTag() && (range = d.getWordRangeAtPosition(p))
    ? getSuggest(d.getText(range), lang)
    : [];
};

export const hover = (lang: 'js' | 'py') => async (d: TextDocument, p: Position)
  : Promise<Hover | undefined> => {
  let range;
  return isCustomTag() && (range = d.getWordRangeAtPosition(p))
    ? getHover(d.getText(range), lang)
    : undefined;
};

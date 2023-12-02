import { SnippetString, CompletionItem, CompletionItemKind } from 'vscode';

import { Class, Function, Variable, isField, isMethod } from './types';

export const completionItemGenerator: { [key: string]: (_: any) => CompletionItem } = {
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

export const hoverDocsGenerator: { [key: string]: (_0: any) => string } = {
  'function': (obj: Function) =>
    (isMethod(obj) ? '(method) ' : '(function) ')
      + obj.name + '('
      + obj.args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
      + '): '
      + obj.returns,
  'class': ({ name }: Class) => 'class ' + name,
  'variable': (obj: Variable) => 'const ' + obj.name + ': ' + obj.varType,
};

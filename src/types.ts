/**
 * Overlayer IntelliCode Extension
 * 
 * author: Runas
 */

import {
  CompletionItemKind,
  CompletionItem, Position, Range, SnippetString, TextEdit,
} from "vscode";

export class OObject {
  name: string;
  desc: string;

  constructor(name: string, desc: string = '') {
    this.name = name;
    this.desc = desc;
  }

  toCompletionItem(_?: object): CompletionItem {
    throw Error("Not Implemented");
  }

  toHoverDesc(_?: object): string {
    throw new Error('not implemented');
  }
}

export class OVariable extends OObject {
  type: string;

  constructor(name: string, type: string, desc: string = '') {
    super(name, desc);
    this.type = type;
  }

  toCompletionItem(): CompletionItem {
    return {
      label: this.name,
      sortText: '!' + this.name,
      kind: CompletionItemKind.Variable,
    };
  }

  toHoverDesc({ isParam, parent }: { isParam?: boolean, parent?: OClass }): string {
    const tag = parent
      ? `(property) ${parent.name}.`
      : isParam === true
        ? ''
        : 'var ';
    return tag + this.name + ': ' + this.type;
  }
}

export class OEnumMember extends OObject {
  value: number;

  constructor(name: string, value: number) {
    super(name);
    this.value = value;
  }

  toCompletionItem(): CompletionItem {
    return {
      label: this.name,
      sortText: '!' + this.name,
      kind: CompletionItemKind.EnumMember,
    };
  }

  toHoverDesc({ parent }: { parent?: OEnum }): string {
    return '(Enum Member) ' + parent!.name + '.' + this.name;
  }
}

export class OEnum extends OObject {
  vars: Array<OEnumMember>;

  constructor(name: string, vars: Array<OEnumMember>, desc: string = '') {
    super(name, desc);
    this.vars = vars;
  }

  toCompletionItem(): CompletionItem {
    return {
      label: this.name,
      insertText: this.name + '.',
      sortText: '!' + this.name,
      kind: CompletionItemKind.Enum,
      command: {
        title: 'Trigger Suggest',
        command: 'editor.action.triggerSuggest',
      },
    };
  }

  toHoverDesc(): string {
    return '(Enum) ' + this.name;
  }
}

export class OFunction extends OObject {
  args: Array<OVariable>;
  retType: string;

  constructor(name: string, args: Array<OVariable>, retType: string, desc: string = '') {
    super(name, desc);
    this.args = args;
    this.retType = retType;
  }

  toCompletionItem(_?: object): CompletionItem {
    const args = this.args
      .map((arg, index) => `$\{${index + 1}:${arg.name}\}`).join(', ');

    return {
      label: this.name,
      insertText: new SnippetString(`${this.name}(${args})$0`),
      sortText: '!' + this.name,
      kind: CompletionItemKind.Function,
      command: {
        title: 'Show Hover documentation',
        command: 'editor.action.showHover',
      }
    };
  }

  toHoverDesc({ parent }: { parent?: OClass }): string {
    const args = this.args.map(arg => arg.toHoverDesc({ isParam: true })).join(', ');
    const tag = parent ? `(method) ${parent.name}.` : '(function) ';

    return tag + this.name + '(' + args + '): ' + this.retType;
  }
}

export class OConstructor extends OFunction {
  constructor(name: string, args: Array<OVariable>, desc: string = '') {
    super(name, args, name, desc);
  }

  toCompletionItem({ position }: { position: Position }): CompletionItem {
    const superItem = super.toCompletionItem(position);
    superItem.label = 'constructor';
    superItem.sortText = '!' + superItem.sortText;

    const range = new Range(
      position.line, position.character - 1 - this.name.length,
      position.line, position.character
    );
    superItem.additionalTextEdits = [
      TextEdit.delete(range),
    ];
    return superItem;
  }

  toHoverDesc({ parent }: { parent?: OClass }): string {
    return super.toHoverDesc({ parent }).replace('method', 'ctor');
  }
}

export class OClass extends OObject {
  member: Array<OObject>;

  constructor(name: string, member: Array<OObject>, desc: string = '') {
    super(name, desc);
    this.member = member;
  }

  toCompletionItem(): CompletionItem {
    return {
      label: this.name,
      insertText: this.name,
      sortText: '!' + this.name,
      kind: CompletionItemKind.Class,
    };
  }

  toHoverDesc(): string {
    return `(class) ${this.name}`;
  }
}

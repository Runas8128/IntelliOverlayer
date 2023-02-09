import { Position, TextDocument } from 'vscode';

export class WordProvider {
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
    let target = this.getWord(/\.[A-Za-z]+/);
    if (!target) {
      // target is not a member object
      return;
    }

    const full = this.getWord(/[A-Za-z]+.[A-Za-z]+/);
    if (!full) {
      // cannot find parent object
      return [undefined, target];
    }

    return full.split('.'); // target === _member
  }

  get global() {
    return this.getWord(/[A-Za-z]+/);
  }

  get isStrictlyFunc() {
    return this.getWord(/[A-Za-z]+\(/) !== undefined;
  }
}

import { OutputChannel, window } from 'vscode';

export class Logger {
  private static logger?: OutputChannel;

  static log(content: string) {
    if (!this.logger) {
      this.logger = window.createOutputChannel("IntelliOverlayer");
    }

    this.logger.appendLine(content);
  }
}

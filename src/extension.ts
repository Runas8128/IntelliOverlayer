/**
 * IntelliOverlayer: Extension for Overlayer IntelliCode
 *
 * author: Runas
 */

import { languages, ExtensionContext } from 'vscode';
import { Intelligence } from "./intelligence";
import { getHover, getSuggest } from './IGetter';
import { consume } from './util';

// On Activated
export function activate(context: ExtensionContext) {
  Intelligence.init();

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      { language: 'javascript', scheme: 'file', },
      { provideCompletionItems: consume(getSuggest, []) },
    ),
    languages.registerHoverProvider(
      { language: 'javascript', scheme: 'file', },
      { provideHover: consume(getHover, undefined) },
    ),
  );
}

// On Deactivated
export function deactivate() {}

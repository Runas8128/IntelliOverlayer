/**
 * IntelliOverlayer: Extension for Overlayer IntelliCode
 *
 * author: Runas
 */

import { languages, ExtensionContext } from 'vscode';
import { suggest, hover } from './oManager';
import { Intelligence } from "./intelligence";

// On Activated
export function activate(context: ExtensionContext) {
  Intelligence.init();

  context.subscriptions.push(
    languages.registerCompletionItemProvider(
      { language: 'javascript', scheme: 'file', },
      { provideCompletionItems: suggest('js') },
    ),
    languages.registerCompletionItemProvider(
      { language: 'python', scheme: 'file', },
      { provideCompletionItems: suggest('py') },
    ),
    languages.registerHoverProvider(
      { language: 'javascript', scheme: 'file', },
      { provideHover: hover('js') },
    ),
    languages.registerHoverProvider(
      { language: 'python', scheme: 'file', },
      { provideHover: hover('py') },
    ),
  );
}

// On Deactivated
export function deactivate() {}

/**
 * IntelliOverlayer: Extension for Overlayer IntelliCode
 * 
 * author: Runas
 */

import { languages, ExtensionContext } from 'vscode';
import Manager from './oManager';


// On Activated
export function activate(context: ExtensionContext) {
  Manager.init();
  
	context.subscriptions.push(
    languages.registerCompletionItemProvider(
      { language: 'javascript', scheme: 'file', },
      { provideCompletionItems: Manager.suggest },
      '.',
    ),
  );

  context.subscriptions.push(
    languages.registerHoverProvider(
      { language: 'javascript', scheme: 'file', },
      { provideHover: Manager.getHover }
    ),
  );
}

// On Deactivated
export function deactivate() {}

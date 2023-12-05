import { languages, ExtensionContext } from 'vscode';
import { ObjectList } from "./objectList";
import { getHover, getSuggest, consume } from './provider';

// On Activated
export function activate(context: ExtensionContext) {
  ObjectList.load();

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

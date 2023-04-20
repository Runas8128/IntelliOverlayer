import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import * as peggy from 'peggy';
import { CompletionItem, CompletionItemKind, Hover, MarkdownString, SnippetString, window, workspace } from "vscode";

export const LOGGER = window.createOutputChannel("IntelliOverlayer");

const modsFolder = workspace
  .getConfiguration('intellioverlayer')
  .get<string>('modsFolder') ??
'C:\\Program Files (x86)\\Steam\\steamapps\\common\\A Dance of Fire and Ice\\Mods';

const scriptsFolder = resolve(modsFolder, 'Overlayer', 'Scripts');

const load = (...path: string[]) => readFileSync(resolve(...path), { encoding: 'utf-8' });
const loadLocal = (...path: string[]) => load(__dirname, '..', ...path);
const loadImpl = (...path: string[]) => load(scriptsFolder, ...path);

type Arg = { name: string, type: string };
type Function = { type: 'function', name: string, args: Arg[], returns: string };

export class Intelligence {
  static _pObj: { js: Function[], py: Function[] } = { js: [], py: [] };
  static init() {
    LOGGER.appendLine("Loading js related contents...");
    const JS_Parser = peggy.generate(loadLocal('peg', 'JS.peg'));
    let total = 0, success = 0;
    for (const file of readdirSync(scriptsFolder).filter(fname => fname.endsWith('.js'))) {
      total++;
      try {
        Intelligence._pObj.js.push(...JS_Parser.parse(loadImpl(file)));
        LOGGER.appendLine("Loading " + file + " successed. ");
        success++;
      }
      catch (e) {
        LOGGER.appendLine("Loading " + file + " failed. ");
      }
    }
    LOGGER.appendLine(success + " / " + total + " js files are loaded.");
    LOGGER.appendLine("Total loaded functions: " + Intelligence._pObj.js.length);

    LOGGER.appendLine("Loading python related contents...");
    const PY_Parser = peggy.generate(loadLocal('peg', 'PY.peg'));
    total = 0; success = 0;
    for (const file of readdirSync(scriptsFolder).filter(fname => fname.endsWith('.py'))) {
      total++;
      try {
        Intelligence._pObj.py.push(...PY_Parser.parse(loadImpl(file)));
        LOGGER.appendLine("Loading " + file + " successed. ");
        success++;
      }
      catch (e) {
        LOGGER.appendLine("Loading " + file + " failed: " + e);
      }
    }
    LOGGER.appendLine(success + " / " + total + " js files are loaded.");
    LOGGER.appendLine("Total loaded functions: " + Intelligence._pObj.py.length);
  }

  static getObject(name: string, lang: 'js' | 'py') {
    LOGGER.appendLine("Getting object named " + name + " in " + lang);
    return Intelligence._pObj[lang].find(func => func.name === name);
  }

  static suggestObject(partialName: string, lang: 'js' | 'py') {
    LOGGER.appendLine("Suggesting object which name has " + partialName + " in " + lang);
    return Intelligence._pObj[lang].filter(func => func.name.includes(partialName));
  }
}

const obj2comp: { [key: string]: (_: any) => CompletionItem } = {
  'function': ({ name, args }: Function) => ({
    label: name,
    insertText: new SnippetString(
      name + `(`
        + args
          .map((arg, index) => `$\{${index + 1}:${arg.name}\}`)
          .join(', ')
        + ')$0'
    ),
    sortText: '!' + name,
    kind: CompletionItemKind.Function,
  }),
};

const obj2hoverStr: { [key: string]: (_0: any, _1: 'js' | 'py') => string } = {
  'function': ({ name, args, returns }: Function, lang: 'js' | 'py') =>
    (lang === 'js' ? '(function) ' : 'def ')
      + name + '('
      + args.map(arg => `${arg.name}: ${arg.type}`).join(', ')
      + ')'
      + (lang === 'js' ? ': ' : ' -> ')
      + returns,
};

export const getSuggest = async (name: string, lang: 'js' | 'py')
  : Promise<CompletionItem[]> => Intelligence
    .suggestObject(name, lang)
    .map(obj => obj2comp[obj.type](obj));

export const getHover = async (name: string, lang: 'js' | 'py')
  : Promise<Hover | undefined> => {
  const obj = Intelligence.getObject(name, lang);
  if (!obj) { return; }

  const mdStr = new MarkdownString();
  mdStr.supportHtml = true;
  mdStr.appendCodeblock(obj2hoverStr[obj.type](obj, lang), lang === 'js' ? 'typescript' : 'python');
  return new Hover(mdStr);
};

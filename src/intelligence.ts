import { readFileSync } from 'fs';
import * as peggy from 'peggy';
import { CompletionItem, CompletionItemKind, Hover, MarkdownString, SnippetString } from "vscode";

const load = (fName: string) => readFileSync(fName, { encoding: 'utf-8' });

type Arg = { name: string, type: string };
type Function = { type: 'function', name: string, args: Arg[] };

class Intelligence {
    static _pObj: { js: Function[], py: Function[] } = { js: [], py: [] };
    static init() {
        Intelligence._pObj.js = peggy.generate(load('./peg/JS.peg')).parse(load('./peg/Impl.js'));
        Intelligence._pObj.py = peggy.generate(load('./peg/PY.peg')).parse(load('./peg/Impl.py'));
    }

    static getObject(name: string, lang: 'js' | 'py') {
        return Intelligence._pObj[lang].find(func => func.name === name);
    }

    static suggestObject(partialName: string, lang: 'js' | 'py') {
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

const obj2hoverStr: { [key: string]: (_: any) => string } = {
    'function': ({ name, args }: Function) => {
        const argStr = args.map(arg => `${arg.name}: ${arg.type}`).join(', ');

        return '(function) ' + name + '(' + argStr + ')';
    },
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
    mdStr.appendCodeblock(obj2hoverStr[obj.type](obj), 'typescript');
    return new Hover(mdStr);
};

import { readFileSync } from "fs";
import { join } from "path";
import { generate, parser } from "peggy";
import { Function, Class } from "./types";

const isSyntaxError = (e: unknown): e is parser.SyntaxError => (
  e instanceof Object &&
  'location' in e &&
  'expected' in e &&
  'found' in e
);

const rawPEG = readFileSync(join(__dirname, '..', 'peg', 'JS.peg'), { encoding: 'utf-8' });
const impl = readFileSync(join(__dirname, '..', 'impl', 'CImpl.js'), { encoding: 'utf-8' });

try {
  const rst: (Function|Class)[] = generate(rawPEG).parse(impl);
  console.log(rst.filter(obj => obj.type === 'class'));
}
catch (e) {
  console.log(e);
  if (isSyntaxError(e)) {
    console.log("Location: [(" + e.location.start.line + ", " + e.location.start.column + ')' + ", " + 
    '(' + e.location.end.line + ", " + e.location.end.column + ")]");
  }
}

export type Variable = { type: 'variable', name: string, varType: string };
export type Member = { isStatic: boolean };

export type Function = { type: 'function', name: string, args: Variable[], returns: string, comment: string };

export type Arg = Variable;

export type Class = { type: 'class', name: string, fields: Field[], methods: Method[] };

export type Field = Variable & Member;
export type Method = Function & Member;

export type IObject = Class | Variable | Field | Function | Method;

export function isVariable(obj: IObject) : obj is Variable {
  return obj.type === 'variable';
}

export function isFunction(obj: IObject) : obj is Function {
  return obj.type === 'function';
}

export function isClass(obj: IObject) : obj is Class {
  return obj.type === 'class';
}

export function isField(obj: IObject) : obj is Field {
  return obj.type === 'variable' && 'isStatic' in obj;
}

export function isMethod(obj: IObject) : obj is Method {
  return obj.type === 'function' && 'isStatic' in obj;
}

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { OClass, OConstructor, OEnum, OEnumMember, OFunction, OObject, OVariable } from './types';

type OPayload = {
  name: string;
  desc?: string;
  type?: string;
  value?: number;
  vars?: OPayload[];
  args?: OPayload[];
  retType?: string;
  member?: OPayload[];
};

function parsePayload(payload: OPayload, parent?: OPayload): OObject {
  if (payload.type !== undefined) {
    return new OVariable(payload.name, payload.type, payload.desc);
  } else if (payload.value !== undefined) {
    return new OEnumMember(payload.name, payload.value);
  } else if (payload.vars !== undefined) {
    return new OEnum(
      payload.name,
      payload.vars
        .map(vari =>parsePayload(vari, payload))
        .filter((payload: OPayload): payload is OEnumMember => payload.value !== undefined),
      payload.desc);
  } else if (payload.args !== undefined && payload.retType !== undefined) {
    const args = payload.args
      .map(arg => parsePayload(arg, payload))
      .filter((payload: OPayload): payload is OVariable => payload.type !== undefined);

    if (parent?.name === payload.name) { // constructor
      return new OConstructor(payload.name, args, payload.desc);
    }
    else { // general function
      return new OFunction(payload.name, args, payload.retType, payload.desc);
    }
  } else if (payload.member !== undefined) {
    return new OClass(
      payload.name,
      payload.member
        .map(mem => parsePayload(mem, payload)),
      payload.desc);
  } else {
    throw new Error(`What the hell is this payload?!\npayload = ${payload}`);
  }
}

export function load(...pathInImpl: string[]) {
  const data = readFileSync(resolve(__dirname, '..', 'Impl', ...pathInImpl), { encoding: 'utf-8' });
  const payloads: OPayload[] = JSON.parse(data);
  return payloads.map(payload => parsePayload(payload));
}

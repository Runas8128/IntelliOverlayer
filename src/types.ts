/**
 * All types which can be result of parsing impl files.
 * 
 * Author: Runas
 */

export type Function = { type: 'function', name: string, args: Arg[], returns: string };

export type Arg = { name: string, type: string };

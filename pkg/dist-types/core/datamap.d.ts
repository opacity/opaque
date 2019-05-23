import { util as ForgeUtil } from "node-forge";
export declare function getHash(hash: ForgeUtil.ByteStringBuffer, offset: number, cache?: any[]): string | false;
export default class Datamap {
    hash: string;
    offset: number;
    cache: any[];
    constructor(hash: string, offset?: number);
    next(): void;
    hashAt(offset: number): void;
}

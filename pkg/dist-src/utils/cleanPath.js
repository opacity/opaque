// TODO: don't use polyfill
import { posix } from "path-browserify";
const posixSep = new RegExp(posix.sep + "+", "g");
const posixSepEnd = new RegExp("(.)" + posix.sep + "+$");
// NOTE: win32 isn't included in the polyfill
const win32Sep = new RegExp("\\+", "g");
const trimTrailingSep = (path) => {
    return path.replace(posixSepEnd, "$1");
};
const cleanPath = (path) => {
    return trimTrailingSep(path.replace(win32Sep, posix.sep).replace(posixSep, posix.sep));
};
export { cleanPath };

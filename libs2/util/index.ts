'use strict';

export {generateParser, getPathInnerModule, getValueParent, setInPath,} from './path.ts';

/**
 * 自己写的
 * @param args
 */
export function handleError(...args: any[]): void {
    console.error(...args);
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 翻译:
 * 快速对象校验 - 它主要是在我们已经知道这个值是 JSON-兼容的 的情况下
 * 用来辨别对象和原始值(number / boolean...)的
 * @param obj {?*}
 * @returns {boolean}
 */
export function isObject(obj: any): boolean {
    return obj !== null && 'object' === typeof(obj);
}

/**
 * Check whether the object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * @param obj {Object|Array<*>}
 * @param key {string}
 * @returns {boolean}
 */
export function hasOwn(obj: object, key: string): boolean {
    return hasOwnProperty.call(obj, key);
}



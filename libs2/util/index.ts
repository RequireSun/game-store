'use strict';

export { generateParser, getPathInnerModule, getValueParent, setInPath, } from './path.ts';
export { arrayMethods, } from './array.ts';

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

/**
 * Get the raw type string of a value e.g. [object Object]
 */
const _toString: () => string = Object.prototype.toString;

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 * @param obj {?*}
 * @returns {boolean}
 */
export function isPlainObject (obj: object): boolean {
    return _toString.call(obj) === '[object Object]';
}

/**
 * Define a property.
 * @param obj {Object}
 * @param key {string}
 * @param val {*?}
 * @param enumerable {boolean?}
 */
export function def (obj: object, key: string, val: any, enumerable?: boolean): void {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true,
    });
}

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 * @param target
 * @param src {Object}
 * @param keys {*?}
 */
export function protoAugment(target: object, src: object, keys?: string[]): void {
    /* eslint-disable no-proto */
    target.__proto__ = src
    /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 * @param target {Object}
 * @param src {Object}
 * @param keys {Array<string>}
 */
/* istanbul ignore next */
export function copyAugment(target: object, src: object, keys: string[]): void {
    for (let i: number = 0, l: number = keys.length; i < l; ++i) {
        const key: string = keys[i];
        def(target, key, src[key]);
    }
}



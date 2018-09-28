'use strict';

export { generateParser, getPathInnerModule, getValueParent, setInPath, } from './path';
export { arrayMethods, remove, } from './array';
export { nextTick, } from './next-tick';

/**
 * 自己写的
 * @param args
 */
export const handleError: (...args: any[]) => void = Function.prototype.bind.call(console.error, console);

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
 * 翻译:
 * 不做任何操作.
 * 使用多余的参数而不是(容易发生泄漏的?) ...rest 语句来骗过 Flow
 *
 * @param a {?*}
 * @param b {?*}
 * @param c {?*}
 */
export function noop (a?: any, b?: any, c?: any): void {}

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
export function def (obj: object, key: string, val: any, enumerable: boolean = false): void {
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
    //@ts-ignore
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

/**
 * decorator that sets the descriptor property of a class field.
 * @param name string
 * @param value true|false
 */
export function descriptor(name: string, value: boolean) {
    return function (target: any, propertyKey: string) {
        let descriptor = Object.getOwnPropertyDescriptor(target, propertyKey) || {};

        if (descriptor[name] != value) {
            descriptor[name] = value;
            Object.defineProperty(target, propertyKey, descriptor)
        }
    };
}



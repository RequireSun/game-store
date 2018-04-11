/**
 * Created by kelvinsun on 18/4/10.
 */

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
export function noop (a, b, c) {}

const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);
export const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * Remove an item from an array
 * @param arr {Array<*>}
 * @param item {*?}
 * @returns {Array.<*>|void}
 */
export function remove (arr, item) {
    if (arr.length) {
        const index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1);
        }
    }
}

/**
 * Define a property.
 * @param obj {Object}
 * @param key {string}
 * @param val {*?}
 * @param enumerable {boolean?}
 */
export function def (obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true,
    });
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
export function isObject (obj) {
    return obj !== null && typeof(obj) === 'object';
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
export function hasOwn (obj, key) {
    return hasOwnProperty.call(obj, key);
}

/**
 * Get the raw type string of a value e.g. [object Object]
 */
const _toString = Object.prototype.toString;

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 * @param obj {?*}
 * @returns {boolean}
 */
export function isPlainObject (obj) {
    return _toString.call(obj) === '[object Object]';
}


/**
 * Parse simple path.
 * 简单路径的解析
 */
const bailRE = /[^\w.$]/;
/**
 * @param path {string}
 * @returns {Function|*}
 */
export function parsePath (path) {
    if (bailRE.test(path)) {
        return;
    }
    const segments = path.split('.');

    return function (obj) {
        for (let i = 0; i < segments.length; i++) {
            // 中间找不到的话就相当于数据链路不对, 直接返回了就
            if (!obj) return;
            obj = obj[segments[i]];
        }
        return obj;
    }
}


// 自己写的

export function handleError(...args) {
    console.error(...args);
}

/**
 * Created by kelvinsun on 18/4/10.
 */

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * @param obj {?*}
 * @returns {boolean}
 */
export function isObject (obj) {
    return obj !== null && typeof(obj) === 'object';
}

// can we use __proto__?
export const hasProto = '__proto__' in {};

const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);
export const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

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
 * Parse simple path.
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

/* istanbul ignore next */
/**
 *
 * @param Ctor {*}
 * @returns {boolean}
 */
export function isNative (Ctor) {
    return typeof Ctor === 'function' && /native code/.test(Ctor.toString());
}

let _Set;
/* istanbul ignore if */ // $flow-disable-line
if (typeof Set !== 'undefined' && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
} else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = class Set implements SimpleSet {
        // /**
        //  * @type {Object}
        //  */
        // set;
        constructor () {
            this.set = Object.create(null);
        }
        /**
         * @param key {string|number}
         * @returns {boolean}
         */
        has (key) {
            return this.set[key] === true;
        }
        /**
         * @param key {string|number}
         */
        add (key) {
            this.set[key] = true;
        }
        clear () {
            this.set = Object.create(null);
        }
    }
}

export { _Set };

// 自己写的

export function handleError(...args) {
    console.error(...args);
}

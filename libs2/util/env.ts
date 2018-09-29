'use strict';

declare const WXEnvironment;
// declare window.__VUE_DEVTOOLS_GLOBAL_HOOK__;

// can we use __proto__?
export const hasProto: boolean = '__proto__' in {};

// Browser environment sniffing
export const inBrowser: boolean = 'undefined' !== typeof(window);
export const inWeex: boolean = 'undefined' !== typeof(WXEnvironment) && !!WXEnvironment.platform;
export const weexPlatform: string = inWeex && WXEnvironment.platform.toLowerCase();
export const UA: string = inBrowser && window.navigator.userAgent.toLowerCase();
export const isIE: boolean = UA && /msie|trident/.test(UA);
export const isIE9: boolean = UA && UA.indexOf('msie 9.0') > 0;
export const isEdge: boolean = UA && UA.indexOf('edge/') > 0;
export const isAndroid: boolean = (UA && UA.indexOf('android') > 0) || (weexPlatform === 'android');
export const isIOS: boolean = (UA && /iphone|ipad|ipod|ios/.test(UA)) || (weexPlatform === 'ios');
export const isChrome: boolean = UA && /chrome\/\d+/.test(UA) && !isEdge;

//TODO
// Firefox has a "watch" function on Object.prototype...
export const nativeWatch: (...args: any[]) => any = (<any>{}).watch;

export let supportsPassive: boolean = false;

if (inBrowser) {
    try {
        const opts: object = {};
        Object.defineProperty(opts, 'passive', ({
            get() {
                /* istanbul ignore next */
                supportsPassive = true
            }
        })); // https://github.com/facebook/flow/issues/285
        window.addEventListener('test-passive', null, opts);
    } catch (e) {}
}

// this needs to be lazy-evaled because vue may be required before
// vue-server-renderer can set VUE_ENV
// let _isServer;
// export const isServerRendering = () => {
//   if (_isServer === undefined) {
//     /* istanbul ignore if */
//     if (!inBrowser && !inWeex && typeof global !== 'undefined') {
//       // detect presence of vue-server-renderer and avoid
//       // Webpack shimming the process
//       _isServer = global['process'].env.VUE_ENV === 'server'
//     } else {
//       _isServer = false
//     }
//   }
//   return _isServer
// };

//TODO 这个地方不确定具体的 devtools 接口
// detect devtools
export const devtools: { emit: (name: string) => void, } = inBrowser && (<any>window).__VUE_DEVTOOLS_GLOBAL_HOOK__;

/* istanbul ignore next */
/**
 * 判断是否是原生的实现函数
 * @param Ctor {?*}
 * @returns {boolean}
 */
export function isNative(Ctor: any): boolean {
    return 'function' === typeof(Ctor) && /native code/.test(Ctor.toString());
}

// 是否有 symbol
export const hasSymbol: boolean =
    'undefined' !== typeof(Symbol) && isNative(Symbol) &&
    'undefined' !== typeof(Reflect) && isNative(Reflect.ownKeys);

let _Set;

type sorn = string | number;

// 写这个是因为 mocha 引用 babel 编译有问题, 不会忽略 typescript 的 interface
// let SimpleSet;

declare interface SimpleSet<T> {
    set: { [key: string]: boolean, };

    /**
     * @param key {string|number}
     * @returns {boolean}
     */
    has: (key: T) => boolean;

    /**
     * @param key {string|number}
     */
    add: (key: T) => this;

    /**
     * @returns {void}
     */
    clear: () => void;
}

/* istanbul ignore if */ // $flow-disable-line
if ('undefined' !== typeof(Set) && isNative(Set)) {
    // use native Set when available.
    _Set = Set;
} else {
    // a non-standard Set polyfill that only works with primitive keys.
    _Set = class CustomSet<T> implements SimpleSet<T> {
        set: { [key: string]: boolean, } = Object.create(null);

        constructor() {}

        /**
         * @param key {string|number}
         * @returns {boolean}
         */
        has(key: T): boolean {
            return this.set[String(key)] === true;
        }

        /**
         * @param key {string|number}
         */
        add(key: T): this {
            this.set[String(key)] = true;
            return this;
        }

        clear(): void {
            this.set = Object.create(null);
        }
    }
}

export { _Set, };
export { SimpleSet, };


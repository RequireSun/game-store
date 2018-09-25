'use strict';

/**
 * Parse simple path.
 * 简单路径的解析
 * @type {RegExp}
 */
export const bailRE: RegExp = /[^\w.$]/;

/**
 * @param path {string}
 * @returns {Function|*}
 */
export function generateParser(path: string): (obj: object) => any | void {
    if (bailRE.test(path)) {
        return;
    }
    const segments: string[] = path.split('.');

    return function (obj: object): any | void {
        for (let i = 0; i < segments.length; i++) {
            // 中间找不到的话就相当于数据链路不对, 直接返回了就
            if (!obj) return;
            obj = obj[segments[i]];
        }
        return obj;
    }
}

/**
 * 如果在 path 中找到了 module, 就直接返回到达该 module 的路径
 * 返回为空则代表传入 path 不合法或者传入 path 不含 module
 * @param obj
 * @param path
 * @returns {string}
 */
export function getPathInnerModule(obj: GameStore, path: string): string | void {
    if (bailRE.test(path)) {
        return ;
    }
    const segments: string[] = path.split('.');

    for (let i = 0; i < segments.length; i++) {
        // 中间找不到的话就相当于数据链路不对, 直接返回了就
        if (!obj) return ;
        if (obj._isModule) {
            // 把已有部分带走, 因为 i 是在获取完之后再 +1 的, 所以本身就已经有偏差了
            return segments.slice(0, i).join('.');
        }
        obj = obj[segments[i]];
    }
    // 找得到对应的父元素和找不到对应的父元素
    return ;
}

/**
 * 这个函数是本来如此还是被我改过我也忘记了,
 * 反正现在是会找到父层 (看下面那个 for 循环, 只循环到了倒数第二位)
 * @param obj {Object}
 * @param path {string}
 * @returns {Array.<string>|*}
 */
export function getValueParent(obj: object, path: string): any | void {
    if (bailRE.test(path)) {
        return ;
    }
    const segments: string[] = path.split('.');

    for (let i = 0; i < segments.length - 1; i++) {
        // 中间找不到的话就相当于数据链路不对, 直接返回了就
        if (!obj) return ;
        obj = obj[segments[i]];
    }
    // 找得到对应的父元素和找不到对应的父元素
    return obj;
}

/**
 * @param obj {Object}
 * @param path {string}
 * @param value {*}
 * @returns {Array.<string>|*}
 */
export function setInPath(obj: object, path: string, value: any): string[] | void {
    if (bailRE.test(path)) {
        return;
    }
    const segments: string[] = path.split('.');

    for (let i: number = 0; i < segments.length - 1; i++) {
        // 中间找不到的话就相当于数据链路不对, 直接返回了就
        if (!obj) return;
        obj = obj[segments[i]];
    }
    // 找得到对应的父元素和找不到对应的父元素
    if (obj) {
        obj[segments[segments.length - 1]] = value;
        return segments;
    } else {
        return;
    }
}
'use strict';

import { def, } from './index';
import {Observer} from '../observer';

const arrayProto: object = Array.prototype;
export const arrayMethods: { [key: string]: (...args: any[]) => any, } = Object.create(arrayProto);

const methodsToPatch: string[] = [
    'push',
    'pop',
    'shift',
    'unshift',
    'splice',
    'sort',
    'reverse'
];

/**
 * Intercept mutating methods and emit events
 * 翻译:
 * 打断修改流程并触发事件.
 */
methodsToPatch.forEach(function (method: string): void {
    // cache original method
    // 缓存原函数
    const original: () => any = arrayProto[method];

    def(arrayMethods, method, function mutator (...args) {
        // 执行原函数到 this 上, 缓存 result
        const result: number | any[] | any = original.apply(this, args);
        // 获取当前的 __ob__
        const ob: Observer = this.__ob__;
        let inserted: any[];

        switch (method) {
            case 'push':
            case 'unshift':
                // push 和 unshift 中插入进去的值要从参数上找
                inserted = args;
                break;
            case 'splice':
                // splice 方法中则要从第二个参数往后找
                inserted = args.slice(2);
                break
        }
        // 如果真的有插入新元素, 那么重新监听一下刚才插入的数组(逐个监听子元素)
        if (inserted) ob.observeArray(inserted);
        // notify change
        ob.dep.notify();
        // 最后将结果返回
        return result;
    });
});

/**
 * Remove an item from an array
 * @param arr {Array<*>}
 * @param item {*?}
 * @returns {Array.<*>|void}
 */
export function remove<T>(arr: T[], item: T) {
    if (arr.length) {
        const index = arr.indexOf(item);
        if (index > -1) {
            return arr.splice(index, 1);
        }
    }
}

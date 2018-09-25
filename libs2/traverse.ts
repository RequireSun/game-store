'use strict';

/**
 * 这个文件就是用来深度遍历对象 / 数组的
 */

import { isObject, } from './util/index.ts';
import { _Set as Set, SimpleSet, } from './util/env.ts';

const seenObjects: SimpleSet | Set = new Set();

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 * 翻译:
 * 通过递归遍历一个对象来调用所有经过转换的 getter, 这样就能使每一个深度嵌套的属性被当作“深层”依赖而收集起来.
 * @param val {*}
 */
export function traverse(val: object): void {
    _traverse(val, seenObjects);
    // 全部遍历完之后 clear 一下, 下次继续重用
    seenObjects.clear();
}

/**
 * 遍历递归体
 * @param val {*} 真的是传什么都可以
 * @param seen {SimpleSet}
 * @private
 */
function _traverse(val: any, seen: SimpleSet | Set): void {
    let i: number, keys: string[];
    const isA: boolean = Array.isArray(val);
    // VNode 删掉了
    // 不是数组也不是对象, 又或者已经冻结了不能修改了, 就直接返回了
    if ((!isA && !isObject(val)) || Object.isFrozen(val)) {
        return ;
    }
    // 如果属性有 __ob__ 监控者
    if (val.__ob__) {
        // 获取监控者的 id
        const depId: number = val.__ob__.dep.id;
        // 如果已经遍历过了, 就直接返回了
        if (seen.has(depId)) {
            return ;
        }
        // 否则将依赖加入到 set 中, 然后开始后续流程
        seen.add(depId);
    }

    // 逐个遍历(这一步 val[i] 就相当于一次 get 了)
    if (isA) {
        i = val.length;
        while (i--) _traverse(val[i], seen);
    } else {
        keys = Object.keys(val);
        i = keys.length;
        while (i--) _traverse(val[keys[i]], seen);
    }
}

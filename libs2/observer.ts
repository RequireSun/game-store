'use strict';

import {
    def,
    hasOwn,
    isObject,
    protoAugment,
    copyAugment,

    isPlainObject,
    arrayMethods,
} from './util/index.ts';

import { hasProto, } from './util/env.ts';

import Dep from './dep.ts';

const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * 翻译:
 * 将监听者附到被监听对象上. 通过修改原对象的属性为 getter / setter 方法来监听更新和分发消息.
 *
 * @desc 这个地方是外层的 observe 确保了一定传进来的是 object, 在 Observer 内部并没有校验机制
 * @desc Array 的 1234 定义应该是不能使用 define 函数的
 */
export class Observer {

    value: any;
    dep: Dep = new Dep;
    /**
     * number of vms that has this object as root $data
     * @type {number}
     */
    vmCount: number = 0;

    constructor(value) {
        this.value = value;
        // 为 value 添加 ob 属性
        def(value, '__ob__', this);
        // 数据类型是否是数组
        if (Array.isArray(value)) {
            // 如果是数组的话
            const augment: (target: object, src: object, keys: string[]) => void = hasProto ? protoAugment : copyAugment;
            // 给对象添加数组应该有的属性
            // 有 __proto__ 的直接修改原型链
            // 没有 __proto__ 的直接拷贝属性到 value 上
            augment(value, arrayMethods, arrayKeys);
            // 逐个监听数组内容
            this.observeArray(value);
        } else {
            // 逐个监听对象内容
            this.walk(value);
        }
    }

    /**
     * Walk through each property and convert them into
     * getter/setters. This method should only be called when
     * value type is Object.
     * 翻译:
     * 遍历属性并逐个把它们转化成 getter / setter 的格式.
     * 这个函数只应该在 obj 是对象的时候调用.
     * @param obj {Object}
     */
    walk(obj: object): void {
        const keys = Object.keys(obj);

        for (let i: number = 0; i < keys.length; i++) {
            // 逐个监听
            defineReactive(obj, keys[i]);
        }
    }

    /**
     * Observe a list of Array items.
     * @param items {Array<*>}
     */
    observeArray(items: any[]): void {
        for (let i: number = 0, l: number = items.length; i < l; i++) {
            observe(items[i]);
        }
    }

    /**
     * 这个函数应该是我自己加的吧...
     * 作用就是重新建立(补齐)当前实例的监听树()
     */
    supplement(): void {
        const value: any = this.value;
        // 因为这个对象一定是之前处理过了的, 所以就不往上面强化东西了
        if (Array.isArray(value)) {
            for (let i: number = 0, l: number = value.length; i < l; ++i) {
                !value[i].__ob__ && observe(value[i]);
            }
        } else {
            const keys: string[] = Object.keys(value);

            for (let i: number = 0; i < keys.length; ++i) {
                const property: PropertyDescriptor = Object.getOwnPropertyDescriptor(value, keys[i]);
                // 只有对象上的 get 和 set 函数不是监控器搞上去的的时候才会去添加新的监控
                if (
                    !property ||
                    !property.get || !property.get._isOb ||
                    !property.set || !property.set._isOb
                ) {
                    defineReactive(value, keys[i]);
                }
            }
        }
    }
}


/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 * 翻译:
 * 因为数组元素的获取和对象属性的获取方式不同, 所以要特别的在获取数组元素时收集数组元素的依赖.
 * @todo 暂时看不懂为什么这么搞
 * @param value {Array<*>}
 */
function dependArray(value: any[]): void {
    for (let e: any, i: number = 0, l: number = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend(); // 这里是去重新执行了一下当前元素的添加到依赖函数
        if (Array.isArray(e)) {
            // 如果当前元素还是数组, 那么递归依赖
            dependArray(e);
        }
    }
}

/**
 * Define a reactive property on an Object.
 * 翻译:
 * 往原属性上绑监听
 * @param obj {Object}
 * @param key {string}
 * @param val {*?}
 * @param customSetter {Function?}
 * @param shallow {boolean?}
 */
export function defineReactive(obj, key, val, customSetter, shallow): void {
    const dep: Dep = new Dep();

    const property: PropertyDescriptor = Object.getOwnPropertyDescriptor(obj, key);
    // 对应属性不准重定义就直接返回, 免得报错
    // 所以原数据上的不可重定义的属性就不会监听变化了?
    // 非对象(非引用型)数据的 property 就是 undefined, 所以就直接返回了
    if (property && property.configurable === false) {
        return;
    }

    // cater for pre-defined getter/setters
    // 把 getter 和 setter 缓存下来
    const getter: () => any = property && property.get;
    const setter: (v: any) => void = property && property.set;
    // 当原对象没有 getter 和 setter, 且只有前两个参数的时候, 直接读取数值(所以就是非引用数据类型咯, 其实没有被初始过的对象也是没有 set / get 的)
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }
    // 浅拷贝时不深层监听
    // 深层监听完后把监听结果保存下来
    // 如果 observe 有返回值, 证明这个是个对象
    let childOb: Observer = !shallow && observe(val);

    const reactiveGetter: () => any = function (): any {
        // 如果有 getter 就用 getter 获取数据, 否则就是直接用刚才取到的 val 做数据(也可能没取到, 所以就从整个函数体的参数上获取)
        const value: any = getter ? getter.call(obj) : val;
        // 熟悉的依赖分析步骤
        // 如果全局 Dep 的 target 上有属性, 就说明正处于依赖分析阶段, 去添加依赖
        if (Dep.target) {
            dep.depend();
            if (childOb) {
                // childOb 存在时证明 val 是一个对象, 需要给 child 的依赖也加到目前的 target 上
                childOb.dep.depend();
                if (Array.isArray(value)) {
                    dependArray(value);
                }
            }
        }
        return value;
    };

    const reactiveSetter: (newVal: any) => void = function (newVal): void {
        // 先获取原来的值
        const value: any = getter ? getter.call(obj) : val;
        // 原值相同或者原值与新值中的某一个自己不等于自己 (一般是 NaN), 就不更新了
        /* eslint-disable no-self-compare */
        if (newVal === value || (newVal !== newVal && value !== value)) {
            return ;
        }
        //@EDITED 把非线上环境的判断去掉了, 为什么开发中不允许用 customSetter 啊
        /* eslint-enable no-self-compare */
        if (customSetter) {
            customSetter();
        }
        if (setter) {
            setter.call(obj, newVal);
        } else {
            val = newVal;
        }
        childOb = !shallow && observe(newVal);
        dep.notify();
    };

    Object.defineProperty(reactiveGetter, '_isOb', {
        enumerable: false,
        value: true,
    });

    Object.defineProperty(reactiveSetter, '_isOb', {
        enumerable: false,
        value: true,
    });
    // 偷偷的把 dep 放到 setter 上, 这样在外面就可以呼起了
    // 而且这样 dep 也是跟对应属性的 setter 做了绑定, 对应属性的 setter 没了, dep 也会跟着回收, 不会出现内存泄露
    Object.defineProperty(reactiveSetter, '_dep', {
        enumerable: false,
        value: dep,
    });

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: reactiveGetter,
        set: reactiveSetter,
    });
}


/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * @param value {*?}
 * @param asRootData {boolean?}
 * @returns {Observer|void}
 */
export function observe(value: (object | any), asRootData?: boolean): Observer {
    // 因为我的内容上不可能有 VNode, 所以就删掉 VNode 的部分了
    if (!isObject(value)) {
        return;
    }
    /**
     * @type {Observer|void}
     */
    let ob: Observer;

    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        // 对象存在监视对象, 就不做重复的监控操作了, 直接把原来的返回回去
        ob = value.__ob__;
    } else if (
        (Array.isArray(value) || isPlainObject(value)) &&
        Object.isExtensible(value)
    ) {
        // 暂时没想到不能监听的地方, 直接干掉
        // 因为我这个东西跟 vue 无关, 肯定不能 server rendering, 所以直接干掉了那个条件
        // 这个也肯定不是 vue, 所以直接删掉 isVue 也肯定没错
        // 原数据是普通数组或者对象, 并且可以扩展, 就去监听(不能扩展的真的没法监听)
        // 进行监听并返回
        ob = new Observer(value);
    }
    // 如果我没猜错的话, 这个是用来区分不同 vm 根树的?
    if (asRootData && ob) {
        ob.vmCount++;
    }

    return ob;
}



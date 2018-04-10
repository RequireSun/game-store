import {
    def,
    hasOwn,
    isObject,
    arrayKeys,
    arrayMethods,
    isPlainObject,
} from '../js/util.js';

import {hasProto,} from "./env.js";

import Dep from './dep.js';

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 * 翻译:
 * 将监听者附到被监听对象上. 通过修改原对象的属性为 getter / setter 方法来监听更新和分发消息.
 *
 * @desc 这个地方是外层的 observe 确保了一定传进来的是 object, 在 Observer 内部并没有校验机制
 */
export class Observer {
    // /**
    //  * @type {*}
    //  */
    // value = undefined;
    // /**
    //  * @type {Dep}
    //  */
    // dep = new Dep();
    // /**
    //  * @type {number}
    //  */
    // vmCount = 0; // number of vms that has this object as root $data

    constructor (value) {
        this.value = value;
        this.dep = new Dep();
        this.vmCount = 0;
        // 为 value 添加 ob 属性
        def(value, '__ob__', this);
        // 数据类型是否是数组
        if (Array.isArray(value)) {
            // 如果是数组的话
            const augment = hasProto ? protoAugment : copyAugment;
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
    walk (obj) {
        const keys = Object.keys(obj);

        for (let i = 0; i < keys.length; i++) {
            // 逐个监听
            defineReactive(obj, keys[i]);
        }
    }

    /**
     * Observe a list of Array items.
     * @param items {Array<*>}
     */
    observeArray (items) {
        for (let i = 0, l = items.length; i < l; i++) {
            observe(items[i]);
        }
    }
}


/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 * @param target
 * @param src {Object}
 * @param keys {*?}
 */
function protoAugment (target, src, keys) {
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
function copyAugment (target, src, keys) {
    for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        def(target, key, src[key]);
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
function dependArray (value) {
    for (let e, i = 0, l = value.length; i < l; i++) {
        e = value[i];
        e && e.__ob__ && e.__ob__.dep.depend();
        if (Array.isArray(e)) {
            // 如果当前元素还是对象, 那么递归依赖
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
export function defineReactive (obj, key, val, customSetter, shallow) {
    const dep = new Dep();

    const property = Object.getOwnPropertyDescriptor(obj, key);
    // 对应属性不准重定义就直接返回, 免得报错
    // 所以原数据上的不可重定义的属性就不会监听变化了?
    // 非对象(非引用型)数据的 property 就是 undefined, 所以就直接返回了
    if (property && property.configurable === false) {
        return ;
    }

    // cater for pre-defined getter/setters
    // 把 getter 和 setter 缓存下来
    const getter = property && property.get;
    const setter = property && property.set;
    // 当原对象没有 getter 和 setter, 且只有前两个参数的时候, 直接读取数值(所以就是非引用数据类型咯, 其实没有被初始过的对象也是没有 set / get 的)
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }
    // 浅拷贝时不深层监听
    // 深层监听完后把监听结果保存下来
    // 如果 observe 有返回值, 证明这个是个对象
    let childOb = !shallow && observe(val);

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter () {
            // 如果有 getter 就用 getter 获取数据, 否则就是直接用刚才取到的 val 做数据(也可能没取到, 所以就从整个函数体的参数上获取)
            const value = getter ? getter.call(obj) : val;
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
            return value
        },
        set: function reactiveSetter (newVal) {
            const value = getter ? getter.call(obj) : val
            /* eslint-disable no-self-compare */
            if (newVal === value || (newVal !== newVal && value !== value)) {
                return
            }
            /* eslint-enable no-self-compare */
            if (process.env.NODE_ENV !== 'production' && customSetter) {
                customSetter()
            }
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = !shallow && observe(newVal)
            dep.notify()
        }
    })
}


/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * @param value {*?}
 * @param asRootData {?boolean}
 * @returns {Observer|void}
 */
export function observe(value, asRootData) {
    // 因为我的内容上不可能有 VNode, 所以就删掉 VNode 的部分了
    if (!isObject(value)) {
        return ;
    }
    /**
     * @type {Observer|void}
     */
    let ob;

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
    //TODO 这个值还没找到传的地方
    // 如果我没猜错的话, 这个是用来区分不同 vm 根树的?
    if (asRootData && ob) {
        ob.vmCount++;
    }

    return ob;
}



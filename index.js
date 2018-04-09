// can we use __proto__?
export const hasProto = '__proto__' in {};

const arrayProto = Array.prototype;
export const arrayMethods = Object.create(arrayProto);
const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 * @type {boolean}
 */
export let shouldObserve = true;
/**
 * @param value {boolean}
 */
export function toggleObserving (value) {
    shouldObserve = value;
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
    /**
     * @type {*}
     */
    value = undefined;
    /**
     * @type {Dep}
     */
    dep = new Dep();
    /**
     * @type {number}
     */
    vmCount = 0; // number of vms that has this object as root $data

    constructor (value) {
        this.value = value;
        def(value, '__ob__', this);
        // 数据类型是否是数组
        if (Array.isArray(value)) {
            // 如果是数组的话
            const augment = hasProto
                ? protoAugment
                : copyAugment;
            // 给对象添加数组应该有的属性
            // 有 __proto__ 的直接修改原型链
            // 没有 __proto__ 的直接拷贝属性到 value 上
            augment(value, arrayMethods, arrayKeys);
            // 逐个监听数组内容
            this.observeArray(value);
        } else {
            // 逐个监听对象内容
            this.walk(value)
        }
    }

    /**
     * Walk through each property and convert them into
     * getter/setters. This method should only be called when
     * value type is Object.
     * @param obj {Object}
     */
    walk (obj) {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
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
 * Define a reactive property on an Object.
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
    // 当原对象没有 getter 和 setter, 且只有前两个参数的时候, 直接读取数值(所以就是非引用数据类型咯)
    if ((!getter || setter) && arguments.length === 2) {
        val = obj[key];
    }
    // 浅拷贝时不深层监听
    // 慎曾监听完后把监听结果保存下来
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
                    childOb.dep.depend();
                    if (Array.isArray(value)) {
                        dependArray(value)
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
export function observe (value, asRootData) {
    // 因为我的内容上不可能有 VNode, 所以就删掉 VNode 的部分了
    if (!isObject(value)) {
        return ;
    }
    /**
     * @type {Observer|void}
     */
    let ob;

    if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
        // 对象存在监视对象
        ob = value.__ob__;
    } else if (
        shouldObserve &&
        (Array.isArray(value) || isPlainObject(value)) &&
        Object.isExtensible(value)
    ) {
        // 因为我这个东西跟 vue 无关, 肯定不能 server rendering, 所以直接干掉了那个条件
        // 这个也肯定不是 vue, 所以直接删掉 isVue 也肯定没错
        ob = new Observer(value);
    }
    if (asRootData && ob) {
        ob.vmCount++
    }
    return ob
}

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
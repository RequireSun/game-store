import Watcher from '../libs/watcher.js';
import {observe,} from '../libs/observer.js';
import {isObject,setInPath,getParentPath,} from '../libs/util.js';

/**
 * @warn 各种处理的时候一定要记得用 this._data 而不是 this, 否则容易出神奇的问题
 */
export default class DataStore {
    constructor(value) {
        const data = {};
        if (value) {
            Object.assign(data, value);
        }
        // 要把 watcher 们关联上的
        Object.defineProperty(data, '_watchers', {
            configurable: false,    // 不可重定义
            enumerable: false,      // 不可被遍历
            writable: true,         // 可修改?
            value: [],
        });

        observe(data, true);
        // 防止 data 被便利出来
        Object.defineProperty(this, '_data', {
            configurable: false,    // 不可重定义
            enumerable: false,      // 不可被遍历
            writable: true,         // 可修改?
            value: data,
        });

        // 数据代理
        // 实现 vm.xxx -> vm._data.xxx
        Object.keys(data).forEach(key => this._proxyData(key));
    }

    _proxyData (key, setter, getter) {
        setter = setter ||
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get() {
                    return this._data[key];
                },
                set(newVal) {
                    this._data[key] = newVal;
                },
            });
    }

    watch(key, cb) {
        new Watcher(this._data, key, cb, {
            user: true,
            deep: true,
        });
    }

    setIn(path, value) {
        const parent = getParentPath(this._data, path);
        // 有返回值就是成功了, 这时候重新建立监控
        if (isObject(parent)) {
            // 因为 getPath 里面已经判断了路径的合法性了, 所以这里直接用应该没问题
            const segments = path.split('.');
            // 这个地方的赋值是为了让这个 key 存在
            if (!parent[segments[segments.length - 1]]) {
                parent[segments[segments.length - 1]] = undefined;
            }
            // 从根往下搜索没有 ob 过的对象, 找到第一个就直接开始监控
            let target = this._data;
            for (let i = 0; i < segments.length - 1 && target && target.__ob__; ++i) {
                const property = Object.getOwnPropertyDescriptor(target, segments[i]);
                if (
                    !property ||
                    !property.get || !property.get._isOb ||
                    !property.set || !property.set._isOb
                ) {
                    break;
                }
                target = target[segments[i]];
            }
            // 在刚才找到的父节点上重新进行监控
            if (target && target.__ob__) {
                target.__ob__.supplement();
                // 现在需要再进行 watcher 的重放
                if (this._data && Array.isArray(this._data._watchers)) {
                    for (let i = 0; i < this._data._watchers.length; ++i) {
                        const item = this._data._watchers[i];
                        // 这个地方的 set 导致了只要调用了 setIn, 就会让 watcher 的参数出错的问题
                        // 所以这个地方需要根据 path 对 watcher 的 expression 对比, 如果对应上了, 再去重做
                        if (0 === path.indexOf(item.expression)) {
                            item.value = item.get();
                        }
                    }
                }
            }
            // 不管监控没监控, 都要去赋值了
            // 第一次处理问题:
            // 这个地方放在 nextTick 里是因为如果连续调用两个 setIn,
            // 会使得 watch => set 流程连续执行, 而 watch 之后的 callback 的执行是 nextTick 的,
            // 所以所有的 watch 都会堆在阻塞的 set 之后执行, 这样就会出现 callback 执行时 value 值已经被覆盖的情况
            // 此时 callback 里的 newVal 和 oldVal 都会是同一个值了
            // 第二次处理问题:
            // 日, 现在头好大, 这个地方存在这么一个问题
            // 因为 nextTick 是会在空闲时运行的, 所以会在所有的串行 a.b.c 之后运行
            // 所以它不会根据声明的顺序执行, 常人无法理解
            // 所以先写死了吧, 数据安全第一
            setInPath(this._data, path, value);
            // 如果是直接定义到了 ds 上的属性, 要记得重新 proxy 一下
            if (1 === segments.length) {
                this._proxyData(segments[0]);
            }
        }
    }
}
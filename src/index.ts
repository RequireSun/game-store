'use strict';

import Watcher, { WatcherShell, WatcherBase, } from "../libs2/watcher.ts";

import {
    getPathInnerModule,
    getValueParent,
    setInPath,
    isObject,
    hasOwn,
    nextTick,
    descriptor,
} from '../libs2/util/index.ts';

import { observe, Observer, } from '../libs2/observer.ts';

interface StoreConfig {
    state: object,
    mutations?: { [key: string]: ((...args: any[]) => any), },
    modules?: { [key: string]: StoreConfig, },
}

interface GameStoreData {
    __ob__: Observer,
    _watchers : WatcherBase[],
}

// interface GameStore {
//     _data: GameStoreData;
//     _mutations: { [key: string]: (...args: any[]) => any, },
//     _isBeingDestroyed: boolean,
//     _isModule: boolean,
//     [key: string]: number | string | object,
// }

export default class GameStore {
    @descriptor('configurable', false)
    @descriptor('enumerable', false)
    _data: GameStoreData;

    @descriptor('configurable', false)
    @descriptor('enumerable', false)
    _mutations: { [key: string]: ((...args: any[]) => any), };

    /**
     * 是否正在被销毁
     * @type {boolean}
     * @private
     */
    @descriptor('enumerable', false)
    _isBeingDestroyed: boolean = false;

    /**
     * 是否是子模块
     * @type {boolean}
     * @private
     */
    @descriptor('enumerable', false)
    _isModule: boolean = false;

    // [key: string]: (number | string | object | boolean | ((...args: any[]) => any) | { [key: string]: ((...args: any[]) => any), });

    static generateData(state: object): GameStoreData {
        const data: object = {
            _watchers: [],
        };
        descriptor('enumerable', false)(data, '_watchers');
        descriptor('configurable', false)(data, '_watchers');

        if (state) {
            Object.assign(data, state);
        }

        observe(data, true);
        // 不够智能, 我把属性加齐全了也不算那个接口的数据
        return <GameStoreData>data;
    }

    constructor({state, mutations, modules = {},}: StoreConfig = {}) {

        this._mutations = mutations;
        this._data = GameStore.generateData(state);

        // 数据代理
        // 实现 vm.xxx -> vm._data.xxx
        Object.keys(this._data).forEach(key => this._proxyData(key));

        // 这个地方直接全都 false 了, 真重名了的话调用方自己反省
        Object.keys(modules).forEach(key => {
            const ds = new GameStore(modules[key]);

            this._registerModule(this, ds, key);
        });
    }

    private _proxyData(key: string, setter?: () => void, getter?: () => any): void {
        const get: () => any = function (): any {
            return this._data[key];
        };

        const set: (newVal: any) => void = function (newVal: any): void {
            this._data[key] = newVal;
        };

        Object.defineProperty(set, '_vmOb', {
            enumerable: false,
            value: true,
        });

        Object.defineProperty(get, '_vmOb', {
            enumerable: false,
            value: true,
        });

        // 不知道 vue 这里这个诡异的写法从何而来
        setter = setter ||
            Object.defineProperty(this, key, {
                configurable: false,
                enumerable: true,
                get,
                set,
            });
    }

    watch(key: string = '', cb: (val, oldVal) => any): WatcherBase {
        // 去掉第一个点之后的部分
        const firstPart: string = key.replace(/\..*/, '');

        //TODO 好像这个地方的思路对一点, 不可能存在 state 里面套 module 的状况吧?
        if (this[firstPart] && this[firstPart]._isModule) {
            // 如果第一个点之前的部分代表了一个 module
            // 那就去掉本层的名字之后让这个 module 自己去监听
            const watcher: Watcher = this[firstPart].watch(key.replace(/[^.]*\./, ''), cb);

            return new WatcherShell(this._data, key, watcher);
        } else {
            return new Watcher(this._data, key, cb, {
                user: true,
                // deep: true,
            });
        }
    }

    /**
     * 将新声明的属性挂到监听树上去
     * @desc vue 的算法只会监听在初始化时声明的变量们,
     *       后续再新添加上去的属性直接监听变化是无效的,
     *       所以使用这个方法, 可以在声明属性的同时将该属性添加到监听树上, 后面就可以监听得到了
     * @param path
     * @param value
     */
    setIn(path: string, value: any): void {
        // 在这个地方解析路径中是否有 module, 有的话直接交由对应 setIn 来执行
        const modulePath: string | void = getPathInnerModule(this._data, path);

        if (modulePath) {
            // 偷懒了, 通过这个方法获取目标 module
            const parent: GameStore = getValueParent(this._data, modulePath + '.x');
            // 因为这段 path 是从第一项开始获取的, 所以直接 replace 应该没问题
            return parent.setIn(path.replace(modulePath + '.', ''), value);
        }

        const parent: any | void = getValueParent(this._data, path);
        // 有返回值就是成功了, 这时候重新建立监控
        // 没有返回值的话就代表了父层都没有, 怎么可能赋值成功呢
        if (isObject(parent)) {
            // 因为 getPath 里面已经判断了路径的合法性了, 所以这里直接用应该没问题
            const segments: string[] = path.split('.');
            // 这个地方的赋值是为了让这个 key 存在
            // undefined 就是这个值原来的值, 要不然监听函数里面的 oldVal 就是一个错误的值了
            if (!parent[segments[segments.length - 1]]) {
                parent[segments[segments.length - 1]] = undefined;
            }
            // 从根往下搜索没有 ob 过的对象, 找到第一个就直接开始监控
            let target: object = this._data;
            for (let i: number = 0; i < segments.length - 1 && target && target.__ob__; ++i) {
                const property: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, segments[i]);
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
                        const item: WatcherBase = this._data._watchers[i];
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
            // (2018-05-07: 仔细回想了一下, 出现第一个问题的原因好象是因为没有给这个玩意赋一个初始值 (undefined), 所以才会导致 oldVal 和 newVal 取值相同的问题)
            // 第二次处理问题:
            // 日, 现在头好大, 这个地方存在这么一个问题
            // 因为 nextTick 是会在空闲时运行的, 所以会在所有的串行 a.b.c 之后运行
            // 所以它不会根据声明的顺序执行, 常人无法理解
            // 所以先写死了吧, 数据安全第一
            setInPath(this._data, path, value);

            // 如果是直接定义到了 ds 上的属性, 要记得重新 proxy 一下
            if (1 === segments.length) {
                const property: PropertyDescriptor = Object.getOwnPropertyDescriptor(this, segments[0]);
                if (!property || !property.get || !property.get._vmOb || !property.set || !property.set._vmOb) {
                    this._proxyData(segments[0]);
                }
            }
        } else {
            throw new Error('您赋值的路径有误!');
        }
    }

    commit(type: string | { type: string, payload: any, }, payload: any): void {
        if ('string' === typeof(type)) {
            // 不处理
        } else {
            payload = type.payload;
            type = type.type;
        }

        if (this._mutations && hasOwn(this._mutations, type) &&
            'function' === typeof(this._mutations[type])
        ) {
            this._mutations[type](this, {
                type,
                payload,
            });
        }
    }

    dispatch(...args: [string | { type: string, payload: any, }, any]): void {
        return this.commit(...args);
    }

    registerModule(path: string | string[], config: StoreConfig): void {
        if (Array.isArray(path) && 1 < path.length) {
            // 如果下一个人存在, 那就交给下一个人去做
            if (this[path[0]] && this[path[0]]._isModule) {
                this[path[0]].registerModule(path.slice(1), config);
            } else {
                // 应该报错
                throw new Error('新 module 只能声明在 module 上!');
            }
        } else if ('string' === typeof(path) || (Array.isArray(path) && 1 === path.length)) {
            // 如果 path 长度只有 1 那么应该也就是在自己上面玩了
            if (Array.isArray(path)) {
                path = path[0];
            }
            // 强转类型
            // 这个地方 ts 不够智能, 不会解析类型
            path = <string>path;

            if (this[path] && this[path]._isModule) {
                throw new Error('请不要重复定义 module');
            }

            const ds: GameStore = new GameStore(config);

            this._registerModule(this, ds, path);
        } else {
            throw new Error('path 只可以是字符串或数组');
        }

        // 当前新注册的 module 的路径
        // path 是数组的情况只存在于还有好多嵌套的情况下
        const pathString: string = Array.isArray(path) ? path.join('.') : path;

        if (this._data && Array.isArray(this._data._watchers)) {
            // 因为下面可能 teardown, 所以先复制一份为妙
            const watchers: WatcherBase[] = this._data._watchers.slice();
            for (let i: number = 0; i < watchers.length; ++i) {
                const item: WatcherBase = watchers[i];
                // 这个地方的 set 导致了只要调用了 setIn, 就会让 watcher 的参数出错的问题
                // 所以这个地方需要根据 path 对 watcher 的 expression 对比, 如果对应上了, 再去重做
                //TODO 这个地方重点观察, 我把它的 indexOf 的调用和被调用关系对调过来了
                //TODO 因为现在情况是可能一开始监听了一个属性, 后来这个属性被 module 覆盖了, 那么应该也要触发 cb 的
                //TODO 此时 pathString === module 路径, item.expression > pathString
                //TODO watcherShell 没有 cb, 需要特殊处理
                if (0 === item.expression.indexOf(pathString)) {
                    // 如果已经有监听这个东西的 watcher 了, 那么就要去删除并重建
                    // 上面已经通过 throw error 消灭了重复定义 module 的情况了, 所以直接搞 watcher 应该没问题
                    const key: string = item.expression;
                    const cb: (val, oldVal) => any = item.cb;
                    item.teardown();
                    const watcher = this.watch(key, cb);
                    // 试试能不能通过黑科技来触发 cb
                    //TODO 这里手动使用了 nextTick, 不一定稳妥, 需要再次 review
                    //TODO 这个地方的 value WatcherShell 不一定有
                    nextTick(() => {
                        watcher.value = undefined;
                        watcher.run();
                    });
                }
            }
        }
    }

    private _registerModule(vm: GameStore, module: GameStore, moduleName: string): void {
        // 标记这个是个 module
        Object.defineProperty(module, '_isModule', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true,
        });

        // 生气了, 直接把值定到 _data 里面去
        // 但是按理来说这里不应该这么做的,
        // 毕竟这算是 dataStore 的事情, 不应该扯到数据上去的
        Object.defineProperty(vm._data, moduleName, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: module,
        });

        vm._proxyData(moduleName);
    }
}
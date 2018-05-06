import Watcher, {WatcherShell,} from '../libs/watcher.js';
import {observe,} from '../libs/observer.js';
import {isObject,setInPath,getParentPath,getInnerModulePath,} from '../libs/util/index.js';
import {hasOwn} from '../libs/util/index.js';

/**
 * @todo 动态插入 module 功能
 * @todo module -> action 分层功能
 * @todo 如果动态插入了一个 module, 那么之前的监听怎么办
 * @warn 各种处理的时候一定要记得用 this._data 而不是 this, 否则容易出神奇的问题
 */
export default class DataStore {
    constructor({state: value, mutations, modules = {},} = {}) {
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

        Object.defineProperty(this, '_mutations', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: mutations,
        });

        // 这个地方直接全都 false 了, 真重名了的话调用方自己反省
        Object.keys(modules).forEach(key => {
            const ds = new DataStore(modules[key]);
            // 生气了, 直接把值定到 _data 里面去
            // 但是按理来说这里不应该这么做的,
            // 毕竟这算是 dataStore 的事情, 不应该扯到数据上去的
            Object.defineProperty(this._data, key, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: ds,
            });

            this._proxyData(key);

            // 标记这个是个 module
            Object.defineProperty(ds, '_isModule', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: true,
            });
        });
    }

    _proxyData (key, setter, getter) {
        const get = function () {
            return this._data[key];
        };

        const set = function (newVal) {
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

    watch(key = '', cb) {
        // 去掉第一个点之后的部分
        const firstPart = key.replace(/\..*/, '');

        if (this[firstPart] && this[firstPart]._isModule) {
            // 如果第一个点之前的部分代表了一个 module
            // 那就去掉本层的名字之后让这个 module 自己去监听
            const watcher = this[firstPart].watch(key.replace(/[^.]*\./, ''), cb);

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
    setIn(path, value) {
        // 在这个地方解析路径中是否有 module, 有的话直接交由对应 setIn 来执行
        const modulePath = getInnerModulePath(this._data, path);

        if (modulePath) {
            // 偷懒了, 通过这个方法获取目标 module
            const parent = getParentPath(this._data, modulePath + '.x');
            // 因为这段 path 是从第一项开始获取的, 所以直接 replace 应该没问题
            return parent.setIn(path.replace(modulePath + '.', ''), value);
        }

        const parent = getParentPath(this._data, path);
        // 有返回值就是成功了, 这时候重新建立监控
        // 没有返回值的话就代表了父层都没有, 怎么可能赋值成功呢
        if (isObject(parent)) {
            // 因为 getPath 里面已经判断了路径的合法性了, 所以这里直接用应该没问题
            const segments = path.split('.');
            // 这个地方的赋值是为了让这个 key 存在
            // undefined 就是这个值原来的值, 要不然监听函数里面的 oldVal 就是一个错误的值了
            if (!parent[segments[segments.length - 1]]) {
                parent[segments[segments.length - 1]] = undefined;
            }/* else if (parent._isModule && !parent._data[segments[segments.length - 1]]) {
                // 如果当前父是 module 的话
                // 如果 _data 上目标值不存在, 应该往 _data 上面赋值, 并清空当前没用那个值
                // (也就是说之前直接赋值上去的东西都是狗屁)
                parent[segments[segments.length - 1]] = undefined;
                parent._data[segments[segments.length - 1]] = undefined;
            }*/
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
            // (2018-05-07: 仔细回想了一下, 出现第一个问题的原因好象是因为没有给这个玩意赋一个初始值 (undefined), 所以才会导致 oldVal 和 newVal 取值相同的问题)
            // 第二次处理问题:
            // 日, 现在头好大, 这个地方存在这么一个问题
            // 因为 nextTick 是会在空闲时运行的, 所以会在所有的串行 a.b.c 之后运行
            // 所以它不会根据声明的顺序执行, 常人无法理解
            // 所以先写死了吧, 数据安全第一
            setInPath(this._data, path, value);

            // 如果是直接定义到了 ds 上的属性, 要记得重新 proxy 一下
            if (1 === segments.length) {
                const property = Object.getOwnPropertyDescriptor(this, segments[0]);
                if (!property || !property.get || !property.get._vmOb || !property.set || !property.set._vmOb) {
                    this._proxyData(segments[0]);
                }
            }
        } else {
            throw new Error('您赋值的路径有误!');
        }
    }

    commit(type, payload) {
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

    dispatch(...args) {
        this.commit(...args);
    }

    registerModule(path, config) {
        var target = this;
        var moduleName = '';

        if (Array.isArray(path)) {
            // 注意, 这里是到父层为止
            for (let i = 0, l = path.length; i < l - 1; ++i) {
                target = target[path[i]];
                moduleName = path[i + 1];
                if (!target._isModule) {
                    // 应该报错
                    throw new Error('新 module 只能声明在 module 上!');
                }
            }
        } else if ('string' === typeof(path)) {
            moduleName = path;
        } else {
            throw new Error('path 只可以是字符串或数组');
        }

        const ds = new DataStore(config);
        // 从上面抄下来的
        Object.defineProperty(target._data, moduleName, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: ds,
        });

        target._proxyData(moduleName);

        // 标记这个是个 module
        Object.defineProperty(ds, '_isModule', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true,
        });
        // 声明的问题是解决了, 但目前还没有挂到树上
    }
}
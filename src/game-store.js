import Watcher, {WatcherShell,} from './core/watcher.js';
import {observe,} from './core/observer.js';
import {isObject,setInPath,getParentPath,getInnerModulePath,} from './core/util/index.js';
import {hasOwn,} from './core/util/index.js';
import {nextTick,} from './core/util/next-tick.js';

/**
 * @todo 如果动态插入了一个 module, 那么之前的监听怎么办
 * @warn 各种处理的时候一定要记得用 this.state 而不是 this, 否则容易出神奇的问题
 * @todo getters 需要我把 computed 的实现搞回来
 * @todo 补全 warn 状态有些 warn 的情况需要在 dev 下报错
 */
class Store {
    constructor(
        {
            state: value,
            mutations,
            actions,
            modules = {},
            namespaced = false,
            namespace = '',
        } = {})
    {
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
        // 这个地方改成跟 vuex 一样的 state 属性获取数据
        // _proxyData 方法就此作古
        Object.defineProperty(this, 'state', {
            configurable: false,    // 不可重定义
            enumerable: true,       // 可被遍历
            writable: false,        // 感觉是不可修改的
            value: data,
        });

        Object.defineProperty(this, '_mutations', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: mutations,
        });

        Object.defineProperty(this, '_actions', {
            configurable: false,
            enumerable: false,
            writable: true,
            value: actions,
        });

        // 子模块命名空间的事情
        if (namespaced && namespace) {
            Object.defineProperty(this, '_namespace', {
                configurable: false,
                enumerable: false,
                writable: true,
                value: namespace,
            });
        }

        Object.keys(modules).forEach(key => {
            this._registerModule(this, modules[key], key);
        });
    }

    /**
     * @todo 这里的 isModule 判断需要重写
     * @todo 这里把监听权利收归国有 (只有根可以用), 应该可以用吧
     * @param key
     * @param cb
     * @returns {*}
     */
    watch(key = '', cb) {
        return new Watcher(this.state, key, cb, {
            user: true,
            // deep: true,
        });

        // // 去掉第一个点之后的部分
        // const firstPart = key.replace(/\..*/, '');
        //
        // //TODO 好像这个地方的思路对一点, 不可能存在 state 里面套 module 的状况吧?
        // if (this[firstPart] && this[firstPart]._isModule) {
        //     // 如果第一个点之前的部分代表了一个 module
        //     // 那就去掉本层的名字之后让这个 module 自己去监听
        //     const watcher = this[firstPart].watch(key.replace(/[^.]*\./, ''), cb);
        //
        //     return new WatcherShell(this.state, key, watcher);
        // } else {
        //     return new Watcher(this.state, key, cb, {
        //         user: true,
        //         // deep: true,
        //     });
        // }
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
        const modulePath = getInnerModulePath(this.state, path);

        if (modulePath) {
            // 偷懒了, 通过这个方法获取目标 module
            const parent = getParentPath(this.state, modulePath + '.x');
            // 因为这段 path 是从第一项开始获取的, 所以直接 replace 应该没问题
            return parent.setIn(path.replace(modulePath + '.', ''), value);
        }

        const parent = getParentPath(this.state, path);
        // 有返回值就是成功了, 这时候重新建立监控
        // 没有返回值的话就代表了父层都没有, 怎么可能赋值成功呢
        if (isObject(parent)) {
            // 因为 getPath 里面已经判断了路径的合法性了, 所以这里直接用应该没问题
            const segments = path.split('.');
            // 这个地方的赋值是为了让这个 key 存在
            // undefined 就是这个值原来的值, 要不然监听函数里面的 oldVal 就是一个错误的值了
            if (!parent[segments[segments.length - 1]]) {
                parent[segments[segments.length - 1]] = undefined;
            }
            // 从根往下搜索没有 ob 过的对象, 找到第一个就直接开始监控
            let target = this.state;
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
                if (this.state && Array.isArray(this.state._watchers)) {
                    for (let i = 0; i < this.state._watchers.length; ++i) {
                        const item = this.state._watchers[i];
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
            setInPath(this.state, path, value);
        } else {
            throw new Error('您赋值的路径有误!');
        }
    }

    _dispatch({type, payload, rootState,}) {
        var res;

        //@NOTICE copy from commit
        const types = type.split('/').filter(item => item);

        if (0 === types.length) {
            throw new Error('invalid commit type');
        } else if (1 === types.length) {
            // 长度为 1 的情况代表了就是要唤起当前 store / 当前的子 store 的某个事件的情况

            res = [];

            // 如果当前 store 的事件存在就调用当前的事件
            if (this._actions && hasOwn(this._actions, types[0]) &&
                'function' === typeof(this._actions[types[0]])
            ) {
                var tmpRes = this._actions[types[0]]({
                    state: this.state,
                    commit: this.commit,
                    dispatch: this.dispatch,
                    rootState: rootState,
                }, payload);

                if (!isPromise(tmpRes)) {
                    tmpRes = Promise.resolve(tmpRes);
                }

                res.push(tmpRes);
            }

            // 子模块的 dispatch
            if (this._modules) {
                const moduleNames = Object.keys(this._modules);

                for (let i = 0, l = moduleNames.length; i < l; ++i) {
                    res.push(this._modules[moduleNames[i]]._dispatch({
                        type: types[0],
                        payload,
                        rootState,
                    }));
                }
            }

            return Promise.all(res);
        } else if (this._modules && this._modules[types[0]]) {
            // 长度为 1 以上的话, 就代表了当前实例不是事件需要触发的目标
            // 找对应的子模块
            // 子模块存在的情况下, 去掉当前的模块的命名空间, 把事件传进去

            res = this._modules[types[0]]._dispatch({
                type: types.slice(1).join('/'),
                payload,
                rootState,
            });

            if (!isPromise(res)) {
                res = Promise.resolve(res);
            }

            return res;
        } else {
            // 没有对应的 action 的情况
            // 这里就 return undefined 就好了
            return ;
        }
    }

    /**
     * 调用 action
     * 至少在我这里就是语法糖, 可能会有问题吧
     * @todo async 没试过
     * @todo 在面对 module 时可能需要改成和 vuex 一样的
     * @todo rootState
     * @param type
     * @param payload
     */
    dispatch = (type, payload) => {
        if ('string' === typeof(type)) {
            // 不处理
        } else if ('object' === typeof(type)) {
            // 底下确定只有在 dispatch 函数内部调用子的时候 object 中会传 isChild
            // 其他情况就当是用户调用根, 直接赋值 this.state 就好了
            payload = type;
            type = type.type;
            // 删掉 type, 其他的都是 payload
            delete payload.type;
        } else {
            // 其他情况下应该是有错的
            throw new Error('commit with incorrect parameter');
        }

        this._dispatch({
            type,
            payload,
            rootState: this.state,
        });
    };

    _commit({type, payload,}) {
        // 分割事件
        // 想了想还是要把有人手抖写了两个斜线 // 的情况排除掉
        const types = type.split('/').filter(item => item);

        if (0 === types.length) {
            throw new Error('invalid commit type');
        } else if (1 === types.length) {
            // 长度为 1 的情况代表了就是要唤起当前 store / 当前的子 store 的某个事件的情况

            // 如果当前 store 的事件存在就调用当前的事件
            if (this._mutations && hasOwn(this._mutations, types[0]) &&
                'function' === typeof(this._mutations[types[0]])
            ) {
                this._mutations[types[0]](this.state, payload);
            }

            // 子模块的 commit
            if (this._modules) {
                const moduleNames = Object.keys(this._modules);

                for (let i = 0, l = moduleNames.length; i < l; ++i) {
                    this._modules[moduleNames[i]]._commit({
                        type: types[0],
                        payload,
                    });
                }
            }
        } else if (this._modules && this._modules[types[0]]) {
            // 长度为 1 以上的话, 就代表了当前实例不是事件需要触发的目标
            // 找对应的子模块
            // 子模块存在的情况下, 去掉当前的模块的命名空间, 把事件传进去

            this._modules[types[0]]._commit({
                type: types.slice(1).join('/'),
                payload,
            });
        }
    }

    /**
     * 用来调用 mutations
     * 好像 mutation 不需要处理 root 属性
     * @todo 注册事件到 root 的情况
     * @todo 可能需要拆分成内部外部两个函数, 全用一个函数承载有点受不了
     * 这个地方需要区分两种情况:
     * 用户调用的还是我的代码循环调用的
     *
     * @param type
     * @param payload
     */
    commit = (type, payload) => {
        if ('string' === typeof(type)) {
            // 不处理
        } else if ('object' === typeof(type)) {
            // 非子就直接获取 type 参数
            // 非子的情况下 type 上也不可能存在 _isChild 属性
            payload = type;
            type = type.type;
            // 删掉 type, 其他的都是 payload
            delete payload.type;
        } else {
            // 其他情况下应该是有错的
            throw new Error('commit with incorrect parameter');
        }

        this._commit({
            type,
            payload,
        });
    };

    /**
     * @todo 这里因为 state 结构的改变, 判断条件等需要重写
     * @param path
     * @param config
     */
    registerModule = (path, config) => {
        if (Array.isArray(path) && 1 < path.length) {
            // 如果下一个人存在, 那就交给下一个人去做
            if (this._modules && this._modules[path[0]]) {
                this._modules[path[0]].registerModule(path.slice(1), config);
            } else {
                // 应该报错
                throw new Error('新 module 只能声明在 module 上!');
            }
        } else if ('string' === typeof(path) || (Array.isArray(path) && 1 === path.length)) {
            // 如果 path 长度只有 1 那么应该也就是在自己上面玩了
            if (Array.isArray(path)) {
                path = path[0];
            }

            if (this._modules[path]) {
                throw new Error('请不要重复定义 module');
            }

            this._registerModule(this, config, path);
        } else {
            throw new Error('path 只可以是字符串或数组');
        }

        // 当前新注册的 module 的路径
        // path 是数组的情况只存在于还有好多嵌套的情况下
        const pathString = Array.isArray(path) ? path.join('.') : path;

        if (this.state && Array.isArray(this.state._watchers)) {
            // 因为下面可能 teardown, 所以先复制一份为妙
            const watchers = this.state._watchers.slice();

            for (let i = 0; i < watchers.length; ++i) {
                const item = watchers[i];
                // 这个地方的 set 导致了只要调用了 setIn, 就会让 watcher 的参数出错的问题
                // 所以这个地方需要根据 path 对 watcher 的 expression 对比, 如果对应上了, 再去重做
                //TODO 这个地方重点观察, 我把它的 indexOf 的调用和被调用关系对调过来了
                //TODO 因为现在情况是可能一开始监听了一个属性, 后来这个属性被 module 覆盖了, 那么应该也要触发 cb 的
                //TODO 此时 pathString === module 路径, item.expression > pathString
                if (0 === item.expression.indexOf(pathString)) {
                    // 如果已经有监听这个东西的 watcher 了, 那么就要去删除并重建
                    // 上面已经通过 throw error 消灭了重复定义 module 的情况了, 所以直接搞 watcher 应该没问题
                    const key = item.expression;
                    const cb = item.cb;
                    item.teardown();
                    const watcher = this.watch(key, cb);
                    // 试试能不能通过黑科技来触发 cb
                    //TODO 这里手动使用了 nextTick, 不一定稳妥, 需要再次 review
                    nextTick(() => {
                        watcher.value = undefined;
                        watcher.run();
                    });
                }
            }
        }
    }

    _registerModule = (vm, config, moduleName) => {
        const parameter = {
            // namespace 默认空字符串
            namespace: '',

            ...config,
        };

        if (parameter.namespaced) {
            // 启用命名空间的情况下就把命名空间名字传进去
            parameter.namespace = moduleName;
        }

        if (this._namespace) {
            // 这么写可以非常棒的加上命名空间的斜线
            // _namespace 必存在
            // _namespace 不存在的情况下, 实例的 namespace 完全由自己决定
            // namespace 不存在的情况:
            // ['xxx', ''] == filter ==> ['xxx'] == join ==> 'xxx'
            // namespace 存在的情况:
            // ['xxx', 'yyy'] == filter ==> ['xxx', 'yyy'] == join ==> 'xxx/yyy'
            parameter.namespace = [this._namespace, parameter.namespace].filter(item => item).join('/');
        }

        const instance = new Store(parameter);

        // 标记这个是个 module
        //TODO 这个不知道还要不要用
        //TODO watch 的时候看看怎么处理
        Object.defineProperty(instance.state, '_isModule', {
            configurable: false,
            enumerable: false,
            writable: false,
            value: true,
        });

        // 这个地方直接全都 false 了, 真重名了的话调用方自己反省
        // 生气了, 直接把值定到 state 里面去
        // 但是按理来说这里不应该这么做的,
        // 毕竟这算是 Store 的事情, 不应该扯到数据上去的
        Object.defineProperty(vm.state, moduleName, {
            configurable: false,
            enumerable: false,
            writable: false,
            value: instance.state,
        });

        if (!vm._modules) {
            Object.defineProperty(vm, '_modules', {
                configurable: false,
                enumerable: false,
                writable: false,
                value: [],
            });
        }

        vm._modules[moduleName] = instance;
    }
}

export default {
    Store,
};

// 从 vuex 里抄出来的功能函数

function isPromise (val) {
    return val && typeof val.then === 'function';
}
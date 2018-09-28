'use strict';

import {
    generateParser,
    handleError,
    isObject,
    remove,
} from './util/index';

// 这个 reference 好像没用
/// <reference path="../src/index.d.ts" />
import {GameStoreData} from '../src/index';

import Dep, { pushTarget, popTarget, } from './dep';
import { traverse, } from './traverse';
import { queueWatcher, } from './scheduler';

let uid: number = 0;

export interface WatcherBase {
    expression: string;
    get: () => any,
    teardown: () => void,
    run: () => void,
    value: any,
    cb: (val: any, oldVal: any) => void,
}

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 * 翻译:
 * watcher 解析表达式, 收集依赖, 并且当表达式的值发生变化的时候调用回调.
 * $watch() API 和指令都是用的这个.
 */
export default class Watcher implements WatcherBase {
    vm: GameStoreData;      //TODO
    deep: boolean;
    user: boolean;
    dirty: boolean;         //TODO 这个不知道是干啥的
    before: () => void;     //TODO 删掉
    cb: (val: any, oldVal: any) => void;
    /**
     * watcher 的 id
     */
    id: number;
    active: boolean;

    dep: Dep;
    deps: Dep[];            //TODO
    newDeps: Dep[];         //TODO
    depIds: Set<number>;
    newDepIds: Set<number>;

    /**
     * 属性的字符串
     */
    expression: string;
    /**
     * 获取目标值用
     */
    getter: (obj: object) => any | void;
    /**
     * 当前对应的数据
     */
    value: any;

    /**
     * vm 用不到, 删掉了
     * @param vm {*}
     * @param expOrFn {string|Function}
     * @param cb {Function}
     * @param options {Object?}
     *
     * @edited sync 不知道到底干啥, 删掉了
     * @edited computed 肯定没有, 之间删掉了
     * @edited dirty 因为是通过 computed 计算出来的, 所以删掉了
     * @edited isRenderWatcher 这个的作用找不出来, 先干掉了
     * @todo 要不要把 computed 做出来, 这个代价有点大
     */
    constructor(vm: GameStoreData, expOrFn: string | ((obj: object) => any), cb: (val: any, oldVal: any) => any, options?: { deep?: boolean, user?: boolean, before?: () => void, }) {
        this.vm = vm;
        vm._watchers.push(this);

        // options
        if (options) {
            //TODO 看看 user 需要不需要删掉
            this.deep = !!options.deep;
            this.user = !!options.user;
            this.before = options.before;
        } else {
            this.deep = this.user = false;
        }
        this.cb = cb;
        this.id = ++uid; // uid for batching
        this.active = true;
        this.deps = [];
        this.newDeps = [];
        this.depIds = new Set();
        this.newDepIds = new Set();
        this.expression = expOrFn.toString();
        // parse expression for getter
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn;
        } else {
            this.getter = generateParser(expOrFn);
            // 那如果我监视一个目前还没有注册的属性呢, 会怎么样

            if (!this.getter) {
                this.getter = () => {};

                console.warn(
                    `Failed watching path: "${expOrFn}" ` +
                    'Watcher only accepts simple dot-delimited paths. ' +
                    'For full control, use a function instead.',
                    vm
                );
            }
        }

        // 因为这个 100% 不可能有 computed 这种东西, 所以直接删掉了
        this.value = this.get();
    }

    /**
     * Evaluate the getter, and re-collect dependencies.
     * 翻译:
     * 运行 getter, 并且重新收集依赖.
     *
     * @desc 所以这里的逻辑就是先逐个分析, 然后去掉没有的依赖?
     * @desc 这里会深度分析自己内部的每一个值, 这样的话内部的每一个值变化了都会通知到这个对象上
     * @desc 也就是说如果不带 deep 的话, 只会触发指定对象的 listener, 带了才会一路冒泡上去
     * @desc 不带的话就需要去仔细的监听 a.b.c.0.a 这种东西, 肯定要爆炸的
     */
    get(): any {
        // 将 target(自己) push 进去? 这步操作目前读不懂
        pushTarget(this);

        let value: any;
        //TODO
        const vm: GameStoreData = this.vm; // 其实 vm 相当于 this 指针?

        try {
            value = this.getter.call(vm, vm);
        } catch (e) {
            if (this.user) {
                handleError(e, vm, `getter for watcher "${this.expression}"`);
            } else {
                throw e;
            }
        } finally {
            // "touch" every property so they are all tracked as
            // dependencies for deep watching
            // 翻译:
            // “触碰”每个属性来跟踪他们以便深度监听.
            if (this.deep) {
                traverse(value);
            }
            // 上面读不懂的主要原因是下面这里也没接住 pop 出来的 target 啊
            popTarget();
            this.cleanupDeps();
        }
        return value;
    }

    /**
     * Add a dependency to this directive.
     * @param dep {Dep}
     */
    addDep(dep: Dep): void {
        const id: number = dep.id;
        // 只有没有添加过依赖的才可以进去
        if (!this.newDepIds.has(id)) {
            // 添加 ID 到记录中
            this.newDepIds.add(id);
            // 添加对象到记录中
            this.newDeps.push(dep);
            // 当前已经在线的依赖 ID 中没有对应的 dep 时则会把自己添加到 dep 的监听中
            if (!this.depIds.has(id)) {
                dep.addSub(this);
            }
        }
    }

    /**
     * Clean up for dependency collection.
     * 翻译:
     * 清理依赖记录.
     * @notice 这里总共有 deps / newDeps / depIds / newDepIds 四个变量
     */
    cleanupDeps(): void {
        let i: number = this.deps.length;

        while (i--) {
            const dep: Dep = this.deps[i];
            if (!this.newDepIds.has(dep.id)) {
                dep.removeSub(this);
            }
        }
        // 这一步是 depIds 和 newDepIds 交换
        let tmp: Set<number> | Dep[] = this.depIds;
        this.depIds = this.newDepIds;
        this.newDepIds = tmp;
        // 清空交换后的 newDeps
        this.newDepIds.clear();
        // 交换 deps 和 newDeps
        tmp = this.deps;
        this.deps = this.newDeps;
        this.newDeps = tmp;
        // 清空交换后的 newDeps
        this.newDeps.length = 0;
        // 综上所述:
        // 把 newDepIds 里的设置到了 depIds 上
        // 把 newDeps 里的设置到了 deps 上
        // 然后清空了 newDepIds 和 newDeps
    }

    /**
     * Subscriber interface.
     * Will be called when a dependency changes.
     * 翻译:
     * 订阅者接口.
     * 在依赖更新时调用.
     *
     * @desc 因为这里也没有 computed 也不知道 sync 是干啥的, 所以我全都删了
     */
    update(): void {
        queueWatcher(this);
    }

    /**
     * Scheduler job interface.
     * Will be called by the scheduler.
     * 调度程序处理接口.
     * 调度程序中会调用这个接口.
     */
    run(): void {
        if (this.active) {
            this.getAndInvoke(this.cb);
        }
    }

    /**
     * 执行 watcher 的 cb
     * @param cb {Function}
     */
    getAndInvoke(cb: (val: any, oldVal: any) => any): void {
        // 执行 get 函数获取数值, 顺便更新依赖(get 里面会 set Dep.target, 并且还会触发 observer 里的依赖分析)
        const value: any = this.get();

        if (
            value !== this.value ||
            // Deep watchers and watchers on Object/Arrays should fire even
            // when the value is the same, because the value may
            // have mutated.
            // 翻译:
            // 即使 value 值没有变, 深度监听的情况和 watcher 被附在对象 / 数组上的情况中
            // 都应该触发对应 watcher, 因为它们内部的值可能有改变.
            isObject(value) ||
            this.deep
        ) {
            // set new value
            // 读出目前的值
            const oldValue: any = this.value;
            // 修改属性值
            this.value = value;
            this.dirty = false;
            // 因为我们的情景都是用户绑定的, 所以这里就把非用户绑定的部分删掉了
            // 调用 callback
            try {
                cb.call(this.vm, value, oldValue);
            } catch (e) {
                handleError(e, this.vm, `callback for watcher "${this.expression}"`);
            }
        }
    }

    /**
     * Evaluate and return the value of the watcher.
     * This only gets called for computed property watchers.
     * 翻译:
     * 计算 watcher 的值.
     * 只应该被 computed 属性的 watcher 调用.
     */
    evaluate(): any {
        if (this.dirty) {
            this.value = this.get();
            this.dirty = false;
        }
        return this.value;
    }

    /**
     * Depend on this watcher. Only for computed property watchers.
     * 翻译:
     * 依赖本 watcher. 只应该被 computed 属性的 watcher 调用.
     */
    depend(): void {
        if (this.dep && Dep.target) {
            this.dep.depend();
        }
    }

    /**
     * Remove self from all dependencies' subscriber list.
     * 翻译:
     * 把自己从所有的监听者中移除掉
     *
     * @desc 但我的 vm 树就是根, 如果根没了, 整个逻辑应该也就都结束了
     */
    teardown(): void {
        if (this.active) {
            // remove self from vm's watcher list
            // this is a somewhat expensive operation so we skip it
            // if the vm is being destroyed.
            // 翻译:
            // 把自己从 vm 的 watcher 列表中移除
            // 如果 vm 已经被销毁了, 那么这个操作就有点多余了, 那就直接跳过
            if (!this.vm._isBeingDestroyed) {
                remove(this.vm._watchers, this);
            }
            let i: number = this.deps.length;
            while (i--) {
                this.deps[i].removeSub(this);
            }
            this.active = false;
        }
    }
}


/**
 * watcher 的代理壳
 * 因为在 dataStore 实例中, 对子 module 的监听是直接交给了子 module 进行的,
 * 因而父层失去了对子层 watcher 的控制权, 在重建监听层时也无法触及到这里,
 * 所以需要建立一个代理壳, 在当前实例上接收子 module 传来的 watcher 示例,
 * 并代理对它的一些主要外部操作 (expression 判断 / value 赋值 / get 调用),
 * 这样在父层上有什么操作就一定会因为遍历到了这个假的 watcher 从而传递到内部.
 */
export class WatcherShell implements WatcherBase {
    expression: string;
    target: Watcher;
    //TODO 这里会有问题
    cb: undefined = undefined;

    constructor(vm: GameStoreData, expOrFn: string | ((obj: object) => any), target: Watcher) {
        vm._watchers.push(this);
        this.expression = expOrFn.toString();
        this.target = target;
    }

    get(): any {
        return this.target.get();
    }

    teardown(): void {
        return this.target.teardown();
    }

    run(): void {
        return this.target.run();
    }

    public get value(): any {
        return this.target.value;
    }

    public set value(newVal: any) {
        this.target.value = newVal;
    }
}
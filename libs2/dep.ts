'use strict';

// Dep 统计用的 uid
import Watcher from "./watcher";

let uid: number = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 * 翻译:
 * DEP 对象是一个可被多个指令订阅的对象.
 */
export default class Dep {

    /**
     * 被指定的当前 watcher, 一般在新建新的 watcher 时才会被指定, 新建 watcher 时会遍历所有对应变量, 以便添加依赖
     *
     * the current target watcher being evaluated.
     * this is globally unique because there could be only one
     * watcher being evaluated at any time.
     * 翻译:
     * 当前运行的 watcher 对象.
     * 这个属性必须是全局的, 因为任何时候都只应该有一个属性被添加监听.
     *
     * @type {?Watcher}
     */
    static target?: WatcherBase = null;
    /**
     * @type {number}
     */
    id: number;
    /**
     * 监听者数组
     * @type {Array<Watcher>}
     */
    subs: WatcherBase[] = [];

    constructor () {
        this.id = ++uid;
    }

    /**
     * @param sub {Watcher}
     */
    addSub (sub: Watcher): void {
        this.subs.push(sub);
    }

    /**
     * @param sub {Watcher}
     */
    removeSub (sub: Watcher): void {
        remove(this.subs, sub);
    }

    /**
     * 向全局缓存的 target 上添加自己的依赖
     */
    depend (): void {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }

    /**
     * 通知自己的每个监听项, 我更新了
     */
    notify (): void {
        // stabilize the subscriber list first
        // 为了防止数组有变化, 先拷贝一份需要通知的数组
        const subs = this.subs.slice();
        for (let i = 0, l = subs.length; i < l; i++) {
            subs[i].update();
        }
    }
}

// 这个数组也不知道是干啥的, 啥时候用, 只知道下面这两个函数在不停的 push pop
const targetStack: WatcherBase[] = [];

/**
 * @param _target {?Watcher}
 */
export function pushTarget (_target: Watcher): void {
    if (Dep.target) targetStack.push(Dep.target);
    Dep.target = _target;
}

export function popTarget (): void {
    Dep.target = targetStack.pop();
}
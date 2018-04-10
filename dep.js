/**
 * Created by kelvinsun on 18/4/10.
 */

import {remove} from './util.js';

// Dep 统计用的 uid
let uid = 0;

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
    // /**
    //  * @type {?Watcher}
    //  */
    // static target;
    // /**
    //  * @type {number}
    //  */
    // id;
    // /**
    //  * @type {Array<Watcher>}
    //  */
    // subs = [];

    constructor () {
        this.id = ++uid;
        this.subs = [];
    }

    /**
     * @param sub {Watcher}
     */
    addSub (sub) {
        this.subs.push(sub);
    }

    /**
     * @param sub {Watcher}
     */
    removeSub (sub) {
        remove(this.subs, sub);
    }

    /**
     * 向全局缓存的 target 上添加自己的依赖
     */
    depend () {
        if (Dep.target) {
            Dep.target.addDep(this);
        }
    }

    /**
     * 通知自己的每个监听项, 我更新了
     */
    notify () {
        // stabilize the subscriber list first
        const subs = this.subs.slice();
        for (let i = 0, l = subs.length; i < l; i++) {
            subs[i].update();
        }
    }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null;
const targetStack = [];

/**
 *
 * @param _target {?Watcher}
 */
export function pushTarget (_target) {
    if (Dep.target) targetStack.push(Dep.target);
    Dep.target = _target;
}

export function popTarget () {
    Dep.target = targetStack.pop();
}


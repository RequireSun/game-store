/* @flow */

import {
    isObject,
    parsePath,
    handleError,
} from './util.js';

import Dep, {pushTarget, popTarget} from './dep.js';

import {traverse} from './traverse.js';

let uid = 0;

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
export default class Watcher {
    // /**
    //  * @todo 这个部分可能还是需要保留
    //  */
    // vm;
    // /**
    //  * @type {string}
    //  */
    // expression;
    // /**
    //  * @type {Function}
    //  */
    // cb;
    // /**
    //  * @type {number}
    //  */
    // id;
    // /**
    //  * @type {boolean}
    //  */
    // deep;
    // /**
    //  * @type {boolean}
    //  */
    // user;
    // /**
    //  * @type {boolean}
    //  */
    // computed;
    // /**
    //  * @type {boolean}
    //  */
    // sync;
    // /**
    //  * @type {boolean}
    //  */
    // dirty;
    // /**
    //  * @type {boolean}
    //  */
    // active;
    // /**
    //  * @type {Dep}
    //  */
    // dep;
    // /**
    //  * @type {Array<Dep>}
    //  */
    // deps;
    // /**
    //  * @type {Array<Dep>}
    //  */
    // newDeps;
    // /**
    //  * @type {SimpleSet}
    //  */
    // depIds;
    // /**
    //  * @type {SimpleSet}
    //  */
    // newDepIds;
    // /**
    //  * @type {?Function}
    //  */
    // before;
    // /**
    //  * @type {Function}
    //  */
    // getter;
    // /**
    //  * @type {*}
    //  */
    // value;

    /**
     * vm 用不到, 删掉了
     * @param vm {*}
     * @param expOrFn {string|Function}
     * @param cb {Function}
     * @param options {?Object}
     * @param isRenderWatcher {?boolean}
     */
    constructor(vm, expOrFn, cb, options, isRenderWatcher) {
        this.vm = vm;
        if (isRenderWatcher) {
            vm._watcher = this;
        }
        vm._watchers.push(this);
        // options
        if(options) {
            this.deep = !!options.deep;
            this.user = !!options.user;
            this.computed = !!options.computed;
            this.sync = !!options.sync;
            this.before = options.before;
        } else {
            this.deep = this.user = this.computed = this.sync = false
        }
        this.cb = cb;
        this.id = ++uid; // uid for batching
        this.active = true;
        this.dirty = this.computed; // for computed watchers
        this.deps = [];
        this.newDeps = [];
        this.depIds = new Set();
        this.newDepIds = new Set();
        this.expression = expOrFn.toString();
        // parse expression for getter
        if (typeof expOrFn === 'function') {
            this.getter = expOrFn
        } else {
            this.getter = parsePath(expOrFn);

            if (!this.getter) {
                this.getter = function () {};
                console.warn(
                    `Failed watching path: "${expOrFn}" ` +
                    'Watcher only accepts simple dot-delimited paths. ' +
                    'For full control, use a function instead.',
                    vm
                );
            }
        }

        if (this.computed) {
            this.value = undefined;
            this.dep = new Dep();
        } else {
            this.value = this.get();
        }
    }

    /**
     * Evaluate the getter, and re-collect dependencies.
     */
    get() {
        pushTarget(this);
        let value;
        const vm = this.vm;
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
            if (this.deep) {
                traverse(value);
            }
            popTarget();
            this.cleanupDeps();
        }
        return value;
    }

    /**
     * Add a dependency to this directive.
     * @param dep {Dep}
     */
    addDep(dep) {
        const id = dep.id;
        if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id);
            this.newDeps.push(dep);
            if (!this.depIds.has(id)) {
                dep.addSub(this);
            }
        }
    }

    /**
     * Clean up for dependency collection.
     */
    cleanupDeps() {
        let i = this.deps.length;
        while (i--) {
            const dep = this.deps[i];
            if (!this.newDepIds.has(dep.id)) {
                dep.removeSub(this);
            }
        }
        let tmp = this.depIds;
        this.depIds = this.newDepIds;
        this.newDepIds = tmp;
        this.newDepIds.clear();
        tmp = this.deps;
        this.deps = this.newDeps;
        this.newDeps = tmp;
        this.newDeps.length = 0;
    }

    /**
     * Subscriber interface.
     * Will be called when a dependency changes.
     */
    update() {
        /* istanbul ignore else */
        if (this.computed) {
            // A computed property watcher has two modes: lazy and activated.
            // It initializes as lazy by default, and only becomes activated when
            // it is depended on by at least one subscriber, which is typically
            // another computed property or a component's render function.
            if (this.dep.subs.length === 0) {
                // In lazy mode, we don't want to perform computations until necessary,
                // so we simply mark the watcher as dirty. The actual computation is
                // performed just-in-time in this.evaluate() when the computed property
                // is accessed.
                this.dirty = true;
            } else {
                // In activated mode, we want to proactively perform the computation
                // but only notify our subscribers when the value has indeed changed.
                this.getAndInvoke(() => {
                    this.dep.notify();
                });
            }
        } else if (this.sync) {
            this.run();
        } else {
            queueWatcher(this);
        }
    }

    /**
     * Scheduler job interface.
     * Will be called by the scheduler.
     */
    run() {
        if (this.active) {
            this.getAndInvoke(this.cb);
        }
    }

    /**
     * @param cb {Function}
     */
    getAndInvoke(cb) {
        const value = this.get();
        if (
            value !== this.value ||
            // Deep watchers and watchers on Object/Arrays should fire even
            // when the value is the same, because the value may
            // have mutated.
            isObject(value) ||
            this.deep
        ) {
            // set new value
            const oldValue = this.value;
            this.value = value;
            this.dirty = false;
            if (this.user) {
                try {
                    cb.call(this.vm, value, oldValue);
                } catch (e) {
                    handleError(e, this.vm, `callback for watcher "${this.expression}"`);
                }
            } else {
                cb.call(this.vm, value, oldValue);
            }
        }
    }

    /**
     * Evaluate and return the value of the watcher.
     * This only gets called for computed property watchers.
     */
    evaluate() {
        if (this.dirty) {
            this.value = this.get();
            this.dirty = false;
        }
        return this.value
    }

    /**
     * Depend on this watcher. Only for computed property watchers.
     */
    depend() {
        if (this.dep && Dep.target) {
            this.dep.depend()
        }
    }

    /**
     * Remove self from all dependencies' subscriber list.
     */
    teardown() {
        if (this.active) {
            // remove self from vm's watcher list
            // this is a somewhat expensive operation so we skip it
            // if the vm is being destroyed.
            if (!this.vm._isBeingDestroyed) {
                remove(this.vm._watchers, this);
            }
            let i = this.deps.length;
            while (i--) {
                this.deps[i].removeSub(this);
            }
            this.active = false;
        }
    }

}

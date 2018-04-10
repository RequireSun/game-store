/* @flow */
/* globals MessageChannel */

import { noop } from 'shared/util';
import { handleError } from '../js/util.js';
import { isIOS, isNative } from './env';

const callbacks = [];
let pending = false;

/**
 * 一股脑执行 callback
 */
function flushCallbacks () {
    // 将阻塞设为 false
    pending = false;
    // 为了防止被搞乱, 复制一份出来
    const copies = callbacks.slice(0);
    // 清空当前 callback 列表
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
        // 逐个执行
        copies[i]();
    }
}

// Here we have async deferring wrappers using both microtasks and (macro) tasks.
// In < 2.4 we used microtasks everywhere, but there are some scenarios where
// microtasks have too high a priority and fire in between supposedly
// sequential events (e.g. #4521, #6690) or even between bubbling of the same
// event (#6566). However, using (macro) tasks everywhere also has subtle problems
// when state is changed right before repaint (e.g. #6813, out-in transitions).
// Here we use microtask by default, but expose a way to force (macro) task when
// needed (e.g. in event handlers attached by v-on).
// 翻译:
// 我们同时使用 microtasks 和 (macro) tasks 来进行异步延迟执行的包装.
// 在 2.4 以下的版本, 我们全部都用的 microtasks, 但是在某些情况下, microtasks 的优先级太高了,
// 使他有可能会在两个一般应该接连运行的事件中间触发 (e.g. #4521, #6690), 或是在同一个事件的冒泡过程中被触发 (#6566).
// 然而, 全部使用 (macro) tasks 的话也会在 state 刚刚好在重绘 (repaint) 之前触发的这种情况下产生一些小小的问题 (e.g. #6813, out-in transitions).
// 所以我们默认使用 microtask, 但是也暴露了一个方法以在必要时强制使用 (macro) task (e.g. 在通过 v-on 绑定的事件处理中).
let microTimerFunc;
let macroTimerFunc;
let useMacroTask = false;

// Determine (macro) task defer implementation.
// Technically setImmediate should be the ideal choice, but it's only available
// in IE. The only polyfill that consistently queues the callback after all DOM
// events triggered in the same loop is by using MessageChannel.
/* istanbul ignore if */
if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
    macroTimerFunc = () => {
        setImmediate(flushCallbacks)
    }
} else if (typeof MessageChannel !== 'undefined' && (
        isNative(MessageChannel) ||
        // PhantomJS
        MessageChannel.toString() === '[object MessageChannelConstructor]'
    )) {
    const channel = new MessageChannel()
    const port = channel.port2
    channel.port1.onmessage = flushCallbacks
    macroTimerFunc = () => {
        port.postMessage(1)
    }
} else {
    /* istanbul ignore next */
    macroTimerFunc = () => {
        setTimeout(flushCallbacks, 0)
    }
}

// Determine microtask defer implementation.
/* istanbul ignore next, $flow-disable-line */
if (typeof Promise !== 'undefined' && isNative(Promise)) {
    const p = Promise.resolve()
    microTimerFunc = () => {
        p.then(flushCallbacks)
        // in problematic UIWebViews, Promise.then doesn't completely break, but
        // it can get stuck in a weird state where callbacks are pushed into the
        // microtask queue but the queue isn't being flushed, until the browser
        // needs to do some other work, e.g. handle a timer. Therefore we can
        // "force" the microtask queue to be flushed by adding an empty timer.
        if (isIOS) setTimeout(noop)
    }
} else {
    // fallback to macro
    microTimerFunc = macroTimerFunc
}

/**
 * Wrap a function so that if any code inside triggers state change,
 * the changes are queued using a (macro) task instead of a microtask.
 */
export function withMacroTask (fn: Function): Function {
    return fn._withTask || (fn._withTask = function () {
        useMacroTask = true
        const res = fn.apply(null, arguments)
        useMacroTask = false
        return res
    })
}

/**
 * @param cb {?Function}
 * @param ctx {?Object}
 */
export function nextTick (cb, ctx) {
    let _resolve;

    callbacks.push(() => {
        if (cb) {
            // 如果传 callback 了, 就直接执行
            try {
                cb.call(ctx);
            } catch (e) {
                handleError(e, ctx, 'nextTick');
            }
        } else if (_resolve) {
            // 否则如果 _resolve 存在, 也直接执行
            _resolve(ctx);
        }
    });

    if (!pending) {
        // 如果没有阻塞的就运行, 并且设置阻塞
        pending = true;
        // 这个地方的区别看一下
        if (useMacroTask) {
            macroTimerFunc();
        } else {
            microTimerFunc();
        }
    }
    // 如果传 callback 并且还支持 promise
    // $flow-disable-line
    if (!cb && typeof Promise !== 'undefined') {
        // 返回一个 promise 给外面, 里面的 resolve 运行完了外面的 promise 就会收到 then
        return new Promise(resolve => {
            _resolve = resolve
        });
    }
}
/**
 * Created by kelvinsun on 18/4/10.
 */
import {nextTick} from './next-tick.js';

/**
 * @type {{key{number}: ?true}}
 */
let has = {};
/**
 * @type {Array<Watcher>}
 */
const queue = [];
let flushing = false;
let index = 0;
let waiting = false;

/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
    flushing = true
    let watcher, id

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    queue.sort((a, b) => a.id - b.id)

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    for (index = 0; index < queue.length; index++) {
        watcher = queue[index]
        if (watcher.before) {
            watcher.before()
        }
        id = watcher.id
        has[id] = null
        watcher.run()
        // in dev build, check and stop circular updates.
        if (process.env.NODE_ENV !== 'production' && has[id] != null) {
            circular[id] = (circular[id] || 0) + 1
            if (circular[id] > MAX_UPDATE_COUNT) {
                warn(
                    'You may have an infinite update loop ' + (
                        watcher.user
                            ? `in watcher with expression "${watcher.expression}"`
                            : `in a component render function.`
                    ),
                    watcher.vm
                )
                break
            }
        }
    }

    // keep copies of post queues before resetting state
    const activatedQueue = activatedChildren.slice()
    const updatedQueue = queue.slice()

    resetSchedulerState()

    // call component updated and activated hooks
    callActivatedHooks(activatedQueue)
    callUpdatedHooks(updatedQueue)

    // devtool hook
    /* istanbul ignore if */
    if (devtools && config.devtools) {
        devtools.emit('flush')
    }
}

/**
 * Push a watcher into the watcher queue.
 * Jobs with duplicate IDs will be skipped unless it's
 * pushed when the queue is being flushed.
 * 翻译:
 * 将一个 watcher 推到 watcher 的队列中.
 * ID 重复的项将不会被触发, 除非它是队列更新后再 push 进来的.
 *
 * @param watcher {Watcher}
 */
export function queueWatcher (watcher) {
    const id = watcher.id;

    // 没有被记录过才会进得来
    if (has[id] == null) {
        // 记录
        has[id] = true;

        if (!flushing) {
            // 非清理状态直接 push
            queue.push(watcher);
        } else {
            // if already flushing, splice the watcher based on its id
            // if already past its id, it will be run next immediately.
            // 翻译:
            // 如果正在清理状态中, 基于 watcher 的 id 把它合并到队列中
            // 如果之前传过这个 id 的 watcher, 传入的就会在下一个 tick 立刻运行
            let i = queue.length - 1;
            // 找到比 index 大, 但是 id 却比传入的 id 大的项
            while (i > index && queue[i].id > watcher.id) {
                i--;
            }
            // 把当前 watcher 插入进去
            queue.splice(i + 1, 0, watcher);
        }
        // queue the flush
        // 冲刷队列
        // 当前没有在冲刷的情况下才去执行冲刷
        if (!waiting) {
            waiting = true;
            nextTick(flushSchedulerQueue);
        }
    }
}


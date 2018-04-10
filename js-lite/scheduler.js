/**
 * Created by kelvinsun on 18/4/10.
 */
import {nextTick} from './next-tick.js';

export const MAX_UPDATE_COUNT = 100;
/**
 * 记录有哪些 watcher 需要被执行
 * @type {{key{number}: true?}}
 */
let has = {};
/**
 * 用来记录环形依赖
 * @type {{key{number}: {number}}}
 */
let circular = {};
/**
 * @type {Array<Watcher>}
 */
const queue = [];
/**
 *
 * @type {Array<Component>}
 */
const activatedChildren = [];
let flushing = false;
let index = 0;
let waiting = false;

/**
 * Reset the scheduler's state.
 * 翻译:
 * 重置调度函数的状态
 */
function resetSchedulerState () {
    // 重置游标位置和队列以及执行了的子数组
    index = queue.length = activatedChildren.length = 0;
    // 重置 watcher 是否存在标记
    has = {};
    // 环形计数也重置
    circular = {};
    // 等待标记和是否已冲掉的标记
    waiting = flushing = false
}

/**
 * Flush both queues and run the watchers.
 * 翻译:
 * 冲掉现有对联并且运行 watcher 们.
 */
function flushSchedulerQueue () {
    // 标记为已冲掉
    flushing = true;
    let watcher, id;

    // Sort queue before flush.
    // This ensures that:
    // 1. Components are updated from parent to child. (because parent is always
    //    created before the child)
    // 2. A component's user watchers are run before its render watcher (because
    //    user watchers are created before the render watcher)
    // 3. If a component is destroyed during a parent component's watcher run,
    //    its watchers can be skipped.
    // 翻译:
    // 在冲掉队列前先进行排列.
    // 这么做是为了保证这些条件:
    // 1. 确保组件的更新是由父到子的. (因为父组件永远都比子组件先创建)
    // 2. 组件的用户 watcher 要在渲染 watcher 之前运行. (因为用户监听事件是在渲染 watcher 之前创建的)
    // 3. 如果一个组件在父组件的 watcher 运行时被销毁了, 那么应该跳过它的 watcher.
    //
    // 因为随着新对象的创建, id 是自增的, 所以直接按照 id 升序排列就可以了
    queue.sort((a, b) => a.id - b.id);

    // do not cache length because more watchers might be pushed
    // as we run existing watchers
    // 翻译:
    // 不要缓存长度, 因为在我们执行 watcher 的过程中可能会有新的 watcher push 进来
    for (index = 0; index < queue.length; index++) {
        // index 用于标记执行到了的位置, 一直推进到尾部
        watcher = queue[index];
        // 如果在 watcher 上有声明 before 就先执行 before
        if (watcher.before) {
            watcher.before();
        }
        // 置空当前正在处理的 watcher, 意味着在当前事件处理中已经执行过 watcher 了, 再来就是新的事件了
        id = watcher.id;
        has[id] = null;
        // 执行 watcher 的 invoke 方法, 触发设置的回调
        watcher.run();
        // in dev build, check and stop circular updates.
        // 在 dev 环境, 校验并且停止循环更新
        // ??? 这个到底是干啥的
        // 如果当前的这个 id 不在标记内
        if (has[id] != null) {
            // 给循环引用标记 +1
            circular[id] = (circular[id] || 0) + 1;
            // 如果更新数量超限了, 就直接警告
            if (circular[id] > MAX_UPDATE_COUNT) {
                console.warn(
                    'You may have an infinite update loop ' + (
                        watcher.user
                            ? `in watcher with expression "${watcher.expression}"`
                            : `in a component render function.`
                    ),
                    watcher.vm
                );
                break;
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

    // 没有被记录过才会进得来(在同一个事件中不重复执行 watcher)
    if (has[id] == null) {
        // 记录这个 watcher
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


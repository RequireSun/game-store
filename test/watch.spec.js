const assert = require('assert');
import GameStore from '../src/game-store.js';

describe('watch', function () {
    //TODO 实际上触发的顺序是从根开始的, 所以取值发生不同顺序的变化时会有不同的效果
    const createStore = () => new GameStore({
        state: {
            a: 1,
            obj: {
                b: 2,
            },
        },
    });

    const recordChanges = (gs, latestVal) => {
        // 可以被触发
        gs.watch('a', (val, oldVal) => {
            latestVal['a'] = val;
        });
        // 可以被触发 (也会被子元素的修改触发)
        gs.watch('obj', (val, oldVal) => {
            latestVal['obj'] = val;
        });
        // 可以被触发
        gs.watch('obj.b', (val, oldVal) => {
            latestVal['obj.b'] = val;
        });
        // 不能被触发, 因为数据结构不在
        gs.watch('obj.c', (val, oldVal) => {
            latestVal['obj.c'] = val;
        });
    };

    it('the watcher should be emitted when the watched values changed', function () {
        const latestVal = {};

        var promise = Promise.resolve(createStore());

        promise = promise.then(gs => {
            recordChanges(gs, latestVal);

            return Promise.resolve(gs);
        });

        promise = promise.then(gs => {
            gs.a = 2;
            gs.obj.b = 3;

            return Promise.resolve(gs);
        });

        promise = promise.then(gs => {
            assert.equal(gs.a, 2);
            assert.equal(gs.obj.b, 3);

            assert.deepEqual(latestVal, {
                'a': 2,
                'obj.b': 3,
            });

            return Promise.resolve(gs);
        });

        return promise;
    });

    it('the watcher should be emitted when the watched values changed and its parameter must be the latest value', function () {
        const latestVal = {};

        var promise = Promise.resolve(createStore());

        promise = promise.then(gs => {
            recordChanges(gs, latestVal);

            return Promise.resolve(gs);
        });

        promise = promise.then(gs => {
            // 赋值过程
            gs.a = 2;
            gs.obj.b = 3;
            gs.obj = {};
            gs.obj.c = 4;

            return Promise.resolve(gs);
        });

        promise = promise.then(gs => {
            // 值对应上
            assert.equal(gs.a, 2);
            assert.equal(gs.obj.b, undefined);
            assert.deepEqual(gs, {
                a: 2,
                obj: {
                    c: 4,
                },
            });
            // 触发 watcher 的最终状态对应上
            // 因为没有触发, 所以根本不可能有 obj.c
            assert.deepEqual(latestVal, {
                'a': 2,
                'obj': {
                    c: 4,
                },
                'obj.b': undefined,
            });

            return Promise.resolve(gs);
        });

        return promise;
    });

    it('watcher of properties no declared should not be emitted', function () {
        const latestVal = {};

        var promise = Promise.resolve(createStore());

        promise = promise.then(gs => {
            recordChanges(gs, latestVal);

            return Promise.resolve(gs);
        });

        promise = promise.then(gs => {
            gs.obj.c = 5;   // 不应该被触发

            return Promise.resolve(gs);
        });

        promise = promise.then(gs => {
            // 数据层面上 c 是存在的
            assert.deepEqual(gs, {
                a: 1,
                obj: {
                    b: 2,
                    c: 5,
                },
            });
            // 触发 watcher 的最终状态对应上
            // a 因为没触发过
            // 这个地方不可能存在 obj.c
            // 因为 c 没有声明过, 所以赋值时候也不会触发 obj
            assert.deepEqual(latestVal, {});

            return Promise.resolve(gs);
        });

        return promise;
    });

    // gs.watch('d', (val, oldVal) => console.log('d', val, oldVal));          // 分情况(这个地方刚才写错了字, 差点以为自己有错)

});

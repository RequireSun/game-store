'use strict';

import * as assert from 'assert';
import { create, } from './create';
// const assert = require('assert');

export const run = (done = () => {}) => {
    const instance = create();

    let pTask: Promise<any> = Promise.resolve();
    let promise: Promise<any> = Promise.resolve();

    promise = promise.then(() => {
        var p0 = new Promise((resolve) => {
            // 可以被触发
            instance.watch('a', (val, oldVal) => {
                console.log('a', val, oldVal);

                assert.equal(val, 2, 'a');
                assert.equal(oldVal, 1, 'a');

                resolve();
            });
        });

        var p1 = new Promise((resolve, reject) => {
            // 可以被触发
            instance.watch('b', (val, oldVal) => {
                console.log('b', val, oldVal);

                assert.fail('emit', 'not emit', 'should not emit');

                reject();
            });

            setTimeout(() => {
                console.log('b not emitted');
                resolve();
            }, 1000);
        });

        var p2 = new Promise((resolve) => {
            // 可以被触发 (也会被子元素的修改触发)
            instance.watch('obj', (val, oldVal) => {
                console.log('obj', val, oldVal);

                assert.deepEqual(val, [ 1, ], 'obj');
                assert.deepEqual(oldVal, { c: 2, }, 'obj');

                resolve();
            });
        });

        var p3 = new Promise((resolve) => {
            // 可以被触发
            instance.watch('obj.c', (val, oldVal) => {
                console.log('obj.c', val, oldVal);

                assert.equal(val, undefined, 'obj.c');
                assert.equal(oldVal, 3, 'obj.c');

                resolve();
            });
        });

        var p4 = new Promise((resolve) => {
            // 分情况 (这个地方刚才写错了字, 差点以为自己有错)
            instance.watch('d', (val, oldVal) => {
                console.log('d', val, oldVal);

                assert.equal(val, 2, 'd');
                assert.equal(oldVal, undefined, 'd');

                resolve();
            });
        });

        pTask = pTask.then(() => Promise.all([ p0, p1, p2, p3, p4, ]));
        pTask = pTask.then(() => done());

        return Promise.resolve();
    });

    promise = promise.then(() => {
        instance.a = 2;       // 'a' 2 1
        instance.b = 2;       // 不会触发
        instance.obj.c = 2;   // 'obj' [1, ..] {...} => 'obj.c' 3 2
        instance.obj = [];    // 这次赋值导致的上方的 obj 监听中的 newVal 变成了数组, c 因为父元素被覆盖了, 所以自己也变成了 undefined
        instance.d = 2;       // 不会触发
        instance.setIn('d', 2);   // 'd' 2 undefined (上面那一次赋值就当没看到了)
        instance.obj.push(1); // 这一步导致了上面的 obj.c 那一步中的数组中有了元素

        return Promise.resolve(instance);
    });

    return promise;
};
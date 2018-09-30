'use strict';

import GameStore from '../../src/game-store';
import assert from 'power-assert';
// import * as assert from 'assert';

export const run: (done: () => any) => GameStore = (done: (() => any) = () => {}) => {
    const instance = new GameStore({
        state: {
            obj: {
                c: 3,
            },
        },
    });
    var count1 = 0,
        count2 = 0;

    instance.watch('obj', (val, oldVal) => {
        assert.deepEqual(val, [ 1, ], 'obj new value');
        assert.deepEqual(oldVal, { c: 2, }, 'obj old value');

        ++count1;
    });

    instance.watch('obj.c', (val, oldVal) => {
        assert.equal(val, undefined, 'obj.c new value');
        assert.equal(oldVal, 3, 'obj.c old value');

        ++count2;
    });

    setTimeout(() => {
        // 这个不会被触发, 因为后文对 obj 的修改覆盖了它
        instance.obj.c = 2;
        // 触发
        instance.obj = [];
        // 触发
        instance.obj.push(1);
    }, 20);

    setTimeout(() => {
        assert.equal(count1, 1, 'listener1 should be emitted one time');
        assert.equal(count2, 1, 'listener2 should be emitted one time');

        done();
    }, 200);

    return instance;
};
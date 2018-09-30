'use strict';

import GameStore from "../../src/game-store";
import assert from 'power-assert';

export const run: (done: () => any) => GameStore = (done: (() => any) = () => {}) => {
    const instance = new GameStore({
        state: {
            a: 1,
        },
    });

    instance.watch('d', (val, oldVal) => {
        // 第一次的赋值因为开始就没有声明过, 所以不应该被记录
        assert.equal(val, 2, 'd new value');
        assert.equal(oldVal, undefined, 'd old value');

        done();
    });

    setTimeout(() => {
        instance.d = 1;
    }, 20);

    setTimeout(() => {
        instance.setIn('d', 2);
    }, 40);

    return instance;
};

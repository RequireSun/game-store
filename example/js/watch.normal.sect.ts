'use strict';

import GameStore from '../../src/game-store';
import { equal, } from 'assert';

export const run: (done: () => any) => GameStore = (done: (() => any) = () => {}) => {
    const instance = new GameStore({
        state: {
            a: 1,
        },
    });

    instance.watch('a', (val, oldVal) => {
        equal(val, 2, 'new value of a');
        equal(oldVal, 1, 'old value of a');

        done();
    });

    setTimeout(() => {
        instance.a = 2;
    }, 20);

    return instance;
};
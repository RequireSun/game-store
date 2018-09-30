'use strict';

import GameStore from '../../src/game-store';
import { fail, } from 'assert';

export const run: (done: () => any) => GameStore = (done: (() => any) = () => {}) => {
    const instance = new GameStore({
        state: {
            a: 1,
        },
    });

    instance.watch('b', (val, oldVal) => {
        fail('emit', 'not emit', 'should not emit');
    });

    setTimeout(() => {
        instance.b = 2;
    }, 20);

    setTimeout(() => {
        done();
    }, 200);

    return instance;
};
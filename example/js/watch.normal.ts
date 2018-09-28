'use strict';

import GameStore from '../../src/index';
const assert = require('assert');

export const run: () => GameStore = () => {
    const instance = new GameStore({
        state: {
            a: 1,
        },
    });

    instance.watch('a', (val, oldVal) => {
        console.log('a', val, oldVal);

        assert.equal(val, 2, 'a');
        assert.equal(oldVal, 1, 'a');
    });

    setTimeout(() => {
        instance.a = 2;
    }, 20);

    return instance;
};
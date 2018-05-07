const assert = require('assert');
import GameStore from '../src/game-store.js';

describe('create', function () {
    it('the game-store instance value should match with the input value.', function () {
        const gs = new GameStore({
            state: {
                a: 1,
            },
        });

        assert.equal(gs.a, 1);
    });
});
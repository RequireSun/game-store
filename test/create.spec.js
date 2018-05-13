const assert = require('assert');
import {create,} from './useCase/create.js';

describe('create', function () {
    it('the game-store instance value should match with the input value.', function () {
        const {gs,} = create();

        assert.equal(gs.state.a, 1);
    });
});
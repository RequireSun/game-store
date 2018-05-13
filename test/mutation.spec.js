const assert = require('assert');
import {ADD_A,create,} from './useCase/create.js';

describe('mutation', function () {

    it('mutations could change state values', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.commit(ADD_A, 2);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(sequence, ['a']);
            assert.equal(gs.state.a, 3);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

});
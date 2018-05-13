const assert = require('assert');
import {create,ADD_A,ADD_D,} from './useCase/create.js';

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

    it('mutations could change state values (with object payload)', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.commit({
                type: ADD_D,
                payload: 2,
            });

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(sequence, ['d']);
            assert.equal(gs.state.d, 3);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });


});
const assert = require('assert');
import {create,ACTION_ADD_A,ACTION_ADD_D,} from './useCase/create.js';

describe('action', function () {

    it('actions could change state values', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            return gs.dispatch(ACTION_ADD_A, 2)
                .then(() => Promise.resolve({gs, latestVal, sequence,}));
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(sequence, ['a']);
            assert.equal(gs.state.a, 3);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

    it('actions could change state values (with object payload)', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            return gs.dispatch({
                type: ACTION_ADD_D,
                payload: 2,
            }).then(() => Promise.resolve({gs, latestVal, sequence,}));
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(sequence, ['d']);
            assert.equal(gs.state.d, 3);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });
});
const assert = require('assert');
import {create,} from './useCase/create.js';

describe('watch', function () {

    it('the watcher should be emitted when the watched values changed', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.a = 2;
            gs.state.obj.b = 3;

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.equal(gs.state.a, 2);
            assert.equal(gs.state.obj.b, 3);

            assert.deepEqual(latestVal, {
                'a': 2,
                'obj.b': 3,
            });

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

    it('the emit direct of stacked watchers is from root to leaves', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.obj = {};
            gs.state.a = 2;
            gs.state.obj.b = 3;

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            const indexOfObj = sequence.indexOf('obj');
            const indexOfObjB = sequence.indexOf('obj.b');

            assert(indexOfObj < indexOfObjB);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

    it('each watcher only can be emitted once in an event round', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.a = 2;
            gs.state.obj.b = 3;

            gs.state.a = 4;
            gs.state.obj.b = 5;

            gs.state.a = 6;
            gs.state.obj.b = 7;

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.equal(gs.state.a, 6);
            assert.equal(gs.state.obj.b, 7);

            const timeA = sequence.filter(item => 'a' === item).length;
            const timeObjB = sequence.filter(item => 'obj.b' === item).length;

            assert.equal(timeA, 1);
            assert.equal(timeObjB, 1);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

    it('cannot watch changes of the properties didn\'t declared during initializing', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.obj.c = 1;

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.equal(sequence.indexOf('obj.c'), -1);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

    it('properties didn\'t declared during initializing ' +
        'can be watched with using `set` function to assign a value once', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.set('obj.c', 1);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(sequence, ['obj.c']);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });

    it('this library could also watch array modification', function () {
        var promise = Promise.resolve(create());

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.arr.push(1);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(latestVal, {'arr': [1]});

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.arr.unshift(2);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(latestVal, {'arr': [2, 1]});

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.arr.splice(1, 0, 3);

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(latestVal, {'arr': [2, 3, 1]});

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.arr.sort();

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(latestVal, {'arr': [1, 2, 3]});

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.arr.pop();

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(latestVal, {'arr': [1, 2]});

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            gs.state.arr.shift();

            return Promise.resolve({gs, latestVal, sequence,});
        });

        promise = promise.then(({gs, latestVal, sequence,}) => {
            assert.deepEqual(latestVal, {'arr': [2]});

            return Promise.resolve({gs, latestVal, sequence,});
        });

        return promise;
    });
});

'use strict';

import 'assert';
import { run as sectWatch, } from '../example/js/watch.normal.sect';
import { run as sectWatchNoDeclare, } from '../example/js/watch.no.declare.sect';
import { run as sectWatchObject, } from '../example/js/watch.object.sect';

// const assert = require('assert');
// const myCase = require('../example/js/index.ts');


describe('watch', () => {
    it('normal watch: callback should be emitted', (done) => {
        sectWatch(done);
    });

    it('watch of no declare property: should not be emitted', (done) => {
        sectWatchNoDeclare(done);
    });

    it('watch of object property: should only emitted once during a round', (done) => {
        sectWatchObject(done);
    });
});

// const createStore = require('./store/store.js');
//
// describe('normal watch', () => {
//     describe('watch', () => {
//         const ds = createStore();
//
//         it('should emit "a" with old and new value', (done) => {
//             // 可以被触发
//             ds.watch('a', (val, oldVal) => {
//                 console.log('a', val, oldVal);
//                 done();
//             });
//
//             ds.a = 2;       // 'a' 2 1
//         });
//
//         it('should not emit "b" because value not change', (done) => {
//             var isEmitted = false;
//             // 可以被触发
//             ds.watch('b', (val, oldVal) => {
//                 console.log('b', val, oldVal);
//                 isEmitted = true;
//             });
//
//             ds.b = 2;       // 不会触发
//
//             setTimeout(() => {
//                 !isEmitted && done();
//             }, 1000);
//         });
//
//         it('should emit "obj" with old and new value', (done) => {
//             Promise.all([
//                 // 可以被触发 (也会被子元素的修改触发)
//                 new Promise((res) => ds.watch('obj', (val, oldVal) => {
//                     console.log('obj', val, oldVal);
//                     res();
//                 })),
//                 // 可以被触发
//                 new Promise((res) => ds.watch('obj.c', (val, oldVal) => {
//                     console.log('obj.c', val, oldVal);
//                     res();
//                 })),
//             ]).then(() => {
//                 done();
//             });
//
//             ds.obj.c = 2;   // 'obj' [1, ..] {...} => 'obj.c' 3 2
//             ds.obj = [];    // 这次赋值导致的上方的 obj 监听中的 newVal 变成了数组, c 因为父元素被覆盖了, 所以自己也变成了 undefined
//             ds.obj.push(1); // 这一步导致了上面的 obj.c 那一步中的数组中有了元素
//         });
//
//         it('should emit "d" with old and new value', (done) => {
//             // 分情况(这个地方刚才写错了字, 差点以为自己有错)
//             ds.watch('d', (val, oldVal) => {
//                 console.log('d', val, oldVal);
//                 done();
//             });
//
//             ds.d = 2;           // 不会触发
//             ds.setIn('d', 2);   // 'd' 2 undefined (上面那一次赋值就当没看到了)
//         });
//     });
// });
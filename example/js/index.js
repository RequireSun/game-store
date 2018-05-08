'use strict';

import GameStore from '../../src/game-store';

const ADD_A = 'ADD_A';
const ACT_ADD_A = 'ACT_ADD_A';

const gs = new GameStore.Store({
    state: {
        a: 1,
        b: 2,
        obj: {},
    },
    mutations: {
        [ADD_A] (state, payload) {
            state.a += (payload || 0);
        },
    },
    actions: {
        [ACT_ADD_A] ({ commit, }, payload) {
            setTimeout(() => {
                commit(ADD_A, payload);
            }, 1000);
        },
    },
    modules: {
        moduleA: {
            state: {
                a: 4,
            },
            mutations: {
                [ADD_A] (state, payload) {
                    state.a += (payload || 0);
                }
            },
        },
    },
});

window.gs = gs;

gs.watch('a', (val, oldVal) => {
    console.log('a', val, oldVal);
});

gs.watch('moduleA.a', (val, oldVal) => {
    console.log('moduleA.a', val, oldVal);
});

gs.commit(ADD_A, 1);

gs.dispatch(ACT_ADD_A, 1);

// import createStore from './store.js';
// import createActions from './actions.js';
// import bindActions from 'vue-own-redux/bindActions.js';

// const ds = createStore();
//
// const actions = bindActions(ds, createActions());
//
// window.ds = ds;
// window.actions = actions;
//
// var promise = Promise.resolve();
//
// promise = promise.then(() => {
//     ds.watch('a', (val, oldVal) => console.log('a', val, oldVal));          // 可以被触发
//     ds.watch('b', (val, oldVal) => console.log('b', val, oldVal));          // 可以被触发
//     ds.watch('obj', (val, oldVal) => console.log('obj', val, oldVal));      // 可以被触发 (也会被子元素的修改触发)
//     ds.watch('obj.c', (val, oldVal) => console.log('obj.c', val, oldVal));  // 可以被触发
//     ds.watch('d', (val, oldVal) => console.log('d', val, oldVal));          // 分情况(这个地方刚才写错了字, 差点以为自己有错)
//
//     return Promise.resolve();
// });
//
// promise = promise.then(() => {
//     ds.a = 2;       // 'a' 2 1
//     ds.b = 2;       // 不会触发
//     ds.obj.c = 2;   // 'obj' [1, ..] {...} => 'obj.c' 3 2
//     ds.obj = [];    // 这次赋值导致的上方的 obj 监听中的 newVal 变成了数组, c 因为父元素被覆盖了, 所以自己也变成了 undefined
//     ds.d = 2;       // 不会触发
//     ds.setIn('d', 2);   // 'd' 2 undefined (上面那一次赋值就当没看到了)
//     ds.obj.push(1); // 这一步导致了上面的 obj.c 那一步中的数组中有了元素
//
//     return Promise.resolve();
// });
//
// promise = promise.then(() => {
//     return Promise.all([
//         new Promise(res => {
//             setTimeout(() => {
//                 console.log('========== 1000ms ==========');
//                 // 如果一开始传了 deep, 那么这里还会触发 obj.c 的 watcher
//                 ds.obj.push(2); // 因为数组被修改过了, 所以 oldVal 和 newVal 就一样了
//                 ds.obj.push(3);
//                 ds.obj.push(4);
//                 ds.obj.push(5);
//
//                 // 一个属性存在两个 watcher 的情况 & 动态插入 watcher 的情况
//                 ds.watch('obj', (...args) => console.log('obj 2', ...args));        // 因为声明的晚, 所以会在下次改变时执行
//                 ds.watch('obj.c', (...args) => console.log('obj.c 2', ...args));
//
//                 res();
//             }, 1000);
//         }),
//         new Promise(res => {
//             setTimeout(() => {
//                 console.log('========== 2000ms ==========');
//                 ds.obj.sort((a, b) => b - a);   // sort 因为也是在修改数据, 所以也会触发变化, 而且因为做了合并, 只会输出最后的结果
//
//                 res();
//             }, 2000);
//         }),
//         new Promise(res => {
//             setTimeout(() => {
//                 console.log('========== 3000ms ==========');
//                 ds.e = 1;
//                 ds.watch('e', (...args) => console.log('e', ...args));
//                 ds.e = 2;   // 初始化的时候没有定义的变量是不会监听成功的
//                 ds.setIn('e', 10);
//
//                 res();
//             }, 3000);
//         }),
//     ]);
// });
//
// promise = promise.then(() => {
//     console.log('========== START mutation 测试 ==========');
//
//     ds.commit('ADD_A', 1);
//
//     ds.commit({
//         type: 'ADD_A',
//         payload: 2,
//     });
// });
//
// promise = promise.then(() => {
//     console.log('========== START action 测试 ==========');
//
//     actions.incrementA();
// });
//
// promise = promise.then(() => {
//     console.log('========== START inner module 测试 ==========');
//
//     console.log('innerModule.a current:', ds.innerModule.a);
//
//     ds.watch('innerModule.a', (val, oldVal) => console.log('innerModule.a', val, oldVal));
//     ds.watch('innerModule.b', (val, oldVal) => console.log('innerModule.b', val, oldVal));
//
//     ds.innerModule.a = 0;   // 被监听到了
//     ds.innerModule.b = 1;   // 这句应该没用
//     ds.setIn('innerModule.b', 2);       // 这句会监听到 innerModule.b 2 undefined
// });
//
// promise = promise.then(() => {
//     console.log('========== START register module 测试 ==========');
//
//     ds.registerModule('innerModule_2', {
//         state: {
//             a: 1,
//         },
//     });
//
//     ds.watch('innerModule_2.a', (val, oldVal) => console.log('innerModule_2.a', val, oldVal));
//
//     ds.innerModule_2.a = 0;   // 应该会被监听到
//
//     ds.watch('innerModule_3.a', (val, oldVal) => console.log('innerModule_3.a', val, oldVal));
//
//     ds.registerModule('innerModule_3', {
//         state: {
//             a: 1,
//         },
//     });
// });
//
// promise = promise.then(() => {
//     console.log('========== START module action 测试 ==========');
//
//     const actions = bindActions(ds.innerModule, createActions());
//
//     actions.addA(8);
// });
//
// promise = promise.then(() => {
//     console.log('========== START 先赋值 obj 再赋值子元素就能监听到的问题 测试 ==========');
//     debugger;
//
//     const latestVal = {};
//     const gs = new GameStore({
//         state: {
//             a: 1,
//             obj: {
//                 b: 2,
//             },
//         },
//     });
//
//     // 可以被触发
//     gs.watch('a', (val, oldVal) => {
//         console.log('a', val, oldVal);
//         latestVal['a'] = val;
//     });
//     // 可以被触发
//     gs.watch('obj.b', (val, oldVal) => {
//         console.log('obj.b', val, oldVal);
//         latestVal['obj.b'] = val;
//     });
//     // 不能被触发, 因为数据结构不在
//     gs.watch('obj.c', (val, oldVal) => {
//         console.log('obj.c', val, oldVal);
//         latestVal['obj.c'] = val;
//     });
//     // 可以被触发 (也会被子元素的修改触发)
//     gs.watch('obj', (val, oldVal) => {
//         console.log('obj', val, oldVal);
//         latestVal['obj'] = val;
//     });
//
//     // 实际上 obj.c 的监听器会在 obj 修改的时候被触发, 并不是 obj.c 赋值的时候触发
//     // 但是因为 watcher 是执行在 next-tick 中的, 所以 obj.c 赋值在 watcher 之前了
//     gs.obj.b = 6;
//     gs.obj = {};
//     gs.obj.b = 4;
//     gs.obj.c = 5;
//
//     setTimeout(() => {
//         // 这个地方不会触发的
//         gs.obj.c = 123;
//     }, 16);
// });
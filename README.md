
# Game Store

主体逻辑摘自 vue.js observer 模块, 并根据项目组日常使用情况进行了一些改造.

编写参考: [https://segmentfault.com/a/1190000006599500](https://segmentfault.com/a/1190000006599500)

__注意:__

1. 请不要直接使用 idea 的使用 chrome 快捷预览页面的功能, 这个功能不支持 es6 的 import, 直接本地 anywhere 起一个静态文件服务器会好用一些.
1. 在同一时刻多次修改同一个属性, 只会触发一次 watcher, 结果也是最终结果(因为这个一般用于渲染, 中间状态太多会出问题).
1. 请在初始化时提前声明数据结构, 否则 watch 函数监听不到.
1. 实在在初始化的时候声明不出来的数据结构, 请使用 `ds.setIn` 函数进行设置, 一次设置, 终生使用.

# How to use

index.js 文件

```javascript

import createStore from './js/store.js';
import createActions from './js/actions.js';
import bindActions from '../node_modules/vue-own-redux/bindActions.js';

const ds = createStore();

const actions = bindActions(ds, createActions());

window.ds = ds;
window.actions = actions;

var promise = Promise.resolve();

promise = promise.then(() => {
    ds.watch('a', (val, oldVal) => console.log('a', val, oldVal));          // 可以被触发
    ds.watch('b', (val, oldVal) => console.log('b', val, oldVal));          // 可以被触发
    ds.watch('obj', (val, oldVal) => console.log('obj', val, oldVal));      // 可以被触发 (也会被子元素的修改触发)
    ds.watch('obj.c', (val, oldVal) => console.log('obj.c', val, oldVal));  // 可以被触发
    ds.watch('d', (val, oldVal) => console.log('d', val, oldVal));          // 分情况(这个地方刚才写错了字, 差点以为自己有错)

    return Promise.resolve();
});

promise = promise.then(() => {
    ds.a = 2;       // 'a' 2 1
    ds.b = 2;       // 不会触发
    ds.obj.c = 2;   // 'obj' [1, ..] {...} => 'obj.c' 3 2
    ds.obj = [];    // 这次赋值导致的上方的 obj 监听中的 newVal 变成了数组, c 因为父元素被覆盖了, 所以自己也变成了 undefined
    ds.d = 2;       // 不会触发
    ds.setIn('d', 2);   // 'd' 2 undefined (上面那一次赋值就当没看到了)
    ds.obj.push(1); // 这一步导致了上面的 obj.c 那一步中的数组中有了元素

    return Promise.resolve();
});

promise = promise.then(() => {
    return Promise.all([
        new Promise(res => {
            setTimeout(() => {
                console.log('========== 1000ms ==========');
                // 如果一开始传了 deep, 那么这里还会触发 obj.c 的 watcher
                ds.obj.push(2); // 因为数组被修改过了, 所以 oldVal 和 newVal 就一样了
                ds.obj.push(3);
                ds.obj.push(4);
                ds.obj.push(5);

                // 一个属性存在两个 watcher 的情况 & 动态插入 watcher 的情况
                ds.watch('obj', (...args) => console.log('obj 2', ...args));        // 因为声明的晚, 所以会在下次改变时执行
                ds.watch('obj.c', (...args) => console.log('obj.c 2', ...args));

                res();
            }, 1000);
        }),
        new Promise(res => {
            setTimeout(() => {
                console.log('========== 2000ms ==========');
                ds.obj.sort((a, b) => b - a);   // sort 因为也是在修改数据, 所以也会触发变化, 而且因为做了合并, 只会输出最后的结果

                res();
            }, 2000);
        }),
        new Promise(res => {
            setTimeout(() => {
                console.log('========== 3000ms ==========');
                ds.e = 1;
                ds.watch('e', (...args) => console.log('e', ...args));
                ds.e = 2;   // 初始化的时候没有定义的变量是不会监听成功的
                ds.setIn('e', 10);

                res();
            }, 3000);
        }),
    ]);
});

promise = promise.then(() => {
    console.log('========== START mutation 测试 ==========');

    ds.commit('ADD_A', 1);

    ds.commit({
        type: 'ADD_A',
        payload: 2,
    });
});

promise = promise.then(() => {
    console.log('========== START action 测试 ==========');

    actions.incrementA();
});

promise = promise.then(() => {
    console.log('========== START inner module 测试 ==========');

    console.log('innerModule.a current:', ds.innerModule.a);

    ds.watch('innerModule.a', (val, oldVal) => console.log('innerModule.a', val, oldVal));
    ds.watch('innerModule.b', (val, oldVal) => console.log('innerModule.b', val, oldVal));

    ds.innerModule.a = 0;   // 被监听到了
    ds.innerModule.b = 1;   // 这句应该没用
    ds.setIn('innerModule.b', 2);       // 这句会监听到 innerModule.b 2 undefined
});

promise = promise.then(() => {
    console.log('========== START register module 测试 ==========');

    ds.registerModule('innerModule_2', {
        state: {
            a: 1,
        },
    });

    ds.watch('innerModule_2.a', (val, oldVal) => console.log('innerModule_2.a', val, oldVal));

    ds.innerModule_2.a = 0;   // 应该会被监听到

    ds.watch('innerModule_3.a', (val, oldVal) => console.log('innerModule_3.a', val, oldVal));

    ds.registerModule('innerModule_3', {
        state: {
            a: 1,
        },
    });
});
    
```

store.js 文件

```javascript

import DataSource from '../../index.js';
import {INCREMENT_A,ADD_A,} from './actions.js';

export default () => new DataSource({
    state: {
        a: 1,
        b: 2,
        obj: {
            c: 3,
        },
    },
    mutations: {
        [INCREMENT_A] (state) {
            ++state.a;
        },
        [ADD_A] (state, action) {
            state.a += (action.payload || 0);
        },
    },
    modules: {
        innerModule: {
            state: {
                a: 7,
            },
        },
    },
});

```

actions.js 文件

```javascript

const createActions = window.ReduxActions.createActions;

export const INCREMENT_A = 'INCREMENT_A';
export const ADD_A = 'ADD_A';

export default () => createActions({
    [INCREMENT_A]: info => info,
    [ADD_A]: info => info,
});

```


# API

1. DataStore

    数据 store 对象, 初始化请直接 new 该对象.
    参数就是想要当作监听数据的对象(请尽量将其结构补充完整).

    ```javascript
    new DataStore({
        state: {
            stateA: 1,
        },
        mutations: {
            mutationA (state, action) {
                state.stateA += action.payload;
            },
        },
    });
    ```

1. watch

    监听函数, 用于监听数据变化并作出相应反应.
    同一时刻多次修改同一数据将只会触发一次 watch 的回调.

    ```javascript
    ds.watch('xxx.xx', (val, oldVal) => {});
    ```

1. setIn

    如果一个属性在初始化时并没有声明, 那么 watch 函数是监听不到的.
    此时就需要使用 setIn 函数来将新生命的属性挂到树上.

    ```javascript
    // 设置了 xxx.xx 的值并且使得它可以被 watch
    ds.setIn('xxx.xx', 1);
    ```

1. 修改属性 __(不建议)__

    直接修改属性就可以触发 watch 函数.

1. mutation

    建议通过 mutation 来修改属性, 在初始化的时候通过 mutations 属性传入.
    它的每个属性都必须是函数, 具体使用方法如下:
   
    1. 参数
        + state
          是当前的数据对象, 直接对它进行修改就可以了.
        + actions
          包括了 `type` 和 `payload` 两个属性, 分别是当前的事件类型 & 调用时传入的参数.
       
    1. 返回值
        目前还没有限制
      
    1. 调用
        通过在 `store` 的实例上调用 `commit` 函数来触发这些变换过程.
        `commit` 还有一个别名叫 `dispatch`.
      
        ```javascript
        // 方式 1
        ds.commit('mutationA', 1);
        // 方式 2
        ds.commit({
            type: 'mutationA',
            payload: 1,
        });
        ```
  
1. actions

    本模块使用 `redux-actions` 库生成的 `actions`.
    本模块使用 `vue-own-redux` 模块中的 `bindActions` 方法将 `redux-actions` 库生成的 `actions` 绑定到当前 `store` 上.
   
    创建 action:

    ```javascript
    import {createActions,} from 'redux-actions';

    const ACTION_A = 'ACTION_A';

    export default () => createActions({
        [ACTION_A]: info => info,
    });
    ```
   
    store 的处理:

    ```javascript
    import {ACTION_A,} from './action.js';

    export default () => new DataStore({
        state: {},
        mutations: {
            [ACTION_A] (state, action) {
                state.x += action.payload;
            },
        },
    });
    ```
   
    生成和绑定:

    ```javascript
    import bindActions from 'vue-own-redux/bindActions.js';
    import createStore from './store.js';
    import createAction from './action.js';

    const store = createStore();
    const actions = bindActions(store, createAction());
    ```
   
    调用 action:

    ```javascript
    actions.actionA(2);
    ```

1. module

    在初始化的时候通过 modules 参数传入, 内部格式和普通的 store 一样, 甚至可以继续嵌套.

    ```javascript

    new DataStore({
        state: ...state,
        mutations: ...mutations,
        modules: {
            module_1: {
                state: {
                    valueA: 1,
                },
                mutations: {
                    mutationA (state, action) {
                        // ...
                    },
                    [ACTION_NAME] (state, action) {
                        // ...
                    },
                },
            },
        },
    });

    ```

1. registerModule (module 的动态插入)

    这里和 vuex 一样, 是支持 module 的动态插入的,
    _!notice: 目前不支持 module 的动态删除!_
    _!notice: 请尽量在顶层, 而不是深层 module 上调用 registerModule 函数注册新 module, 因为这样会导致父层无法监听该层变化_

    ```javascript
    // 直接定义在当前 module 上
    ds.registerModule('moduleName', {
        state: ...state,
        mutations: ...mutations,
    });
    // 定义在更深处
    ds.registerModule(['folder', 'innerFolder', 'moduleName',], {
        state: ...state,
        mutations: ...mutations,
    });
    ```


# Update log

## 2018/05/07 10:53

1. 完善了文档关于 module 的部分

## 2018/05/07 04:52

1. 实现了多 module 功能, 只是时间太紧, 没有来得及写文档 & 实现 action

## 2018/05/07 01:16

1. 添加了 action 的使用

## 2018/05/06 19:08

1. 修改构造函数参数, 添加 mutation

## 2018/04/12 16:40

1. 修复了重复创建根节点时 proxyData 重复创建的问题
1. 修改了示例代码, 删掉了原来的 index

## 2018/04/12 16:30

1. 改掉了错误使用的 deep 参数
1. 解决了数组不监听的问题

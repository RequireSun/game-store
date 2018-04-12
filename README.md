
# How to use

__注意:__

1. 请不要直接使用 idea 的使用 chrome 快捷预览页面的功能, 这个功能不支持 es6 的 import, 直接本地 anywhere 起一个静态文件服务器会好用一些.
1. 在同一时刻多次修改同一个属性, 只会触发一次 watcher, 结果也是最终结果(因为这个一般用于渲染, 中间状态太多会出问题).
1. 请在初始化时提前声明数据结构, 否则 watch 函数监听不到.
1. 实在在初始化的时候声明不出来的数据结构, 请使用 `ds.setIn` 函数进行设置, 一次设置, 终生使用.

```
import DataSource from './src/dataStore.js';

const ds = new DataSource({
    a: 1,
    b: 2,
    obj: {
        c: 3,
    },
});

window.ds = ds;

ds.watch('a', (val, oldVal) => console.log('a', val, oldVal));          // 可以被触发
ds.watch('b', (val, oldVal) => console.log('b', val, oldVal));          // 可以被触发
ds.watch('obj', (val, oldVal) => console.log('obj', val, oldVal));      // 可以被触发 (也会被子元素的修改触发)
ds.watch('obj.c', (val, oldVal) => console.log('obj.c', val, oldVal));  // 可以被触发
ds.watch('d', (val, oldVal) => console.log('d', val, oldVal));          // 分情况(这个地方刚才写错了字, 差点以为自己有错)

ds.a = 2;       // 'a' 2 1
ds.b = 2;       // 不会触发
ds.obj.c = 2;   // 'obj' [...] {...} => 'obj.c' 3 2
ds.obj = [];    // 这次赋值导致的上方的 obj 监听中的 newVal 变成了数组
ds.d = 2;       // 不会触发
ds.setIn('d', 2);   // 'd' 2 undefined (上面那一次赋值就当没看到了)
ds.obj.push(1);

```
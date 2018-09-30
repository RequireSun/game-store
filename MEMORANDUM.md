
1. 手动运行 node_modules 模块: `npx`.

1. `@types/jasmine` 包是用来让 typescript 不报 describe 不存在的错误的.

1. `tsconfig.compilerOptions.lib` 里面的 es2016 是为了让 typescript 不报 Promise 的错误的.

1. `tsconfig.compilerOptions.experimentalDecorators` 用来开启 typescript 的 es6 装饰器功能.

1. plugin-transform-runtime 复用公共函数, 缩小包大小 21k -> 20k

1. plugin-proposal-decorators 必须放在 proposal-class-properties 之前

1. tsconfig.compilerOptions.lib 里面的 `webworker` 是为了使用 MessageChannel.

1. ~~tsconfig.compilerOptions.declaration 用来生成 .d.ts 文件~~ 不再用了, 改用 dts-generator 模块直接生成项目所需 .d.ts

1. tsconfig.compilerOptions.sourceMap typescript 的 sourceMap 是需要单独配置的
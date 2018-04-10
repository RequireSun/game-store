/**
 * Created by kelvinsun on 18/4/10.
 */

/**
 * Perform no operation.
 * Stubbing args to make Flow happy without leaving useless transpiled code
 * with ...rest (https://flow.org/blog/2017/05/07/Strict-Function-Call-Arity/)
 * 翻译:
 * 不做任何操作.
 * 使用多余的参数而不是(容易发生泄漏的?) ...rest 语句来骗过 Flow
 *
 * @param a {?*}
 * @param b {?*}
 * @param c {?*}
 */
export function noop (a, b, c) {}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 * 翻译:
 * 快速对象校验 - 它主要是在我们已经知道这个值是 JSON-兼容的 的情况下
 * 用来辨别对象和原始值(number / boolean...)的
 * @param obj {?*}
 * @returns {boolean}
 */
export function isObject (obj) {
    return obj !== null && typeof(obj) === 'object';
}
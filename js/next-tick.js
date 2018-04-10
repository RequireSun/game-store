/**
 * Created by kelvinsun on 18/4/10.
 */
import {handleError} from './util.js';

const callbacks = [];
let pending = false;
let useMacroTask = false;
let macroTimerFunc;
let microTimerFunc;

/**
 * @param cb {?Function}
 * @param ctx {?Object}
 */
export function nextTick (cb, ctx) {
    let _resolve;

    callbacks.push(() => {
        if (cb) {
            try {
                cb.call(ctx);
            } catch (e) {
                handleError(e, ctx, 'nextTick');
            }
        } else if (_resolve) {
            _resolve(ctx);
        }
    });

    if (!pending) {
        pending = true;

        if (useMacroTask) {
            macroTimerFunc();
        } else {
            microTimerFunc();
        }
    }
    // $flow-disable-line
    if (!cb && typeof Promise !== 'undefined') {
        return new Promise(resolve => {
            _resolve = resolve
        });
    }
}
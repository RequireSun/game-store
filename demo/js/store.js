'use strict';

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
});

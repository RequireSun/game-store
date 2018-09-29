'use strict';

import DataSource from '../../index.js';
import { INCREMENT_A, ADD_A, } from './actions.js';

module.exports = () => new DataSource({
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
            mutations: {
                [ADD_A] (state, action) {
                    state.a += (action.payload || 0);
                },
            },
        },
    },
});
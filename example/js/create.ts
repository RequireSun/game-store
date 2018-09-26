'use strict';

import GameStore from "../../src/index.ts";

export const INCREMENT_A: string = 'INCREMENT_A';
export const ADD_A: string = 'ADD_A';

export const dataStruct = {
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
};

export const create: () => GameStore = () => {
    return new GameStore(dataStruct);
};

'use strict';
import {createActions,} from 'redux-actions';

export const INCREMENT_A = 'INCREMENT_A';
export const ADD_A = 'ADD_A';

export default () => createActions({
    [INCREMENT_A]: info => info,
    [ADD_A]: info => info,
});
'use strict';
// 因为 chrome 不支持 import 的时候不带 .js 所以只能通过这种恶心的方式来使用了
// import {createActions} from '../../node_modules/redux-actions/lib/index.js';
const createActions = window.ReduxActions.createActions;

export const INCREMENT_A = 'INCREMENT_A';
export const ADD_A = 'ADD_A';

export default () => createActions({
    [INCREMENT_A]: info => info,
    [ADD_A]: info => info,
});
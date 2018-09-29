'use strict';

const createActions = require('redux-actions').createActions;

const INCREMENT_A = 'INCREMENT_A';
const ADD_A = 'ADD_A';

module.exports = () => createActions({
    [INCREMENT_A]: info => info,
    [ADD_A]: info => info,
});

exports.INCREMENT_A = INCREMENT_A;
exports.ADD_A = ADD_A;
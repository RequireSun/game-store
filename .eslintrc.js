module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "commonjs":true,
        "node":true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    plugins: [
        'html'
    ],
    "globals": {
        "module": 1,
        "console": 1,
        "require": 1,
        "exports": 1,
        'define':1,
        "Promise":1,
        "WXEnvironment": 1,
    }, 
    "parser": "babel-eslint",
    settings: {
        'html/html-extensions': ['.html',]
    },
    "rules": {
        "no-fallthrough": 0,
        "no-extra-boolean-cast": 0,
        "no-unsafe-finally": 0,
        "no-cond-assign": 0,
        "no-redeclare": 0,
        "no-useless-escape": 0,
        "no-empty": 0,
        "no-extra-semi": 0,
        "no-mixed-spaces-and-tabs": 0,
        "no-unused-vars": 0,
        "linebreak-style": 0,
        "no-console": 0,
        "no-constant-condition" : 0
    }
};
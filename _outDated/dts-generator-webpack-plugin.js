'use strict';

const readFile = require('fs').readFile;
const dtsGenerator  = require('dts-generator').default;
const tmpName = require('tmp').tmpName;

const readFileAsync = (fileName) => new Promise((res, rej) => {
    return readFile(fileName, (err, data) => {
        if (err) {
            rej(err);
        } else {
            res(data);
        }
    });
});

const tmpNameAsync = (options) => new Promise((res, rej) => {
    return tmpName(options, (err, name) => {
        if (err) {
            rej(err);
        } else {
            res(name);
        }
    })
});

module.exports = class DtsGeneratorWebpackPlugin {
    constructor(options) {
        this.options = options;
    }

    apply(compiler) {
        compiler.plugin('emit', (compilation, callback) => {
            console.log('.d.ts start generating');

            console.log(JSON.stringify(Object.keys(compilation.assets)));

            callback();

            // this.compile()
            //     .then((source) => {
            //         console.log(JSON.stringify(Object.keys(compilation.assets)));
            //
            //         const result = Object.assign(compilation.assets, {
            //             [`${this.options.name}.d.ts`]: {
            //                 source: () => Buffer.from(source),
            //                 // Buffer.byteLength does support Buffer type even though the
            //                 // type definition does not
            //                 // https://nodejs.org/api/buffer.html#buffer_class_method_buffer_bytelength_string_encoding
            //                 size: () => Buffer.byteLength(source)
            //             },
            //         });
            //
            //         console.log(JSON.stringify(Object.keys(result)));
            //
            //         return result;
            //     })
            //     // Callback with no Error on success
            //     .then(() => { callback(); })
            //     .catch(callback);
        });
    }

    compile() {
        // TODO: Create a resizable Buffer instead of writing to a tmp directory?
        var promise = tmpNameAsync();
        var _fileName;

        promise = promise.then((fileName) => {
            _fileName = fileName;

            const dtsConfig = Object.assign({}, this.options, {out: fileName});

            console.log('dts generator config', dtsConfig);

            return dtsGenerator(dtsConfig);
        });

        promise = promise.then(() => readFileAsync(_fileName));

        return promise;
    }
};
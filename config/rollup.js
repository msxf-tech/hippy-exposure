/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */


var typescript = require('rollup-plugin-typescript2');

var pkg = require('../package.json');

var version = pkg.version;

var banner =
`/*!
 * ${pkg.name} ${version}
 */
`;

function getCompiler(opt) {
    opt = opt || {
        tsconfigOverride: { compilerOptions : { module: 'ES2015' } },
        objectHashIgnoreUnknownHack: false,
    }

    return typescript(opt);
}

exports.name = 'ms-front-utils';
exports.banner = banner;
exports.getCompiler = getCompiler;

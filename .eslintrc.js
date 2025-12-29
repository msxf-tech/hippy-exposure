/*
 * We are pleased to support the open source community by making
 * Hippy Exposure available.
 *
 * Copyright (c) 2015-present 马上消费金融股份有限公司, https://www.msxf.com/
 *
 * Licensed under the MIT LICENSE.
 */

module.exports = {
	"env": {
		"browser": true,
		"es6": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"sourceType": "module"
	},
	"plugins": ["@typescript-eslint"],
	"rules": {
		"quotes": [
			"error",
			"single"
		],
		"semi": [
			"error",
			"always"
		],
		"indent": ["error", 2],
		"no-console": "off",
		"max-classes-per-file": ["error", 2],
		"@typescript-eslint/explicit-member-accessibility": "off",
		"@typescript-eslint/indent": ["error", 2],
		"linebreak-style": "off",
		'no-debugger': "warn",
		'no-prototype-builtins': "off",
		"no-useless-escape": "off",                   // 关闭转义字符检测
		"no-unused-expressions": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-var-requires": "off",
		'@typescript-eslint/ban-ts-comment': 'off',
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-this-alias": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
	}
};

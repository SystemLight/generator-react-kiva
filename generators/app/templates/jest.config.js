/**
 * jest配置 https://jestjs.io/docs/configuration
 * typescript中jsx保留讨论：https://github.com/kulshekhar/ts-jest/issues/937
 * @type { import('@jest/types').Config.InitialOptions }
 */
module.exports = {
    roots: [
        '<rootDir>/tests/unit'
    ],
    setupFilesAfterEnv: [
        '<rootDir>/tests/setupTests.ts'
    ],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js',
        '.*\\.(css|less|scss)$': '<rootDir>/tests/__mocks__/styleMock.js'
    },
    testRegex: '^.+\\.spec\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};

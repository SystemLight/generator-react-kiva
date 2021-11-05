const path = require('path');
const os = require('os');
const fs = require('fs');

const chalk = require('chalk');
const yosay = require('yosay');
const semver = require('semver');
const Generator = require('yeoman-generator');
const kebabCase = require('lodash.kebabcase');

function parseScopedName(name) {
    const nameFragments = name.split('/');
    const parseResult = {
        scopeName: '',
        localName: name
    };

    if (nameFragments.length > 1) {
        parseResult.scopeName = nameFragments[0];
        parseResult.localName = nameFragments[1];
    }

    return parseResult;
}

function makeGeneratorName(name) {
    const parsedName = parseScopedName(name);
    name = parsedName.localName;
    name = kebabCase(name);
    return parsedName.scopeName ? `${parsedName.scopeName}/${name}` : name;
}

class WalkDir {
    constructor(folderPath) {
        this.folderPath = path.resolve(folderPath);
    }

    forEach(fn) {
        let fileStack = fs.readdirSync(this.folderPath);
        while (fileStack.length !== 0) {
            let currentChildPath = fileStack.pop();
            let currentPath = path.join(this.folderPath, currentChildPath);
            if (fs.statSync(currentPath).isDirectory()) {
                fileStack = fileStack.concat(fs.readdirSync(currentPath).map((v) => path.join(currentChildPath, v)));
            } else {
                fn(currentPath, currentChildPath, path.basename(currentChildPath));
            }
        }
    }
}

function walkDir(folderPath) {
    return new WalkDir(folderPath);
}

module.exports = class extends Generator {
    initializing() {
        this.props = {};

        this.log(yosay('Welcome to react Kiva series templates!'));
    }

    prompting() {
        return this.prompt([
            {
                name: 'name',
                type: 'input',
                message: 'Your generator name',
                default: makeGeneratorName(path.basename(process.cwd())),
                filter: makeGeneratorName
            },
            {
                name: 'version',
                type: 'input',
                message: 'Your generator version',
                default: '1.0.0',
                validate: version => !!semver.valid(version)
            },
            {
                name: 'description',
                type: 'input',
                message: 'Your generator description',
                default: ''
            }
        ]).then((answers) => {
            this.props = Object.assign(this.props, answers);
        });
    }

    writing() {
        this._writePackageJson();
        this._copyTemplate();
    }

    installing() {
        this.spawnCommand('git', ['init']);
    }

    end() {
        this.log('\n\n\n');

        this.log('You can run');
        this.log('========================');
        this.log('||                    ||');
        this.log(`||     ${chalk.cyan('git init')}       ||`);
        this.log(`||     ${chalk.cyan('npm i')}          ||`);
        this.log('||                    ||');
        this.log('========================');

        this.log('\n\n\n');
        this.log(chalk.cyan('Happy code !'));
    }

    _writePackageJson() {
        const pkg = {
            'name': this.props.name,
            'version': this.props.version,
            'description': this.props.description,
            'private': true,
            'scripts': {
                'dev': 'webpack serve --mode development',
                'build': 'webpack --mode production',
                'update': 'node scripts/updatePackage.js',
                'plop': 'plop',
                'lint:style': 'stylelint src/**/*.{css,less} --fix',
                'lint:script': 'eslint src/**/*.{js,jsx,ts,tsx} --fix',
                'test:unit': 'jest',
                'prepare': 'husky install'
            },
            'author': os.userInfo().username,
            'license': 'MIT'
        };

        this.fs.writeJSON(this.destinationPath('package.json'), pkg);
        this.addDependencies({
            '@babel/core': '^7.13.8',
            '@babel/preset-env': '^7.13.8',
            '@babel/preset-react': '^7.12.13',
            '@commitlint/cli': '^13.2.1',
            '@commitlint/config-conventional': '^13.2.0',
            '@svgr/webpack': '^5.5.0',
            '@types/enzyme': '^3.10.9',
            '@types/jest': '^27.0.2',
            '@types/qs': '^6.9.5',
            '@types/react-dom': '^17.0.1',
            '@typescript-eslint/eslint-plugin': '^4.15.2',
            '@typescript-eslint/parser': '^4.15.2',
            '@wojtekmaj/enzyme-adapter-react-17': '^0.6.3',
            'babel-loader': '^8.2.2',
            'body-parser': '^1.19.0',
            'chalk': '^4.1.2',
            'chokidar': '^3.5.2',
            'clean-webpack-plugin': '^3.0.0',
            'copy-webpack-plugin': '^6.4.1',
            'css-loader': '^5.1.0',
            'enzyme': '^3.11.0',
            'eslint': '^7.21.0',
            'eslint-plugin-react': '^7.22.0',
            'eslint-plugin-react-hooks': '^4.2.0',
            'file-loader': '^6.2.0',
            'friendly-errors-webpack-plugin': '^1.7.0',
            'html-webpack-plugin': '^4.5.2',
            'husky': '^7.0.2',
            'jest': '^27.2.5',
            'jest-enzyme': '^7.1.2',
            'less': '^4.1.2',
            'less-loader': '^7.3.0',
            'lint-staged': '^11.2.3',
            'mini-css-extract-plugin': '^1.3.9',
            'mockjs': '^1.1.0',
            'optimize-css-assets-webpack-plugin': '^5.0.4',
            'plop': '^2.7.4',
            'postcss': '^8.2.6',
            'postcss-loader': '^4.3.0',
            'postcss-preset-env': '^6.7.0',
            'react-dev-utils': '^11.0.4',
            'style-loader': '^2.0.0',
            'stylelint': '^13.13.1',
            'stylelint-config-idiomatic-order': '^8.1.0',
            'stylelint-config-standard': '^22.0.0',
            'stylelint-order': '^4.1.0',
            'terser-webpack-plugin': '^4.2.3',
            'thread-loader': '^3.0.1',
            'ts-jest': '^27.0.5',
            'ts-loader': '^8.0.17',
            'typescript': '^4.2.2',
            'url-loader': '^4.1.1',
            'webpack': '^4.46.0',
            'webpack-cli': '^4.9.1',
            'webpack-dev-server': '^3.11.2',
            'webpackbar': '^5.0.0-3'
        }).then(() => this.addDevDependencies({
            '@ant-design/icons': '^4.7.0',
            '@babel/polyfill': '^7.12.1',
            'antd': '^4.16.13',
            'axios': '^0.21.1',
            'core-js': '^3.9.0',
            'qs': '^6.9.6',
            'react': '^17.0.2',
            'react-dom': '^17.0.1'
        }));
    }

    _copyTemplate() {
        walkDir(this.templatePath('.')).forEach((fullPath, relativePath, fileName) => {
            if (fileName === 'gitignore') {
                const folder = path.dirname(relativePath);
                return this.fs.copyTpl(
                    this.templatePath(relativePath),
                    this.destinationPath(path.join(folder, '.gitignore')),
                    this.props
                );
            }
            this.fs.copyTpl(
                this.templatePath(relativePath),
                this.destinationPath(relativePath),
                this.props
            );
        });
    }
}

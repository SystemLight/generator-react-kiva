const path = require('path')
const os = require('os')
const fs = require('fs')

const chalk = require('chalk')
const yosay = require('yosay')
const semver = require('semver')
const Generator = require('yeoman-generator')
const kebabCase = require('lodash.kebabcase')

function parseScopedName(name) {
  const nameFragments = name.split('/')
  const parseResult = {
    scopeName: '',
    localName: name
  }

  if (nameFragments.length > 1) {
    parseResult.scopeName = nameFragments[0]
    parseResult.localName = nameFragments[1]
  }

  return parseResult
}

function makeGeneratorName(name) {
  const parsedName = parseScopedName(name)
  name = parsedName.localName
  name = kebabCase(name)
  return parsedName.scopeName ? `${parsedName.scopeName}/${name}` : name
}

class WalkDir {
  constructor(folderPath) {
    this.folderPath = path.resolve(folderPath)
  }

  forEach(callback) {
    let fileStack = fs.readdirSync(this.folderPath)
    while (fileStack.length !== 0) {
      let currentChildPath = fileStack.pop()
      let currentPath = path.join(this.folderPath, currentChildPath)
      if (fs.statSync(currentPath).isDirectory()) {
        fileStack = fileStack.concat(
          fs.readdirSync(currentPath).map((v) => path.join(currentChildPath, v))
        )
      } else {
        callback(currentPath, currentChildPath, path.basename(currentChildPath))
      }
    }
  }
}

function walkDir(folderPath) {
  return new WalkDir(folderPath)
}

module.exports = class extends Generator {
  initializing() {
    this.props = {}
    this.log(yosay('Welcome to react Kiva series templates!'))
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
        validate: (version) => !!semver.valid(version)
      },
      {
        name: 'description',
        type: 'input',
        message: 'Your generator description',
        default: ''
      }
    ]).then((answers) => {
      Object.assign(this.props, answers)
    })
  }

  writing() {
    this._writePackageJson()
    walkDir(this.templatePath('.')).forEach((fullPath, relativePath, fileName) => {
      if (fileName === 'gitignore') {
        const folder = path.dirname(relativePath)
        return this.fs.copyTpl(
          this.templatePath(relativePath),
          this.destinationPath(path.join(folder, '.gitignore')),
          this.props
        )
      }
      this.fs.copyTpl(
        this.templatePath(relativePath),
        this.destinationPath(relativePath),
        this.props
      )
    })
  }

  installing() {
    this.spawnCommand('git', ['init'])
  }

  end() {
    this.log('\n\n\n')

    this.log('You can run')
    this.log('========================')
    this.log('||                    ||')
    this.log(`||     ${chalk.cyan('git init')}       ||`)
    this.log(`||     ${chalk.cyan('npm i')}          ||`)
    this.log('||                    ||')
    this.log('========================')

    this.log('\n\n\n')
    this.log(chalk.cyan('Happy code !'))
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
    }

    this.fs.writeJSON(this.destinationPath('package.json'), pkg)
    this.addDevDependencies({
      '@systemlight/fabric': '^1.1.0',
      '@systemlight/webpack-config': '^1.0.0',
      '@types/enzyme': '^3.10.9',
      '@types/jest': '^27.0.2',
      '@types/qs': '^6.9.5',
      '@types/react-dom': '^17.0.1',
      '@wojtekmaj/enzyme-adapter-react-17': '^0.6.3',
      'enzyme': '^3.11.0',
      'husky': '^7.0.2',
      'jest': '^27.2.5',
      'jest-enzyme': '^7.1.2',
      'lint-staged': '^11.2.3',
      'plop': '^2.7.4',
      'ts-jest': '^27.0.5'
    }).then(() => this.addDependencies({
      '@ant-design/icons': '^4.7.0',
      '@babel/polyfill': '^7.12.1',
      '@systemlight/pure.css': '^1.0.0',
      'antd': '^4.16.13',
      'axios': '^0.21.1',
      'core-js': '^3.9.0',
      'prop-types': '^15.7.2',
      'qs': '^6.9.6',
      'react': '^17.0.2',
      'react-dom': '^17.0.1'
    }))
  }
}

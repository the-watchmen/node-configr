# node-configr

config helper

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![build status](https://github.com/the-watchmen/node-helpr/actions/workflows/release.yaml/badge.svg)](https://github.com/the-watchmen/node-configr/actions)
[![npm (scoped)](https://img.shields.io/npm/v/@watchmen/configr.svg)](https://www.npmjs.com/package/@watchmen/configr)

> see [tests](test) for examples

## usage

- `npm i @watchmen/configr`
- `import {...} from '@watchmen/configr'`

## configuration sources

CONFIGR_SOURCES={source},{source},...

where a source can be a url or a relative file path

when processing a source, the file will b a template which could result in multiple files being processed

example: `./config/values.yaml`

`values.yaml` becomes the template which will be processed as a sequence of files, _if the files exist_, and be processed sequentially where each subsequent file has precedence.

the sequence is based on the following:

1. environment
   1. specified in a variable named `ENVIRONMENT`
      1. of form `[{modifier}-]{base}`
         1. optional `{modifier}` could be anything like `foo`
         1. `{base}` would be one of discrete set of base environments like [`dev`, `test`, `prod`]
1. git branch
   1. specified in variable named `GITHUB_REF_NAME`
      1. of form `{trunk}[-{modifier}]`
      1. `{trunk}` would be something like `main`
      1. optional `{modifier}` coudld be anything like `foo`
1. examples
   1. (no modifiers): environment=`dev`, branch=`main`
      1. sequence
         1. `values.yaml`
         1. `values.dev.yaml`
   1. (with modifiers): environment=`foo-dev`, branch=`main-bar`
      1. sequence
         1. `values.yaml`
         1. `values.bar.yaml`
         1. `values.foo.yaml`
         1. `values.dev.yaml`
         1. `values.foo-dev.yaml`

## configuration environment variables

every element can be specified/overridden with an environment variable

let's say that after parsing of sources that the resultant structure looks like the following:

```yaml
# discrete val
#
root:
  key-1: val-1
  # list val
  #
  key-2:
    - val-2-1
    - val-2-2
  # map val
  #
  key-3:
    key-3-1: val-3-1
    key-3-2: val-3-2
```

1. `root.key-1` can be specified with an environment-variable `ROOT__KEY_1` = `val-1-x`
1. `root.key-2` can be specified with an env-var like `ROOT__KEY_2` = `[val-2-1-x, val-2-2-x]`
1. `root.key-3.key-3-1` can be specified with an env-var like `ROOT__KEY_3__KEY_3_1` = `val-3-2-x`

> note the use of a double-underscore `__` to imply a nested value
> strategy lifted from [the dynaconf python based configuration package](https://www.dynaconf.com/)

## development

1. `git clone {repo name}`
1. `cd {repo name}`
1. `npm i`
1. `npm test`

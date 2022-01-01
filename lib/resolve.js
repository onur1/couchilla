const os = require('os')
const fs = require('fs')
const path = require('path')
const toposort = require('toposort')
const depsSort = require('deps-sort')
const crypto = require('crypto')
const babelify = require('babelify')
const moduleDeps = require('module-deps')
const collect = require('stream-collector')
const rollup = require('rollup')
const { nodeResolve } = require('@rollup/plugin-node-resolve')

const BUILTIN_REDFUN_COMMENT = /\/\*\s*builtin\s\s*(_approx_count_distinct|_count|_stats|_sum)\s*\*\//

function onresolve(cb) {
  return (er, deps) => {
    if (er) {
      return cb(er)
    }

    if (!deps.length) {
      return cb(new Error('could not resolve deps (len=0)'))
    } else if (deps.length === 1) {
      return cb(null, deps)
    }

    const sorter = depsSort({ dedupe: false, index: true })

    collect(sorter, (er, deps) => {
      if (er) {
        return cb(new Error('could not sort modules: ' + er.message))
      }

      const graph = []
      deps.forEach(d =>
        Object.values(d.deps).forEach(dep => {
          graph.push([d.file, dep])
        })
      )

      const sortedDeps = toposort(graph)
        .reverse()
        .map(d => deps[deps.findIndex(el => el.id === d)])

      sortedDeps.splice(
        sortedDeps.findIndex(d => d.entry === true),
        1
      )

      cb(null, sortedDeps)
    })

    for (let i = 0; i < deps.length; ++i) {
      sorter.write(deps[i])
    }

    sorter.end()
  }
}

module.exports = (files, babelifyOptions, cb) => {
  if (!files.length) {
    return cb(new Error('No files found'))
  }

  const resolver = moduleDeps({
    transform: [[babelify, babelifyOptions]]
  })

  const entryFile = path.join(os.tmpdir(), 'couchilla-' + crypto.randomBytes(24).toString('hex') + '.js')

  const end = ds => {
    let s = ''
    const ret = []

    for (let i = 0; i < ds.length; ++i) {
      s = path.basename(ds[i].file).split('.')
      if (s.length === 3 && s[1].toLowerCase() === 'reduce') {
        const m = ds[i].source.match(BUILTIN_REDFUN_COMMENT)
        if (m) {
          ret.push(
            Promise.resolve({
              ...ds[i],
              source: m[1],
              builtin: true
            })
          )
        } else {
          ret.push(
            rollup
              .rollup({
                input: ds[i].file,
                plugins: [nodeResolve()]
              })
              .then(b => b.generate({ format: 'iife', sourcemap: 'false', name: '_default' }))
              .then(res => ({
                ...ds[i],
                source: res.output[0].code
              }))
              .catch(er => new Error('rollup error: ' + er.message))
          )
        }
      } else {
        ret.push(Promise.resolve(ds[i]))
      }
    }

    Promise.all(ret)
      .then(xs => cb(null, xs))
      .catch(er => cb(er))
  }

  collect(
    resolver,
    onresolve((er, res) =>
      er
        ? cb(er)
        : fs.unlink(entryFile, er =>
            er ? cb(new Error('error while removing temporary module entry file: ' + entryFile)) : end(res)
          )
    )
  )

  fs.writeFile(entryFile, files.map(file => `require('${file}');`).join('\n'), er =>
    er
      ? cb(new Error('error while writing temporary module entry file: ' + entryFile))
      : resolver.end({ file: entryFile })
  )
}

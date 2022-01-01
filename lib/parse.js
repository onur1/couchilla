const glob = require('glob')
const path = require('path')
const presetEnv = require('@babel/preset-env')
const rewriteRequires = require('transform-deps')
const resolve = require('./resolve')

module.exports = (dir, cb) =>
  glob(
    '{**/+(views|filters|updates)/*.js,validate_doc_update.js}',
    { realpath: true, silent: true, cwd: path.resolve(dir), nodir: true },
    (er, entries) =>
      er
        ? cb(er)
        : resolve(
            entries,
            {
              plugins: [],
              presets: [[presetEnv, { loose: true, targets: { esmodules: false } }]],
              babelrc: false,
              ast: false,
              comments: true,
              sourceMaps: false
            },
            (er, files) =>
              er
                ? cb(er)
                : cb(
                    null,
                    files.reduce((b, x) => {
                      const { id: file } = x
                      const baseName = path.basename(file)
                      const baseNameNoExt = baseName.split('.').slice(0, -1).join('.')
                      const dirName = path.basename(path.dirname(file))
                      const isEntry = entries.indexOf(x.id) >= 0
                      const type = isEntry
                        ? dirName === 'views'
                          ? baseNameNoExt.endsWith('.reduce')
                            ? 'Reduce'
                            : 'Map'
                          : dirName === 'filters'
                          ? 'Filter'
                          : dirName === 'updates'
                          ? 'Update'
                          : baseName === 'validate_doc_update.js'
                          ? 'ValidateDocUpdate'
                          : null
                        : 'Lib'

                      if (!type) {
                        return b
                      }

                      return b.concat({
                        ...x,
                        ...{
                          name:
                            type === 'Lib'
                              ? String(x.index)
                              : ['.reduce', '.map']
                                  .map(t => s => (s.endsWith(t) ? s.slice(0, t.length * -1) : s))
                                  .reduce((b, a) => a(b), baseNameNoExt),
                          source:
                            type !== 'Reduce'
                              ? rewriteRequires(x.source, n => {
                                  const dep = x.deps[n]
                                  if (dep) {
                                    const a = isEntry ? 'views/lib/' : './'
                                    const b = files.find(x => x.file === dep)
                                    if (b) {
                                      return a + b.index
                                    } else {
                                      throw new Error('missing dependency of ' + x.file)
                                    }
                                  } else {
                                    return n
                                  }
                                })
                              : x.source,
                          type
                        }
                      })
                    }, [])
                  )
          )
  )

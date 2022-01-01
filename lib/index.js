const {
  arrayGroupBy,
  recordMapWithIndex,
  arrayPartition,
  recordMap,
  arrayReduce,
  recordInsertAt,
  pipe
} = require('./function')
const parse = require('./parse')

const designFunctionType = x =>
  x.type === 'Map' || x.type === 'Reduce' || x.type === 'Lib'
    ? 'views'
    : x.type === 'Filter'
    ? 'filters'
    : x.type === 'Update'
    ? 'updates'
    : 'validate_doc_update'

const designFunctionSource = pipe(
  x => [
    x,
    `function() {\n${x.type !== 'Reduce' ? '"use strict";' : ''}` +
      x.source
        .split('\n')
        .filter(x => !(x.startsWith('exports') || x.startsWith('"use strict"')))
        .join('\n')
  ],
  ([x, s]) => (x.type !== 'Lib' ? s + `\nreturn _default.apply(null, arguments);\n\n}\n` : s)
)

const designFunction = x =>
  x.type === 'Lib'
    ? x
    : {
        ...x,
        ...{
          source: x.builtin ? x.source : designFunctionSource(x)
        }
      }

module.exports = (dir, cb) =>
  parse(dir, (er, xs) =>
    er
      ? cb(er)
      : cb(
          null,
          pipe(
            arrayGroupBy(designFunctionType),
            recordMapWithIndex((key, value) =>
              key === 'validate_doc_update'
                ? value[0].source
                : key === 'views'
                ? pipe(
                    arrayPartition(x => x.type === 'Lib'),
                    ({ left: views, right: lib }) =>
                      pipe(
                        arrayGroupBy(x => x.name),
                        recordMap(arrayReduce({}, (b, a) => ({ ...b, ...{ [a.type.toLowerCase()]: a.source } }))),
                        recordInsertAt(
                          'lib',
                          arrayReduce({}, (b, a) => ({ ...b, ...{ [String(a.name)]: a.source } }))(lib)
                        )
                      )(views)
                  )(value)
                : pipe(
                    arrayGroupBy(x => x.name),
                    recordMap(x => x[0].source)
                  )(value)
            )
          )(xs.map(designFunction))
        )
  )

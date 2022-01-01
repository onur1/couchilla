const hasOwnProperty = Object.prototype.hasOwnProperty

const recordMapWithIndex = f => fa => {
  const out = {}
  const keys = Object.keys(fa)
  for (const key of keys) {
    out[key] = f(key, fa[key])
  }
  return out
}

exports.recordMapWithIndex = recordMapWithIndex

const arrayPartitionWithIndex = predicateWithIndex => fa => {
  const left = []
  const right = []
  for (let i = 0; i < fa.length; i++) {
    const a = fa[i]
    if (predicateWithIndex(i, a)) {
      right.push(a)
    } else {
      left.push(a)
    }
  }
  return {
    left,
    right
  }
}

exports.arrayPartitionWithIndex = arrayPartitionWithIndex

exports.arrayPartition = predicate => arrayPartitionWithIndex((_, a) => predicate(a))

exports.recordMap = f => recordMapWithIndex((_, a) => f(a))

exports.pipe = (...fns) => x => fns.reduce((a, f) => f(a), x)

exports.arrayGroupBy = f => as => {
  const r = {}
  for (const a of as) {
    const k = f(a)
    if (hasOwnProperty.call(r, k)) {
      r[k].push(a)
    } else {
      r[k] = [a]
    }
  }
  return r
}

exports.recordInsertAt = (k, a) => r => {
  if (r[k] === a) {
    return r
  }
  const out = Object.assign({}, r)
  out[k] = a
  return out
}

const arrayReduceWithIndex_ = (fa, b, f) => {
  const l = fa.length
  let r = b
  for (let i = 0; i < l; i++) {
    r = f(i, r, fa[i])
  }
  return r
}

exports.arrayReduce = (b, f) => fa => arrayReduceWithIndex_(fa, b, (_, b, a) => f(b, a))

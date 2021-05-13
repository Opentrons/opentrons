// remote object promise factory
// RemoteObjects are what actually get passed to the JS app
// "mirrors" a Python API object

function isRemoteObject(source) {
  return source != null && typeof source === 'object' && source.i && source.t
}

export function RemoteObject(context, source, options, seen) {
  options = options || { methods: true }
  seen = seen || new Map()

  if (Array.isArray(source)) {
    // iterate over the children serially, waiting for each RemoteObject
    // to resolve before moving on to the next one. Returns a promise that
    // resolves to an array of RemoteObjects. Bluebird would make this cleaner
    return source.reduce(
      (result, s) =>
        result.then(acc => {
          return RemoteObject(context, s, options, seen).then(remote => {
            acc.push(remote)
            return acc
          })
        }),
      Promise.resolve([])
    )
  }

  if (!isRemoteObject(source)) {
    return Promise.resolve(source)
  }

  const id = source.i
  const value = source.v
  let remote

  // if we haven't seen this ID before, mark it as seen
  // otherwise, operate on the remote node we've already saved
  if (seen.has(id)) {
    remote = seen.get(id)
  } else {
    remote = {}
    seen.set(id, remote)
  }

  // if value is null, this is a light reference
  // just resolve the existing node and it'll be built up
  // by the full definition elsewhere in the graph
  if (value == null) {
    return Promise.resolve(remote)
  }

  // get all props and resolve remote objects for any children
  const getProps = Object.keys(source.v)
    .map(key => ({ key, value: source.v[key] }))
    // TODO(mc): consider using Bluebird because this reduce is hard to read
    .reduce(
      (accPromise, sourceChild) =>
        accPromise.then(acc =>
          RemoteObject(context, sourceChild.value, options, seen).then(
            remoteValue =>
              Object.assign(acc, {
                [sourceChild.key]: remoteValue,
              })
          )
        ),
      Promise.resolve({})
    )

  // setup method calls based on type shape
  const getMethods =
    options.methods &&
    context.resolveTypeValues(source).then(typeObject =>
      Object.keys(typeObject).reduce((result, key) => {
        result[key] = function remoteCall(...args) {
          // TODO(mc, 2017-10-04): recurse down arrays of objects, too
          // TODO(mc, 2017-10-04): check if dicts need to be mapped to {v: obj}
          const argsWithRemotes = args.map(a => {
            if (a._id != null) return { i: a._id }

            return a
          })

          return context.callRemote(id, key, argsWithRemotes)
        }

        return result
      }, {})
    )

  return Promise.all([getProps, getMethods]).then(([props, methods]) => {
    const result = Object.assign(remote, props)
    if (methods) Object.assign(result, methods)
    return Object.assign(result, { _id: id })
  })
}

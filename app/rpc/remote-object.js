// remote object promise factory
// RemoteObjects are what actually get passed to the JS app
// "mirrors" a Python API object

function isRemoteObject(source) {
  return (
    source != null &&
    typeof source === 'object' &&
    source.i &&
    source.t
  )
}

// put obj.v == null last
function sortByValue(a, b) {
  if (b.value.v == null) {
    return -1
  }

  if (a.value.v == null) {
    return 1
  }

  return 0
}

export default function RemoteObject(context, source, seen) {
  if (!isRemoteObject(source)) {
    return Promise.resolve(source)
  }

  seen = seen || new Map()

  const id = source.i
  const remote = {}

  if (seen.has(id)) {
    return Promise.resolve(seen.get(id))
  }

  // put a reference to the result in the seen map for circular references
  seen.set(id, remote)

  // get all props and resolve remote objects for any children
  // TODO(mc): filter private fields
  // TODO(mc): consider pulling in Bluebird because this reduce is hard to read
  const props = Object.keys(source.v)
    .map((key) => ({ key, value: source.v[key] }))
    .sort(sortByValue)
    .reduce((accPromise, sourceChild) => accPromise.then((acc) => (
      RemoteObject(context, sourceChild.value, seen)
        .then((remoteValue) => Object.assign(acc, { [sourceChild.key]: remoteValue }))
    )), Promise.resolve({}))

  // setup method calls based on type shape
  // TODO(mc): filter "private" methods
  const methods = context.resolveTypeValues(source)
    .then((typeObject) => Object.keys(typeObject).reduce((result, key) => {
      result[key] = function remoteCall(...args) {
        return context.call(id, key, args)
      }

      return result
    }, {}))

  return Promise.all([props, methods]).then(([p, m]) => Object.assign(remote, p, m))
}

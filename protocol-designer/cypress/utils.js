import isEqual from 'lodash/isEqual'
import isObject from 'lodash/isObject'
import transform from 'lodash/transform'

const difference = (object, base) => {
  const changes = (object, base) => {
    return transform(object, function(result, value, key) {
      if (!isEqual(value, base[key])) {
        result[key] =
          isObject(value) && isObject(base[key])
            ? changes(value, base[key])
            : value
      }
    })
  }
  return changes(object, base)
}

// deepEqual won't always return a diff, Cypress doesn't fully support object diffs :(
// also Cypress doesn't seem to support logging to the console? So throwing the diff as an error instead
export const expectDeepEqual = (a, b) => {
  try {
    assert.deepEqual(a, b)
  } catch (e) {
    // visualize undefineds
    const replacer = (key, value) =>
      typeof value === 'undefined' ? '__undefined__' : value
    // TODO IMMEDIATELY: try cy.log(message, args)
    throw Error(
      'Expected deep equal: ' +
        JSON.stringify({ a, b, difference: difference(a, b) }, replacer, 4)
    )
  }
}

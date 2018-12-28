const { assign, create, getPrototypeOf: prototype, keys, values } = Object

// Create a new value from the provided object, key, and value without altering
// the input object. Similar to Object.assign but retains any novel prototypal
// inheritance chaining.
//
function assoc (obj, ...changes) {
  // 1. `prototype` - get the prototype of the provided object
  // 2. `create` - create a new object using the argument as the prototype
  // 3. `assign` - mutate the first argument by merging the remaining arguments
  //    from left to right
  // Combining these three things: create a new object inheriting the same
  // values the input object inherits, then assign a bunch of new values to it.
  // This will be important for maintaining an immutable data store that still
  // can take advantage of prototypal inheritance to manage transactions.
  //
  return assign(create(prototype(obj)), obj, ...changes)
}

// 'transact' creates a new value that prototypally inherits from value,
// which allows us to accumulate changes on the returned object (and its kin)
// while leaving the original in-tact and a little hard to get to. Later,
// `commit` can be called on this value to collapse it into a single flat
// value.
function transact (value) {
  return create(value)
}

// 'commit' collapses a value down to its base prototype, flattening all values
// in the prototype chain into the original prototype. We use it in this
// program for implementing lightweight transactions. This function is
// recursive, but could easily be implemented as a while loop too.
function commit (value) {
  if (prototype(value) === null) {
    return value
  } else {
    return commit(assoc(prototype(value), value))
  }
}

// Rolls back to the value of the prototype. We use it here for rolling back
// transactions.
function rollback (value) {
  if (prototype(value) === null) {
    return value // can't rollback out of the first transaction
  } else {
    return prototype(value)
  }
}

function createFreshState(obj) {
  const data = commit(obj) // collapse into a plain value with null proto
  return {
    data,
    index: values(data).reduce((accumulator, value) => {
      // Mutating the accumulator here.
      // "If you mutate something, but nobody saw it change,
      //  did it really mutate?"
      //   — Rich Hickey
      if (value in accumulator) accumulator[value] += 1
      else accumulator[value] = 1

      return accumulator
    }, create(null))
  }
}

function stateSet({ data, index }, key, value) {
  const oldValue = data[key]
  if (oldValue === value) {
    return { data, index }
  } else {
    return {
      data: assoc(data, { [key]: value }),
      index: assoc(index, {
        [oldValue]: oldValue in index ? Math.max(0, index[oldValue] - 1) : 0,
        [value]: value in index ? index[value] + 1 : 1
      })
    }
  }
}

function stateDelete({ data, index }, key) {
  const value = data[key]
  return {
    data: assoc(data, { [key]: null }),
    index: assoc(index, { [value]: Math.max(0, index[value] - 1) })
  }
}

function stateGet({ data }, key) {
  return data[key] || 'NULL'
}

function stateCount({ index }, key) {
  return index[key] || 0
}

function stateBegin({ data, index }) {
  return {
    data: transact(data),
    index: transact(index)
  }
}

function stateRollback({ data, index }) {
  return {
    data: rollback(data),
    index: rollback(index)
  }
}

function stateCommit({ data, index }) {
  return {
    data: commit(data),
    index: commit(index)
  }
}

module.exports = {
  assoc,
  commit,
  createFreshState,
  stateGet,
  stateSet,
  stateBegin,
  stateCommit,
  stateCount,
  stateDelete,
  stateRollback
}

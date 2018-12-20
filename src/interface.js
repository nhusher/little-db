// This file serves as the parser for commands.
// It maps user-inputted text commands into commands to be applied to the
// application state, defined in state.js
//
const {
  stateBegin,
  stateCommit,
  stateCount,
  stateDelete,
  stateGet,
  stateRollback,
  stateSet,
  createFreshState
} = require('./state')

function result (output, newState) {
  return {output, newState}
}

const commands = {
  get(getState, key) {
    return result(stateGet(getState(), key))
  },
  set(getState, key, value) {
    return result(``, stateSet(getState(), key, value))
  },
  delete(getState, key) {
    return result(``, stateDelete(getState(), key))
  },
  count(getState, value) {
    return result(stateCount(getState(), value))
  },
  end(getState) {
    console.log('Bye!')
    process.exit()
  },
  begin(getState) {
    return result(``, stateBegin(getState()))
  },
  rollback(getState) {
    return result(``, stateRollback(getState()))
  },
  commit(getState) {
    return result(``, stateCommit(getState()))
  }
}

class Befuddle extends Error {}

// Valuates a command string in the
function eval (getState, commandString) {
  const [cmd, ...args] = commandString.split(/\s+/)
  const command = cmd.toLowerCase()

  if (command in commands && commands[command].length === args.length + 1) {
    return commands[command](getState, ...args)
  } else {
    throw new Befuddle()
  }

}

module.exports = {
  eval,
  Befuddle
}

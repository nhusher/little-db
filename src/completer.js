
// For a given data store, return all the keys
//
// TODO: this could be memoized or indexed like values
function getKeys(getState) {
  const keys = []
  for (k in getState().data) keys.push(k)
  return keys
}

// All the commands and how they autocomplete:
const commands = {
  set(getState, token) {
    return getKeys(getState).filter(key => key.startsWith(token || ''))
  },
  get(getState, token) {
    return getKeys(getState).filter(key => key.startsWith(token || ''))
  },
  // Sentinel values -- these commands have no args and so return nothing:
  delete() {},
  count() {},
  end() {},
  begin() {},
  rollback() {},
  commit() {}
}

// Used by the nodejs readline.createInterface function to do autocomplete:
function completer (getState, line) {
  const [cmd, ...args] = line.trim().split(/\s+/)
  const command = cmd.toLowerCase()
  const isUpper = cmd.split('').every(c => c.match(/[A-Z]/))

  if (command in commands && args.length <= commands[command].length - 1) {
    // We have a known command, so check if it can suggest any sub-options
    // in the case of GET/SET we can show the keys available to us in the
    // little db:
    const options = commands[command](getState, ...args) || []
    return [
      options.map(o => `${isUpper ? command.toUpperCase() : command} ${o}`),
      line
    ]
  } else if(args.length === 0) {
    // We may not have a command, but we also definitely don't have args,
    // which means we should show any command that matches the offered
    // command substring. So an empty string shows all commands, the string
    // `C` shows `COMMIT, COUNT`, the string `DELETE` shows just `DELETE`,
    // and so forth.
    const options = Object.keys(commands).filter(c => c.startsWith(command))
    return [
      isUpper ? options.map(o => o.toUpperCase()) : options,
      line
    ]
  } else {
    // Offer no suggestions in the general case:
    return [[], line]
  }
}

module.exports = { completer }

const readline = require('readline')
const { eval, Befuddle } = require('./interface')
const { createFreshState } = require('./state')
const { completer } = require('./completer')

const befuddled = [
  `I'm afraid I can't do that, Dave.`,
  `I don't understand.`,
  `Na pochuye ke, kopeng.`
]

function befuddle () {
  return befuddled[Math.floor(Math.random() * befuddled.length)]
}

function start () {
  let state = createFreshState({})
  function getState () { return state }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: completer.bind(null, getState)
  })
  rl.on('line', line => {
    try {
      const { output, newState } = eval(getState, line)
      state = newState || state
      if (output.toString()) console.log(output)
    } catch (e) {
      if (e instanceof Befuddle) {
        console.log(befuddle())
      } else {
        throw e
      }
    }
  })
}

start()

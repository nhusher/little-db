const assert = require('assert')
const { assoc, commit, createFreshState } = require('../src/state')
const { completer } = require('../src/completer')
const tests = []

tests.push(function assocTests () {
  // Test that assoc does not mutate values:
  const ship = { type: 'ship' }
  const scipio = assoc(ship, { name: 'Scipio Africanus' })

  assert(ship.type === 'ship')
  assert(ship !== scipio, `Expected reference identities to be different`)
  assert(scipio.name === 'Scipio Africanus', `Expected scipio reference to have name 'Scipio Africanus'`)
  assert(ship.name === undefined, `Unexpected name for ship`)

  // Test that assoc retains inheritance chain:
  const frigate = assoc(Object.create(ship), { size: 'frigate' })
  assert(ship.size === undefined, `Unexpected mutation of ship prototype`)
  assert(frigate.size === 'frigate', `Expected frigate to have size "frigate"`)
  assert(frigate.type === 'ship', `Expected frigate to have type "ship"`)

  const rocinante = assoc(frigate, { name: 'Rocinante', armament: ['PDC', 'Torpedo'] })
  assert(rocinante.name === 'Rocinante', `Expected rocinante reference to have name "Rocinante"`)
  assert(rocinante.type === 'ship', `Expected rocinante to have type "ship"`)
  assert(rocinante.size === 'frigate', `Expected rocinante to have size "frigate"`)

  // Test that assoc retains inheritance chain across further modifications #paranoia
  const rocinanteLater = assoc(rocinante, { armament: ['PDC', 'Torpedo', 'Micro Railgun']})
  assert.deepStrictEqual(rocinante.armament, ['PDC', 'Torpedo'])
  assert.deepStrictEqual(rocinanteLater.armament, ['PDC', 'Torpedo', 'Micro Railgun'])
  assert(rocinanteLater.type === 'ship', `Expected to retain ship type`)
})

tests.push(function completerTests () {
  // Test goals:
  // 1. Ensure that autocomplete works for empty strings
  // 2. Ensure that it works for different states
  // 3. Ensure that capitalization doesn't go wonky
  // 4. Ensure that it works for get/set commands that take multiple args
  const state = createFreshState({
    foo: 123,
    bar: 456
  })
  const getState = () => state

  assert.deepStrictEqual(
    completer(getState, ''),
    [ [ 'SET', 'GET', 'DELETE', 'COUNT', 'END', 'BEGIN', 'ROLLBACK', 'COMMIT' ], '' ])

  assert.deepStrictEqual(
    completer(getState, 'C'),
    [ [ 'COUNT', 'COMMIT' ], 'C' ]
  )

  assert.deepStrictEqual( // test case-insensitive suggestions
    completer(getState, 'c'),
    [ [ 'count', 'commit' ], 'c' ]
  )

  assert.deepStrictEqual(
    completer(getState, 'GET'),
    [ [ 'GET foo', 'GET bar' ], 'GET' ]
  )
  assert.deepStrictEqual(
    completer(getState, 'GET f'),
    [ [ 'GET foo' ], 'GET f' ]
  )

  assert.deepStrictEqual(
    completer(getState, 'SET foo 1'),
    [ [], 'SET foo 1' ]
  )
})

tests.push(function commitTests () {
  // Test goals:
  // 1. Ensure deeply-nested transactions commit properly
  // 2. Ensure child transactions don't write into parent transactions
  const start = assoc(Object.create(null), {})
  const tx1 = assoc(start, { engineer: 'Naomi Nagata' })
  const tx2 = assoc(tx1, { mechanic: 'Amos Burton' })
  const tx3 = assoc(tx2, { captain: 'James Holden' })
  const tx4 = assoc(tx3, { pilot: 'Alex Kamal' })
  const tx5 = assoc(tx4, { gunner: 'Bobby Draper' })
  const tx6 = assoc(tx5, { captain: 'Bobby Draper', gunner: null, engineer: null })

  assert.deepEqual(commit(tx6), {
    engineer: null,
    mechanic: 'Amos Burton',
    captain: 'Bobby Draper',
    pilot: 'Alex Kamal',
    gunner: null,
  })

  assert.deepEqual(commit(tx5), {
    engineer: 'Naomi Nagata',
    mechanic: 'Amos Burton',
    captain: 'James Holden',
    pilot: 'Alex Kamal',
    gunner: 'Bobby Draper'
  })

  assert.deepEqual(commit(tx4), {
    engineer: 'Naomi Nagata',
    mechanic: 'Amos Burton',
    captain: 'James Holden',
    pilot: 'Alex Kamal'
  })

  assert.deepEqual(commit(start), {})
})


console.log(`Running ${tests.length} tests...`)
const passed = tests.every(test => {
  try {
    test()
    console.log(`  ${test.name} pass`)
    return true
  } catch (e) {
    console.log(`  ${test.name} fail`)
    console.log(e.valueOf())
    return false
  }
})
if (passed) console.log(`All tests passed!`)

# Little DB

A really simple Javascript-based persistent-immutable in-memory database.

## Usage & Commands

To start little db, simply run `npm start`

Commands are case-insensitive and can be autocomplete with the tab character.
Available database keys will autocomplete with the `GET` or `SET` commands.

- `GET <key>`: Retrieves a key from the data store
- `SET <key> <value>`: Stores a key in the data store as a string
- `DELETE <key>`: Deletes a value from the store
- `COUNT <value>`: Counts the number of distinct keys that have the provided
   value.
- `END`: Terminate the user session.

**Transactions:**

The little db also supports transactions:

- `BEGIN`: Begins a new transaction. Any alterations made to the database while
  within a transaction can be rolled back using the `ROLLBACK` command and can
  be folded into the current state with the `COMMIT` command.
- `ROLLBACK`: Exits the current transaction without applying any changes to the
  current state. Only exits one transaction. This is a no-op when not in a
  transaction.
- `COMMIT`: Commits all open transactions to the final database state. This is
  a no-op when not in a transaction.

## Design

The design of little db is intended to keep mutability—that is, in-place
alteration of values—to an absolute minimum. This means that a snapshot could
be taken of the application state at any point and it would be value-stable.
This design would make it trivial to implement single-command rollback,
transaction logging, time travel, and state branching. It also should make it
much easier to implement multi-user interaction over the same state.

To maintain transaction performance, transactions are implemented with
javascript's prototypal inheritance. Whenever a transaction is created, a new
state is manifested that prototypally inherits from the parent transaction
(or base state if there is no open transaction). This offers a few interesting
benefits:

1. Large numbers of transactions can be opened and memory is conserved between
   them: only the differences in values will be stored.
2. Retaining the first benefit, lookups on values should happen in
   close-to-constant (`O(1)`) time because these sorts of lookups are
   highly-optimized in the V8 runtime. Worst case scenario, lookups are `O(n)`
   where `n` is the number of nested transactions and the coefficient of
   performance would be the native speed of the V8 interpreter.

**Mutation and transaction design details**

Prototypal inheritance can be confusing, to avoid conflation with classical
inheritance systems, any object that prototypically inherit from another object
will be said **derive from** or to be a **derivative** of that object. A brief
refresher:

There are two main tools that you can use to access Javascript's prototypal
inheritance system: `Object.create` and `Object.getPrototypeOf`.

`Object.create` makes a new object that derives from the object provided as the
only argument. If the only argument is `null`, it has a special behavior: it
will create an object with _no_ prototypal inheritance at all. This means that
standard object methods like `.toString` and `.valueOf` are absent, and it
means that changes to the Object prototype will not apply to anything created
with this special `null` prototype. The base value of little db is one such
`null`-prototyped objects.

`Object.getPrototypeOf` returns the prototype of the provided object, or `null`
if it has no prototype. For example, `Object.getPrototypeOf({})` will return
the base Javascript `Object` type. `Object.getPrototypeOf(Object.create(null))`
will return `null`, because it lacks a prototype.

Properties that are inherited prototypically aren't copied onto the
derivatives, instead they are maintained in memory across a *prototype chain*.
This means that many objects derived from the same prototype use very little
additional memory, compared to cloning the derived object. Lookups to the
prototype chain are optimized by the V8 interpreter.

When a `BEGIN` command is entered by the user, the system creates a new
derivative of the current application state. When a `COMMIT` command is
entered, it recursively collapses the values of each derived object onto the
parent object, returning the collapsed value. It does this without mutating
any value in place.

[![npm version](https://img.shields.io/npm/v/@itrocks/template-insight?logo=npm)](https://www.npmjs.org/package/@itrocks/template-insight)
[![npm downloads](https://img.shields.io/npm/dm/@itrocks/template-insight)](https://www.npmjs.org/package/@itrocks/template-insight)
[![GitHub](https://img.shields.io/github/last-commit/itrocks-ts/template-insight?color=2dba4e&label=commit&logo=github)](https://github.com/itrocks-ts/template-insight)
[![issues](https://img.shields.io/github/issues/itrocks-ts/template-insight)](https://github.com/itrocks-ts/template-insight/issues)
[![discord](https://img.shields.io/discord/1314141024020467782?color=7289da&label=discord&logo=discord&logoColor=white)](https://25.re/ditr)

# template-insight

Extends @itrocks/template with decorator parsing, reflection, and translation features.

*This documentation was written by an artificial intelligence and may contain errors or approximations.
It has not yet been fully reviewed by a human. If anything seems unclear or incomplete,
please feel free to contact the author of this package.*

## Installation

```sh
npm i @itrocks/template-insight
```

This package extends the base [`@itrocks/template`](https://github.com/itrocks-ts/template)
engine. It is published as both ESM and CommonJS and can be used in Node.js
applications or build toolchains.

## Usage

### Minimal example

```ts
import { Template } from '@itrocks/template-insight'

const html = await new Template({ name: 'world' }).parseBuffer(`
	<p>Hello {name}!</p>
`)

console.log(html)
// <p>Hello world!</p>
```

### Using decorator and reflection variables

`@itrocks/template-insight` adds two kinds of variables you can use inside
templates, on top of everything offered by `@itrocks/template`:

- **decorator variables**, prefixed by `@`
- **reflection variables**, prefixed by `%`

They are mainly designed to work with the [`@itrocks/reflect`](https://github.com/itrocks-ts/reflect)
ecosystem (class metadata, property metadata, routes, views, …), but you can
also use them directly with class instances.

#### Example: translated property headers

Combined with packages such as
[`@itrocks/list-properties`](https://github.com/itrocks-ts/list-properties)
and [`@itrocks/class-view`](https://github.com/itrocks-ts/class-view), you can
build dynamic tables that automatically use translated property labels.

```ts
import { Template }          from '@itrocks/template-insight'
import { initListProperties } from '@itrocks/list-properties'

initListProperties()

class User {
	name  = ''
	email = ''
}

const template = `
<table>
	<thead>
		<tr>
			<!--%listProperties-->
			<th data-property="{name}">{@display}</th>
			<!--end-->
		</tr>
	</thead>
	<tbody>
		<!--users-->
		<tr>
			<!--%listProperties-->
			<td>{%value(user)}</td>
			<!--end-->
		</tr>
		<!--end-->
	</tbody>
</table>
`

const html = await new Template({
	users: [{ name: 'Alice', email: 'alice@example.com' }],
	user:  new User
}).parseBuffer(template)

console.log(html)
```

In this example:

- `<!--%listProperties-->` is a reflection variable: it iterates over the
  properties selected by `@itrocks/list-properties`.
- `{@display}` is a decorator variable: it prints the translated display label
  of each property (via `@itrocks/class-view` and `@itrocks/translate`).

## API

### `Template` class

```ts
import { Template } from '@itrocks/template-insight'
```

This class **extends** the base `Template` class from `@itrocks/template` and
inherits all of its methods (such as `parseBuffer`, `parseFile`, configuration
options, control-flow directives, includes, …).

Additional behaviour provided by `@itrocks/template-insight`:

- **Decorator variables (`@…`)** handled by the internal `parseDecorator`
  function.
- **Reflection variables (`%…`)** handled by the internal `parseReflect`
  function.
- **Literal translation support** through integration with
  `@itrocks/translate`.

#### Properties

- `doLiteral: boolean`

  When `true` (the default in this subclass), literal strings detected in the
  template can be sent to the translation system when `applyLiterals` is
  called. In typical usage you will interact with this indirectly via
  `@itrocks/translate`.

- `parsers: VariableParser[]`

  Extends the base engine parsers by adding:

  - `['@', parseDecorator]` – handles decorator variables.
  - `['%', parseReflect]` – handles reflection variables.

  This list is public so that advanced users can inspect or customise variable
  parsing if needed.

#### Methods

- `applyLiterals(text: string, parts?: string[]): string`

  Delegates to `@itrocks/translate` to translate a literal piece of text.

  **Parameters**

  - `text`: the literal text as found in the template.
  - `parts`: optional array of dynamic parts (placeholders) coming from the
    template engine.

  **Returns**

  - The translated string.

  This is mainly used internally by the extended template engine, but can also
  be called directly if you build higher-level helpers around it.

### Decorator variables (`@…`)

Decorator variables start with `@` and are resolved by the engine using the
`parseDecorator(variable, data)` function. You normally use them directly in
templates rather than calling any function yourself.

Supported variables are:

- `{@display}`

  - When `data` is a `ReflectProperty`, prints the translated display label of
    the property.
  - When `data` is a `ReflectClass`, prints the translated display label of
    the class.
  - When `data` is a plain object, prints a display label derived from its
    class.
  - Otherwise, returns `data` unchanged.

- `{@output}`

  - Formats the value using the output rules defined by
    `@itrocks/class-view`, then wraps it in an `@itrocks/rename.Str` for
    convenient string usage.

- `{@route}`

  - Produces a URL for the given data using `@itrocks/route` (for example a
    route associated with an entity instance or type).

- `{@typeRoute}`

  - Produces a URL for the **type** of the given data, using
    `@itrocks/class-type` and `@itrocks/route`.

You usually do not need to know the implementation details; just use these
variables in your templates when working with reflected classes or properties.

### Reflection variables (`%…`)

Reflection variables start with `%` and are resolved by the engine through the
`parseReflect(variable, data)` function.

At template time, `data` is typically a `ReflectClass` or `ReflectProperty`
instance, or an object from which a `ReflectClass` can be derived.

The basic behaviour is:

- `%name`

  - Reads the `name` property (or method) on the `ReflectClass`/
    `ReflectProperty` representing the current item.

- `%someMethod("param", 123)`

  - Calls `someMethod("param", 123)` on the underlying reflection object.
  - Parameters can be numbers or quoted strings; escaping inside strings is
    supported.

The exact set of available properties and methods depends on the reflection
objects you pass (coming from `@itrocks/reflect` and its extensions). Common
examples are `%name`, `%type`, `%listProperties`, `%listPropertyNames`, or
custom methods you add on your reflection types.

### String translation helper

For convenience, this package adds a `tr()` method to the
`@itrocks/rename.Str` prototype so that, inside templates or code relying on
that type, you can write:

```ts
// Assuming `label` is a Str instance
label.tr()
```

which returns the translated version of the string using `@itrocks/translate`.

## Typical use cases

- **Building dynamic tables and forms**

  Use reflection variables to iterate over properties of a domain class and
  decorator variables to display human-readable, translated labels.

- **Generating navigation links from routes**

  Use `{@route}` or `{@typeRoute}` in templates to generate URLs from your
  model instances or types, without hard-coding paths.

- **Internationalising literal content**

  Keep your templates written in your main language while delegating
  translation of literals and labels to `@itrocks/translate`, via the
  integration provided by this package.

- **Metadata-driven UIs**

  Combine `@itrocks/template-insight` with `@itrocks/reflect` and its
  extensions (`@itrocks/class-view`, `@itrocks/list-properties`, …) to build
  screens that adapt automatically when your domain model changes.

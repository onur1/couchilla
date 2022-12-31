# couchilla

couchilla is a bundler for packing design documents for CouchDB.

## Install

Install `couchilla` globally with:

```
npm install @onur1/couchilla -g
```

## Usage

Use `couchilla` to bundle a CouchDB [design document](https://docs.couchdb.org/en/stable/ddocs/ddocs.html) from a directory of JavaScript files.

An example directory structure looks like this:

```
.
├── filters
│   └── quu.js
├── views
│   ├── foo.map.js
│   └── bar.reduce.js
└── validate_doc_update.js
```

If you navigate to the [example](./example) and run `couchilla .` in this folder, this will print out a design document (compatible with `3.x`) with the contents of your folder.

## Function formats

Exported function formats should conform to the following spec.

### Views

Files that contain view functions are located in the `views` folder.

#### Map functions

Files whose names end with `.map.js` or only `.js` are transformed into map functions.

##### Example:

Simply `emit` the document ID and optionally a value.

`views/foo.map.js`

```js
/* global emit */

export default doc => emit(doc._id, 42)
```

#### Reduce functions

Files whose names end with `.reduce.js` are transformed into reduce functions.

##### Example:

Take sum of mapped values:

`views/foo.reduce.js`

```js
/* global sum */

export default (keys, values, rereduce) => {
  if (rereduce) {
    return sum(values)
  } else {
    return values.length
  }
}
```

### Filter functions

Files that contain filter functions are located in the `filters` folder.

##### Example:

Filter by field:

`filters/foo.js`

```js
export default (doc, req) => {
  if (doc && doc.title && doc.title.startsWith('C')) {
    return true
  }
  return false
}
```

### validate_doc_update

Just add a `validate_doc_update.js` file in the top-level of your project folder.

```js
/* global log */

export default (newDoc, oldDoc, userCtx, secObj) => {
  log(newDoc)
  log(oldDoc)
  log(userCtx)
  log(secObj)
  throw { forbidden: 'not able now!' }
}
```

### builtin annotation

You can opt to use Erlang native functions with the `builtin` annotation. For example the sum function above can be rewritten as:

`views/foo.reduce.js`

```js
/* builtin _sum */
```

During compilation this will be replaced with a call to the builtin `_sum` function of CouchDB.

## Requiring other modules

All code should be inside the exported default function, including your `require()` calls. `couchilla` can require node modules.

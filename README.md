ddt - Drag and Drop Tables (v0.5)
===

DDT (Drag and Drop Tables) is a library that adds drag and drop reordering support to HTML tables. 

**This does not support IE at the moment and we do not currently intend to make it support IE in the foreseeable future**

## Todo

 - Tests

## Install

```
$ bower install ddt --save
```

## Requirements

 - [jQuery](http://jquery.com) (Version 1.8.3+)
 - [Lo-Dash](http://lodash.com/) (Version 2.4.1+)
 - [eventEmitter)](https://github.com/Wolfy87/EventEmitter) (Version 4.2.7+)
 - [RequireJS](http://requirejs.org/)

Although DDT may work with other versions of these libaries, this use is untested and you may run into issues.

## Usage

```js
require(['ddt'], function(ddt) {
	ddt.init($(yourElementHere)); 
});
```

## Bindings

**@todo Document these bindings**

Knockout comes with bindings for Knockout and jQuery. Simply include the relevant files to add these. We currently have bindings for the following libraries

 - jQuery
 - Knockout

## Contributing

DDT is written in [TypeScript](http://www.typescriptlang.org/), a statically typed pre-processor for JavaScript written by Microsoft. Because of this, all contribution must be written in TypeScript. You can compile the typescript files in the same way we do using [gulp.js](http://gulpjs.com/), like so.

```
$ npm install
$ gulp tsc
```

Besides that, please follow our standard style guide that is in place throughout the library.
# ne-tag-fns [![Build Status](https://travis-ci.org/nyteshade/ne-tag-fns.svg?branch=master)](https://travis-ci.org/nyteshade/ne-tag-fns)  [![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](https://lbesson.mit-license.org/) ![package version](https://img.shields.io/badge/dynamic/json.svg?label=version&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fnyteshade%2Fne-tag-fns%2Fmaster%2Fpackage.json&query=version&colorB=1d7ebe)
## **Template Tags Function Library**

### **Overview**

I am constantly finding myself rewriting variations of this code. So, in big girl fashion, I am putting out a library I can reuse and share with others who seek a similar solution.

### **Installation**

Simply add the module to your code as a regular, peer or dev dependency as you see fit. These instructions presume you will use it as a normal dependency.

```sh
cd <your project folder>
npm install --save ne-tag-fns
```

### **Tag Functions Included**

Tag functions included with the library that are directly usable are

 * `dropLowest`
 * `dedent`
 * `inline`
 * `inlineJoin`

### **`inline` Usage**

The `inline` tag function takes the contents of a given string, even spread over several lines, and converts it to a nice single spaced output. This makes string creation in organizations where you must conform to 80 columns far easier to work with.

Inline does this by performing a few steps
  * If either the first or last line are simply whitespace, they are removed
  * Each line is trim'ed of leading and trailing whitespace
  * All remaining carriage returns and new lines will be converted to a single space.

Example
```javascript
  const { inline } = require('ne-tag-fns') // or
  import { inline } from 'ne-tag-fns'      // if using ES6 with imports

  let description = inline`
    This is a nice message, and its contents
    will be all on a single line.
  `

  description === `This is a nice message, and its contents will be all on a single line` // true
```

### **`inlineJoin` Usage**

The `inlineJoin` tag function takes the contents of a given string, even spread over several lines, and converts it to a nice single spaced output. This makes string creation in organizations where you must conform to 80 columns far easier to work with.

inlineJoin does this by performing a few steps
  * If either the first or last line are simply whitespace, they are removed
  * Each line is trim'ed of leading and trailing whitespace
  * All remaining carriage returns and new lines will be converted to the supplied string.
  * Optionally, all leading newlines can be trimmed
  * Optionally, all trailing newlines can be trimmed

Unlike `inline`, `inlineJoin` needs to be executed with parameters before it
is used as a tag function as its execution actually returns the tag function
customized in the manner desired.

Example
```javascript
  const { inlineJoin } = require('ne-tag-fns') // or
  import { inlineJoin } from 'ne-tag-fns'      // if using ES6 with imports

  let description = inlineJoin('-')`
    ABC
    DEF
  ` === 'ABC-DEF' // true

  let skipLeading = inlineJoin('', true)`

    ABC
    DEF
  ` === 'ABCDEF' // true

  let skipLeadingAndTrailing = inlineJoin('-', true, true)`

    ABC
    DEF
    GHI



  ` === `ABC-DEF-GHI` // true
```

### **`dropLowest` Usage**

In your application, wherever you may have strings that span longer than your code style allows or where you simply wish to clean up your code, import the function and use.

```javascript
const { dropLowest } = require('ne-tag-fns'); // or
import { dropLowest } from 'ne-tag-fns'       // when using import

function someFunction() {
  return dropLowest`
    // A comment that has some code in it
    function contrivedFunction() {
      return 42
    }
  `;
}

// or, more simply...

const someString = dropLowest`
  Some string where all lines in the comment will
  have their common amount of shared whitespace
  removed.
    By default the lowest count, in this case 2,
    will be dropped and these two lines will also
    be flush to the left to allow for some margin
    of error.
      But this set of lines will be indented by
      the difference, so two spaces in.

  - Brie
`
```

### **`dedent` Usage**

If you do not like that the lowest indentation count is dropped, you can use `dedent` to turn off this behavior

```javascript
const { dedent } = require('ne-tag-fns'); // or
import { dedent } from 'ne-tag-fns'       // when using import

const someString = dedent`
  Some string where all lines in the comment will
  have their common amount of shared whitespace
  removed.
    With custom the lowest count, in this case 2,
    will not be dropped and these two lines will also
    keep their indentation
      But this set of lines will be indented as
      seen, so four spaces in.

  - Brie
`
```

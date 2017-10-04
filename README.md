# ne-tag-fns
### **Template Tags Function Library**
_by Brielle Harrison_, _Nyteshade Enterprises_ 

### **Overview**

I am constantly finding myself rewriting variations of this code. So, in big girl fashion, I am putting out a library I can reuse and share with others who seek a similar solution.

### **Installation**

Simply add the module to your code as a regular, peer or dev dependency as you see fit. These instructions presume you will use it as a normal dependency.

```sh
cd <your project folder>
npm install --save ne-tag-fns 
```

### **Usage**

In your application, wherever you may have strings that span longer than your code style allows or where you simply wish to clean up your code, import the function and use.

**ES6 Code Without Modules**

```javascript
const { dedent } = require('ne-tag-fns');

function someFunction() {
  return dedent`
    // A comment that has some code in it
    function contrivedFunction() {
      return 42
    }
  `;
}

// or, more simply...

const someString = dedent`
  Some string where all lines in the comment
  have the first two spaces removed
    So the lines above this one will be flush
    And these two lines will be indented by 2
  
  - Brie
`
```

**ES6 Code With Modules**

```javascript
import { dedent }  from 'ne-tag-fns';

function someFunction() {
  return dedent`
    // A comment that has some code in it
    function contrivedFunction() {
      return 42
    }
  `;
}

// or, more simply...

const someString = dedent`
  Some string where all lines in the comment
  have the first two spaces removed
    So the lines above this one will be flush
    And these two lines will be indented by 2
  
  - Brie
`
```
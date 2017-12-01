'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleSubstitutions = handleSubstitutions;
exports.customDedent = customDedent;
exports.dedent = dedent;


/**
 * One annoyance of working with tag functions is the conversion and inter-
 * weaving of the substitutions to get a string to modify in the first place.
 * This method does that and returns a string.
 *
 * Optionally you can specify a conversion function for each substitution
 * value. The signataure is `function (substitution): string`. It takes in a
 * substitution value, something in `${value}` within a template string and
 * receives a string as output. If none is supplied, a default function that
 * concatenates the value with an empty string is used. This will implicitly
 * invoke `.toString()` most of the time.
 *
 * @param {Array<string>} strings the strings that should be processed with
 * breaks wherever variable substitutions should occur. These map 1:1 to values
 * in `subs`
 * @param {Array<mixed>} subs the values that should be substituted into the
 * values found in
 * @param {Function} convert an optional function that can be used to coerce
 * the substitution to a form other than `sub.toString()`. It takes in the
 * substitution and should return a string value of some sort.
 */
function handleSubstitutions(strings, subs, convert = object => '' + object) {
  let string = strings.join('');

  if (subs && Array.isArray(subs) && subs.length) {
    string = subs.reduce((prev, cur, i) => `${prev}${convert(cur)}${strings[i + 1]}`, strings[0]);
  }

  return string;
}

/**
 * The underpinning of `dedent()` is `customDedent()`. This function takes
 * an options object and returns a tag function. So direct usage would be
 * something like
 *
 * ```
 * let val = customDedent(options)`the string to work on`
 * ```
 *
 * Supported custom functionality currently supports "dropping" the lowest
 * level of indentation as long as the lowest indentation count makes up
 * less than half the overall indentation values. It does this by setting the
 * lowest values to be equal to the second lowest values.
 *
 * @param {Object} options
 */
function customDedent(options = {
  dropLowest: undefined
}) {
  return function dedent(strings, ...subs) {
    // handle the substitution stuff off the bat, just gets in the way
    // if we try to handle it inline below
    strings = handleSubstitutions(strings, subs).split('\n');

    // if the template string is a single value, split it into an array
    // broken out by line
    if (strings.length === 1) {
      strings = strings[0].split('\n');
    }

    // count the indentation for each line; used below
    let indents = strings.map(s => {
      let search = /(^[ \t]*)/.exec(s);
      return search && search[1].length || 0;
    });

    // check to see if we should drop lowest (based on lowest being < half)
    if (options.dropLowest) {
      let isFn = obj => typeof obj === 'function';
      let lowest = Math.min(...indents);
      let occurences = indents.filter(o => o === lowest).length;
      let nextLowest = Math.min(...[].concat(indents).filter(o => o !== lowest));
      let test = isFn(options.dropLowest) && options.dropLowest || ((array, lowest, count) => count < array.length / 2);

      if (test(lengths, lowest, occurences)) {
        indents = indents.map(o => o === lowest ? nextLowest : o);
      }
    }

    // construct a small resuable function for trimming all initial whitespace
    let trimL = s => s.replace(/^([ \t]*)/mg, '');
    let trimR = s => s.replace(/([ \t]*)($)/mg, '$1');

    // the first line is usually a misnomer, discount it if it is only whitespace
    if (!trimL(strings[0]).length) {
      strings.splice(0, 1);
      indents.splice(0, 1);
    }

    // the same goes for the last line
    if (!trimL(strings[strings.length - 1]).length) {
      strings.splice(strings.length - 1, 1);
      indents.splice(indents.length - 1, 1);
    }

    // count the minimal amount of shared leading whitespace
    let excess = Math.min(...indents) || 0;

    // if the excessive whitespace is greater than 0, remove the specified
    // amount from each line
    strings = strings.map(s => s.replace(/([ \t]*)$/, ''));
    strings = strings.map(s => s.replace(new RegExp(`^[ \t]{0,${excess}}`), ''));

    // return a single joined string
    return strings.join('\n');
  };
}

/**
 * This template tag function reduces any leading whitespace of each line of
 * the template string to the line with the least amount. If the first and/or
 * the last lines in the string are nothing but whitespace, then those lines
 * are omitted.
 *
 * @method dedent
 *
 * @param {Array<string>} strings the individual strings that appear around
 * the substitutions that follow in the parameter
 * @param {Array<mixed>} subs with the spread operator this becomes an array
 * of all the potential replacement values
 * @return {string} a combined and dedented string
 */
function dedent(strings, ...subs) {
  return customDedent()(strings, ...subs);
}

exports.default = dedent;
//# sourceMappingURL=functions.js.map
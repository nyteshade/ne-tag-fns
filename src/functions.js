// @flow

// These constants can be discarded in the next major version where
// customDedent is no longer present
const DEDENT = 1
const DEDENT_DROP_LOWEST = 2
const DEDENT_FULL = DEDENT | DEDENT_DROP_LOWEST

// A short term solution to manage potential configurations for customDedent
// in a low logic manner; i.e. without the need for excessive if statements
// kill this in the next major revision
const variations: Map<Number, Function> = new Map()

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
export function handleSubstitutions(
  strings: Array<string>,
  subs: Array<mixed>,
  convert: Function = (object) => '' + object
): string {
  let string = strings.join('');

  if (subs && Array.isArray(subs) && subs.length) {
    string = subs.reduce(
      (prev, cur, i) => `${prev}${convert(cur)}${strings[i + 1]}`,
      strings[0]
    );
  }

  return string;
}

/**
 * Nearly identical to `cautiouslyApply`, this function works on an array of
 * items rather than a single item. The only other difference is that the
 * supplied functors receive the index of the item and the array the item is
 * contained within as second and third parameters, respectively.
 *
 * @param {Array<mixed>} array an array of values to apply each functor to
 * @param {Array<Function>} fns an array of `Function` objects that are to be
 * executed with the supplied `item` as its input and the new value as its
 * output. An error or fals
 * @param {boolean} log true if any errors caused by function execution should
 * be logged
 * @param {boolean} keepOldValueOnFalseyReturn if true and the functor returns
 * a falsey value, the value passed to it as a parameter is used instead
 * @return {Array<mixed>} a copy of the array passed as `array` but with
 * potentially modified internal values
 */
export function cautiouslyApplyEach(
  array: Array<mixed>,
  fns: Array<Function>,
  log: boolean = true,
  keepOldValueOnFalseyReturn: boolean = false
): Array<mixed> {
  let items = Array.from(array)

  if (items && Array.isArray(items) && fns && Array.isArray(fns)) {
    items.forEach((item, itemIndex, itemArray) => {
      let newItem = item

      fns.forEach(fn => {
        try {
          let bindFunctor = Array.isArray(fn) && fn[1]
          let functor = bindFunctor
            ? fn[0].bind(newItem)
            : Array.isArray(fn) ? fn[0] : fn

          if (keepOldValueOnFalseyReturn)
            newItem = functor(newItem, itemIndex, itemArray) || newItem
          else
            newItem = functor(newItem, itemIndex, itemArray)
        }
        catch (error) {
          if (log) {
            console.error(error)
          }
        }
      })

      items[itemIndex] = newItem
    })
  }

  return items
}

/**
 * Given an item that needs to be modified or replaced, the function takes
 * an array of functions to run in order, each receiving the last state of the
 * item. If an exception occurs during function execution the value passed is
 * the value that is kept.
 *
 * Optionally, when the function executes and returns the newly modified state
 * of the object in question, if that value is falsey it can be replaced with
 * the original value passed to the function instead. This is not true by
 * default
 *
 * `fns` is an array of functions, but any of the functions in the list are
 * actually a tuple matching [Function, boolean] **and** the boolean value is
 * true then the function within will be bound to the item it is operating on
 * as the `this` context for its execution before processing the value. It will
 * still receive the item as the first parameter as well.
 *
 * **NOTE: this will not work on big arrow functions**
 *
 * @param {mixed} item any JavaScript value
 * @param {Array<Function>} fns an array of `Function` objects that are to be
 * executed with the supplied `item` as its input and the new value as its
 * output. An error or fals
 * @param {boolean} log true if any errors caused by function execution should
 * be logged
 * @param {boolean} keepOldValueOnFalseyReturn if true and the functor returns
 * a falsey value, the value passed to it as a parameter is used instead
 * @return {mixed} the new value to replace the one supplied as `item`
 */
export function cautiouslyApply(
  item: mixed,
  fns: Array<Function|[Function, boolean]>,
  log: boolean = true,
  keepOldValueOnFalseyReturn: boolean = false
): mixed {
  if (fns && Array.isArray(fns)) {
    fns.forEach(fn => {
      try {
        let bindFunctor = Array.isArray(fn) && fn[1]
        let functor = bindFunctor
          ? fn[0].bind(item)
          : Array.isArray(fn) ? fn[0] : fn

        if (keepOldValueOnFalseyReturn)
          item = functor(item) || item
        else
          item = functor(item)
      }
      catch (error) {
        if (log) {
          console.error(error)
        }
      }
    })
  }

  return item
}

/**
 * Measure indents is something that may be of use for any tag function. Its
 * purpose is to take a string, split it into separate lines and count the
 * leading whitespace of each line. Once finished, it returns an array of
 * two items; the list of strings and the matching list of indents which are
 * related to each other via index.
 *
 * The function also receives a config object which allows you to specify up
 * to three lists worth of functions.
 *
 * `preWork` is a list of functions that receive the following arguments in
 * each callback and are meant as a pluggable way to modify the initial string
 * programmatically by the consuming developer. Examples might be to prune
 * empty initial and final lines if they contain only whitespace
 *
 * ```
 * preWorkFn(string: string): string
 *
 *   - string: the supplied string to be modified by the function with the
 *     new version to be used as the returned value. If null or undefined is
 *     returned instead, the value supplied to the function will be used
 * ```
 *
 * `perLine` is list of functions that receive the following arguments in
 * each callback and are meant as a pluggable way to modify the line in
 * question. The expected return value is the newly modified string from which
 * to measure the indent of. Each item in the list will receive the modified
 * string returned by its predecessor. Effectively this is a map function
 *
 * ```
 * perLine(string: string, index: number, array: Array<string>): string
 * ```
 *
 * `postWork` is a list of functions that get called in order and receive
 * the final results in the form of an array containing two elements. The
 * first is the list of strings and the second is the list of measuredIndents.
 * The format of the supplied value (i.e. array of two arrays) is expected as
 * a return value. Failure to do so will likely end up as a bug someplace
 *
 * ```
 * postWork(
 *   array: Array<Array<string>, Array<number>>
 * ): Array<Array<string>, Array<number>>
 * ```
 *
 * All functions supplied to these arrays, if wrapped in an array with a
 * second parameter of true, will cause the function in question to be bound
 * with the item it is working on as the `this` context.
 *
 * @param {string} string see above
 * @param {Object} config see above
 * @param {RegExp} whitespace the defintion for whitespaced used within
 * @return {Array<Array<string>, Array<number>>} an array containing two
 * arrays; the first being an array of one line per index and the second being
 * an index matched array of numbered offsets indicating the amount of white
 * space that line is prefixed with
 */
export function measureIndents(
  string: string|Array<string>,
  config: Object = {
    preWork: [],
    perLine: [],
    postWork: []
  },
  whitespace: RegExp = /[ \t]/
): Array<Array<string>, Array<number>> {
  let regexp = new RegExp(`(^${whitespace.source}*)`)
  let strings
  let indents

  if (Array.isArray(string)) {
    string = string.join('\n')
  }

  string = cautiouslyApply(string, config.preWork, true, true)
  strings = string.split(/\r?\n/)
  indents = strings.map((s, i, a) => {
    let search

    s = cautiouslyApply(s, config.perLine, true, false)

    search = regexp.exec(s);
    return search && search[1].length || 0;
  });

  return cautiouslyApply([strings, indents], config.postWork)
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
 *
 * @deprecated the options for customDedent seem to always be preferrable in
 * practice and as such, `dedent` and `gql` are simply aliases for the base
 * behavior in `customDedent` now. Expect `customDedent` to be removed in
 * future major revisions of `ne-tag-fns`
 */
export function customDedent(options: Object = { dropLowest: true }) {
  let mask = DEDENT
    | (options.dropLowest ? DEDENT_DROP_LOWEST : 0)

  if (variations.has(mask)) {
    return variations.get(mask)
  }

  return function (ss, ...subs) {
    let [strings, indents] = measureIndents(
      // handle the substitutions right off the bat, it will just make things
      // easier all around
      handleSubstitutions(ss, subs),

      // pass in the handlers to strip empty head and tail strings and then
      // drop the lowest value as this is often a requested feature
      {
        preWork: [stripEmptyFirstAndLast],
        postWork: [
          options.dropLowest
            ? dropLowestIndents
            : NOOP_POSTWORK
        ]
      }
    )

    // count the minimal amount of shared leading whitespace
    let excess = Math.min(...indents) || 0;

    // if the excessive whitespace is greater than 0, remove the specified
    // amount from each line
    if (excess > 0) {
      strings = strings.map(s => s.replace(/([ \t]*)$/, ''));
      strings = strings.map(s => s.replace(
        new RegExp(`^[ \t]{0,${excess}}`), ''
      ));
    }

    // return a single joined string
    return strings.join('\n');
  }
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
export function dedent(strings, ...subs) {
  return customDedent({dropLowest: false})(
    strings,
    ...subs
  )
}

/**
 * This template tag function reduces any leading whitespace of each line of
 * the template string to the line with the least amount. In some cases,
 * depending on how your source is written, dropping the lowest indent count
 * helps. This does that. So if you lines are indented `[2, 4, 4, 8]` then using
 * `dropLowest` instead of `dedent` makes it effectively `[4, 4, 4, 8]`. Like
 * `dedent', if the first and/or the last lines in the string are nothing but
 * whitespace, then those lines are omitted.
 *
 * @method dropLowest
 *
 * @param {Array<string>} strings the individual strings that appear around
 * the substitutions that follow in the parameter
 * @param {Array<mixed>} subs with the spread operator this becomes an array
 * of all the potential replacement values
 * @return {string} a combined and dedented string
 */
export function dropLowest(strings, ...subs) {
  return customDedent({dropLowest: true})(
    strings,
    ...subs
  )
}

/**
 * An alternate name for `dedentDropLowest` that can be used to trigger syntax
 * highlighting when used with GraphQL SDL/IDL strings in some IDEs and editors
 *
 * @type {Function}
 * @see #dedentDropLowest
 * @see #customDedent
 */
export const gql = dedent

/**
 * Many times the desire to just make a single long string from several lines
 * of text is useful with tag functions. This provides that capability. And
 * before returning, each line found in the string will be trimmed of any
 * whitespace. Finally any remaining newlines other than the first and last, if
 * the first and last contain only whitespace, will be treated as a single
 * space
 *
 * @param {Array<string>} strings the strings that should be processed with
 * breaks wherever variable substitutions should occur. These map 1:1 to values
 * in `subs`
 * @param {Array<mixed>} subs the values that should be substituted into the
 * values found in
 * @return {string} a single string with spaces instead of line breaks and the
 * first and last lines removed if they contain only white space
 */
export function inline(ss, ...subs) {
  let string = handleSubstitutions(ss, ...subs)
  let [strings, indents] = measureIndents(string, {
    preWork: [stripEmptyFirstAndLast],
    perLine: [s => s.trim()],
    postWork: [trimAllIndents]
  })

  // count the minimal amount of shared leading whitespace
  let excess = Math.min(...indents) || 0;

  // if the excessive whitespace is greater than 0, remove the specified
  // amount from each line
  if (excess > 0) {
    strings = strings.map(s => s.replace(/([ \t]*)$/, ''));
    strings = strings.map(s => s.replace(
      new RegExp(`^[ \t]{0,${excess}}`), ''
    ));
  }

  return strings.join(' ')
}

// Create cached variation with false for all options
variations.set(DEDENT,
  customDedent({dropLowest: false})
)

// Create cached variation with true for dropping lowest
variations.set(DEDENT | DEDENT_DROP_LOWEST,
  customDedent({dropLowest: true})
)

/**
 * A `preWork` functor for use with `measureIndents` that strips the first and
 * last lines from a given string if that string has nothing but whitespace. A
 * commonly desired functionality when working with multiline template strings
 *
 * @param  {string} string the string to parse
 * @return {string} a modified string missing bits that make up the first and/
 * or last lines **if** either of these lines are comprised of only whitespace
 */
export function stripEmptyFirstAndLast(string: string): string {
  let strings = string.split(/\r?\n/)
  // construct a small resuable function for trimming all initial whitespace
  let trimL = s => s.replace(/^([ \t]*)/, '');
  let trimR = s => s.replace(/([ \t]*)($)/, '$1');

  // the first line is usually a misnomer, discount it if it is only
  // whitespace
  if (!trimL(strings[0]).length) {
    strings.splice(0, 1);
  }

  // the same goes for the last line
  if (!trimL(strings[strings.length - 1]).length) {
    strings.splice(strings.length - 1, 1);
  }

  return strings.join('\n')
}

/**
 * A `postWork` functor for use with `measureIndents` that will modify the
 * indents array to be an array missing its lowest number.
 *
 * @param {[Array<string>, Array<number>]} values the tuple containing the
 * modified strings and indent values
 * @return {[Array<string>, Array<number>]} returns a tuple containing an
 * unmodified set of strings and a modified indents array missing the lowest
 * number in the list
 */
export function dropLowestIndents(
  values: [Array<string>, Array<number>]
): [Array<string>, Array<number>] {
  let [strings, indents] = values
  let set = new Set(indents)
  let lowest = Math.min(...indents)

  set.delete(lowest)

  return [strings, Array.from(set)]
}

/**
 * A `postWork` functor for use with `measureIndents` that will modify the
 * indents array to be a very large number so that all leading whitespace
 * is removed.
 *
 * @param {[Array<string>, Array<number>]} values the tuple containing the
 * modified strings and indent values
 * @return {[Array<string>, Array<number>]} returns a tuple containing an
 * unmodified set of strings and a modified indents array with a single large
 * number so that all leading whitespace is removed.
 */
export function trimAllIndents(
  values: [Array<string>, Array<number>]
): [Array<string>, Array<number>] {
  return [values[0], [Number.MAX_SAFE_INTEGER]]
}

/**
 * A simple non operation preWork function that can make writing and reading
 * code that uses measureIndents easier to work with.
 *
 * @param {string} string any string value
 * @return {string} the value passsed in as `string`
 */
export function NOOP_PREWORK(string: string): string {
  return string
}

/**
 * A simple non operation preWork function that can make writing and reading
 * code that uses measureIndents easier to work with.
 *
 * @param {string} string any string value
 * @param {number} index the index of `string` within `array`
 * @param {Array<string>} array the array containing `string`
 * @return {string} the value passsed in as `string`
 */
export function NOOP_PERLINE(
  string: string,
  index: number,
  array: Array<string>
): string {
  return item
}

/**
 * A simple non operation postWork function that can make writing and reading
 * code that uses measureIndents easier to work with.
 *
 * @param {[Array<string>, Array<number>]} values the tuple containing the
 * modified strings and indent values
 * @return {[Array<string>, Array<number>]} the same value passed in as `values`
 */
export function NOOP_POSTWORK(
  values: [Array<string>, Array<number>]
): [Array<string>, Array<number>] {
  return values
}

// Export the variations in the case someone needs to tweak the runtime
export { variations }

export default dedent;

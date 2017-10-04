
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
  // handle the substitution stuff off the bat, just gets in the way 
  // if we try to handle it inline below 
  if (subs && subs.length) {
    strings = subs.reduce(
      (prev, cur, i) => `${prev}${cur}${strings[i + 1]}`,
      strings[0]
    ).split('\n');
  }
  
  // if the template string is a single value, split it into an array 
  // broken out by line 
  if (strings.length === 1) {
    strings = strings[0].split('\n')
  }
  
  // count the indentation for each line; used below
  let indents = strings.map(s => {
    let search = /(^[ \t]*)/.exec(s) 
    return search && search[1].length || 0
  })
  
  // construct a small resuable function for trimming all initial whitespace 
  let trimL = s => s.replace(/^([ \t]*)/, '')
  let trimR = s => s.replace(/([ \t]*)($)/, '$1')
  
  // the first line is usually a misnomer, discount it if it is only whitespace
  if (!trimL(strings[0]).length) { 
    strings.splice(0, 1)
    indents.splice(0, 1) 
  }
  
  // the same goes for the last line
  if (!trimL(strings[strings.length - 1]).length) { 
    strings.splice(strings.length - 1, 1)
    indents.splice(indents.length - 1, 1) 
  }
  
  // count the minimal amount of shared leading whitespace
  let excess = Math.min(...indents) || 0

  
  // if the excessive whitespace is greater than 0, remove the specified 
  // amount from each line 
  strings = strings.map(s => s.replace(/([ \t]*)$/, ''))
  strings = strings.map(s => s.replace(new RegExp(`^[ \t]{0,${excess}}`), ''))   
  
  // return a single joined string
  return strings.join('\n')
}

module.exports = {
  dedent,
  
  default: {
    dedent
  }
}
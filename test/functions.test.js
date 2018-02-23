import {
  dedent,
  dropLowest,
  gql,
  cautiouslyApply,
  cautiouslyApplyEach,
  measureIndents,
  dropLowestIndents,
  stripEmptyFirstAndLast,
  inline
} from '../src/functions'

describe('dedent', () => {
  let expression = dedent`
    Some string where all the lines in the comment will
    have their common amount of shared whitespace removed.
      This line will be indented by two more spaces than
      the two previous ones
  `

  it('should maintain all visible indentation', () => {
    expect(expression).toBe([
      'Some string where all the lines in the comment will',
      'have their common amount of shared whitespace removed.',
      '  This line will be indented by two more spaces than',
      '  the two previous ones'
    ].join('\n'))
  })
})

describe('dropLowest', () => {
  const include = "stdio.h"
  const pattern = "%d %s"

  // Do not reformat this weird indentation. It is on purpose.

            let expression = dropLowest`
              This is a test of the emergency broadcast system

              #include <${include}>

              int main(int argc, char **argv) {
                for (int i = 0; i < argc; i++) {
                  printf("${pattern}", i, argv[i])
                }
              }
            `

  const comparison = [
    'This is a test of the emergency broadcast system\n',
    '\n',
    '#include <', include, '>\n',
    '\n',
    'int main(int argc, char **argv) {\n',
    '  for (int i = 0; i < argc; i++) {\n',
    '    printf("', pattern, '", i, argv[i])\n',
    '  }\n',
    '}'
  ].join('')

  it('a "dedent"\'ed string should match a handcrafted one', () => {
    expect(expression).toEqual(comparison)
  })
})

describe('ensure that aliases are kept up', () => {
  it('asserts that gql and dedent are the same', () => {
    expect(gql).toBe(dedent)
  })
})

describe('ensure that cautiouslyApply works', () => {
  it('should be able to modify a number', () => {
    expect(cautiouslyApply(5, [i => i * 2])).toBe(10)
  })

  it('should be able to chain effects', () => {
    expect(cautiouslyApply(5, [i => i * 2, i => i + 2])).toBe(12)
  })

  it('should ignore errored functions with no change', () => {
    let answer = cautiouslyApply(5, [
      i => i * 2,
      i => { throw new Error() },
    ], false)

    expect(answer).toBe(10)
  })

  it('should process things after an error', () => {
    let answer = cautiouslyApply(5, [
      i => i * 2,
      i => { throw new Error() },
      i => i + 2
    ], false)

    expect(answer).toBe(12)
  })
})

describe('ensure that cautiouslyApplyEach works', () => {
  let strings = ['he', 'him', 'his']
  let functors = [
    i => i.replace(/\bhe\b/, 'she'),
    i => i.replace(/\bhim\b/, 'her'),
    i => i.replace(/\bhis\b/, 'hers')
  ]

  it('should apply each functor to each item', () => {
    expect(cautiouslyApplyEach(strings, functors)).toEqual(
      expect.arrayContaining(['she', 'her', 'hers'])
    )
  })

  it('should continue to apply even if there is an error', () => {
    let functorsWError = Array.from(functors)

    functorsWError.splice(1, 0, i => { throw new Error() })
    expect(cautiouslyApplyEach(strings, functors, false)).toEqual(
      expect.arrayContaining(['she', 'her', 'hers'])
    )
  })
})

describe('check that measureIndents does what we expect', () => {
  it('should see simple counts irrespective of line endings', () => {
    let sample = 'zero\n one\r\n  two\n   three'

    expect(measureIndents(sample)).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          'zero',
          ' one',
          '  two',
          '   three'
        ]),
        expect.arrayContaining([0, 1, 2, 3])
      ])
    )
  })

  it('should also squash empty first and last with functor', () => {
    let sample = '    \nzero\n one\r\n  two\n   three\n'

    expect(
      measureIndents(
        sample,
        {
          preWork: [stripEmptyFirstAndLast]
        }
      )
    ).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          'zero',
          ' one',
          '  two',
          '   three'
        ]),
        expect.arrayContaining([0, 1, 2, 3])
      ])
    )
  })
})

describe('check to see that dropLowestIndents works as expected', () => {
  let values = [2, 4, 4, 6]

  it('should only have 4 as its minimum value', () => {
    let [, indents] = dropLowestIndents([[], values])
    expect(Math.min(...indents)).toBe(4)
  })
})

describe('check to see that inline works as expected', () => {
  it('should be "one, two, three"', () => {
    let string = inline`
      one,
      two,
      three
    `

    expect(string).toBe('one, two, three')
  })
})


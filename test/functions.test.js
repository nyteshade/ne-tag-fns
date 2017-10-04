import { dedent } from '../src/functions'

describe('dedent', () => {
  let include = "stdio.h"
  let pattern = "%d %s"

            let expression = dedent`
              This is a test of the emergency broadcast system
              
              #include <${include}>
              
              int main(int argc, char **argv) {
                for (int i = 0; i < argc; i++) {
                  printf("${pattern}", i, argv[i])
                }
              }  
            `
            
  let comparison = [
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

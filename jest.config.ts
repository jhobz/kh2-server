import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts-esm',
//   globals: {
//     'ts-jest': {
//       useESM: true,
//     },
//   },
  verbose: true,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ["node_modules/(?!nanoid)"]
}

export default config
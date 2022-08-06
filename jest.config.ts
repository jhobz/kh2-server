import type { Config } from '@jest/types'

const config: Config.InitialOptions = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  moduleNameMapper: {
    "(.+)\\.js": "$1" // idk exactly how this works but it makes imports with file extensions work with jest
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        rootDir: '.'
      }
    }
  },
  transformIgnorePatterns: ["node_modules/(?!nanoid)"],
}

export default config
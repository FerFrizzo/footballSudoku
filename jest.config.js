module.exports = {
  preset: 'jest-expo',
  // Disable watchman — it hangs scanning the .cache/ directory on this project
  watchman: false,
  // Runs after the Jest test framework is installed — allows jest.mock, expect extensions, etc.
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/.*|sentry-expo|native-base|react-native-svg|zustand)',
  ],
  // Only scan src/ — prevents jest-haste-map from crawling .cache/ .local/ etc.
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/__tests__/**/*.test.[jt]s?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

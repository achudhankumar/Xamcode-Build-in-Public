import path from 'path';

const testConfig = {
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**', '.git/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve('./src'),
    },
  },
};

export default testConfig;

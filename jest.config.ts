export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/__tests__/**',
	],
	moduleFileExtensions: ['ts', 'js', 'json', 'node'],
	moduleNameMapper: {
		'^@features/(.*)$': '<rootDir>/src/features/$1',
		'^@shared/(.*)$': '<rootDir>/src/shared/$1',
		'^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
	},
};

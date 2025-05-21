install: # Dependencies installation
	npm ci
	npm link

lint: #eslint launch
	npx eslint .

test: #launch of tests
	npm test
	
test-coverage: #test coverage check
	npm run test:coverage
	
publish: #npm dry run
	npm publish --dry-run
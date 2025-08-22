install:
	  npm ci
	  npm link

test:
	  npm test

test-coverage:
	  npm run test:coverage
	  
publish:
	npm publish --dry-run
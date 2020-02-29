browser.bundle.js: browser.js
	npm run bundle
watch:
	fswatch -0 -o -l .1 browser.js | xargs -0 -n 1 -I {} make
all: browser.bundle.js data/ie_data.xls.json

browser.bundle.js: browser.js shiller.js
	npm run bundle
watch:
	fswatch -0 -o -l .1 browser.js shiller.js | xargs -0 -n 1 -I {} make
data/ie_data.xls:
	cd data && wget http://www.econ.yale.edu/~shiller/data/ie_data.xls && cd ..
data/ie_data.xls.json: data/ie_data.xls
	npm run build && node node.js
# Shiller Heat

Heatmaps and horizon analysis of investing in the S&P 500 between 1871 to present, courtesy of Robert Shiller's [_Irrational Exuberance_](http://www.econ.yale.edu/~shiller/data.htm) data set.

**_See https://fasiha.github.io/post/excess-returns/_**

## Rerun instructions

0. If you don't have these, install [Git](https://git-scm.com) and [Node.js](https://nodejs.org) (any recent version)
1. Clone this repo and enter the directory and install dependencies: `git clone https://github.com/fasiha/shiller-heat.git && cd shiller-heat && npm i` (if you prefer pnpm to save disk space, you can run `npx pnpm i`)
2. Download the latest `ie_data.xls` and put it in `data/`
3. Delete `data/ie_data.xls.json`
4. run `npm run build && node node.js`

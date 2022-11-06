rm -rf dist/
npm run build
git push && git subtree push --prefix dist origin master
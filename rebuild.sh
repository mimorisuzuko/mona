#!/bin/sh

home=`pwd`
version=`electron -v`
version=${version:1}

for dir in robotjs
do
    cd node_modules/$dir
	HOME=~/.electron-gyp node-gyp rebuild --target=$version --arch=x64 --dist http://atom.io/download/atom-shell
	cd "$home"
done
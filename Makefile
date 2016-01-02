build: build-electron
	for directory in BitCannon-darwin-x64 BitCannon-linux-ia32 BitCannon-linux-x64 BitCannon-win32-ia32 BitCannon-win32-x64 ; do \
		7z a ../build/$$directory.zip -tzip -mx=9 ../build/$$directory; \
	done
build-electron:
	@echo "Building BitCannon with Electron..."
	@echo "This is experimental, lots of things don't work properly."
	npm install -g electron-prebuilt
	npm install -g electron-packager
	electron-packager . BitCannon --platform=all --arch=all --version=0.36.2 --icon=./src/bitcannon/resources/bitcannon --out ../build --overwrite --ignore=Makefile --ignore=.idea --ignore=.vscode
clean:
	@rm -rf node_modules
	@rm -rf src/bitcannon/node_modules
	@rm -rf src/server/node_modules
	@rm -rf src/server/public/bower_components
	@rm -rf src/providers/database/node_modules
	@rm -rf src/providers/rss/node_modules
deps:
	npm install;
	@cd src/bitcannon; \
	npm install
	@cd src/server; \
	npm install; \
	npm install -g bower; \
	bower --allow-root -f install
	@cd src/providers/database/mongodb; \
	npm install
	@cd src/providers/rss; \
	npm install
eslint-deps:
	npm install -g eslint
	npm install -g eslint-config-airbnb
	npm install -g eslint-plugin-react
jshint-deps:
	npm install -g jshint

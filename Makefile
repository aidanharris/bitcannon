build:
	@echo "Building BitCannon..."
build-electron:
	@echo "Building BitCannon with Electron..."
	@echo "This is experimental, lots of things don't work properly."
	npm install -g electron-prebuilt;
	electron-packager . BitCannon --platform=all --arch=all --version=0.36.2 --out ./build/ --overwrite --ignore=build --ignore=Makefile
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

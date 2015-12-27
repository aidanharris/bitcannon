build:
	@echo "Building BitCannon..."
clean:
	@rm -rf src/bitcannon/node_modules
	@rm -rf src/server/node_modules
	@rm -rf src/server/public/bower_components
	@rm -rf src/providers/database/node_modules
	@rm -rf src/providers/rss/node_modules
deps:
	@cd src/bitcannon; \
	npm install
	@cd src/server; \
	npm install; \
	bower install
	@cd src/providers/database/mongodb; \
	npm install
	@cd src/providers/rss; \
	npm install
eslint-deps:
	npm install -g eslint
	npm install -g eslint-config-airbnb
	npm install -g eslint-plugin-react
JS_FILES = index.js
COMPONENT = ./node_modules/.bin/component
UGLIFY = ./node_modules/.bin/uglifyjs
NAME = ng-hyper-cj
FILE = $(NAME).js
MIN = $(NAME).min.js

all: build

build: $(FILE) $(MIN)

$(FILE): $(JS_FILES)
	@$(COMPONENT) build --standalone $(NAME)
	@mv build/build.js $(FILE)

$(MIN): $(FILE)
	@$(UGLIFY) --compress --mangle -o $@ $<

components: component.json
	@$(COMPONENT) install

clean:
	rm -fr build components

.PHONY: clean

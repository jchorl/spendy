UID=$(shell id -u)
GID=$(shell id -g)

serve:
	docker run -it --rm \
		-v "$(PWD)":/spendy \
		-w /spendy \
		-p 8080:8080 \
		-p 8000:8000 \
		jchorl/appengine-python:latest \
		sh -c "pip install -r requirements.txt && python main.py"

client-serve:
	docker run -it --rm \
		-v "$(PWD)"/client:/usr/src/app \
		-w /usr/src/app \
		-u $(UID):$(GID) \
		--net=host \
		node:latest \
		npm run dev

caddy-serve:
	docker run -it --rm \
		-v "$(PWD)"/caddy/Caddyfile:/root/Caddyfile:ro \
		--net=host \
		jchorl/caddy:latest

export:
	docker run -it --rm \
		-v "$(PWD)"/client:/usr/src/app \
		-w /usr/src/app \
		-u $(UID):$(GID) \
		--net=host \
		node:latest \
		sh -c "npm run build && npm run export"

prettier:
	docker run -it --rm \
		-v "$(PWD)"/client:/usr/src/app \
		-w /usr/src/app \
		-u $(UID):$(GID) \
		node:latest \
		sh -c "node node_modules/prettier/bin-prettier.js --write pages/*.js components/**/*.{js,scss} actions/**/*.js reducers/**/*.js lib/**/*.js pagestyles/*.scss"

node:
	docker run -it --rm \
		-v "$(PWD)":/usr/src/app \
		-w /usr/src/app \
		node:latest \
		bash

deploy:
	docker run -it --rm \
		-v $(PWD):/spendy \
		-w /spendy \
		jchorl/appengine-python:latest \
		sh -c "echo \"gcloud auth login\ngcloud config set project spendy-238218\ngcloud app deploy\" && \
		bash"

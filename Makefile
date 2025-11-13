.PHONY: docker-build docker-push release

DOCKER_REGISTRY ?= us-west1-docker.pkg.dev/ornate-time-270711/docker
DOCKER_IMAGE_NAME ?= slot-machine-game
COMMIT_SHA := $(shell git rev-parse HEAD)
NAMESPACE ?= ebisu-games-stg
CONTEXT ?= gke_ornate-time-270711_asia-east1_w2e-dev

docker-build:
	docker build --platform linux/amd64 -t $(DOCKER_IMAGE_NAME):latest .
	docker tag $(DOCKER_IMAGE_NAME):latest $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):latest
	docker tag $(DOCKER_IMAGE_NAME):latest $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):$(COMMIT_SHA)

docker-push: docker-build
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):latest
	docker push $(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):$(COMMIT_SHA)

release: docker-push
	kubectl config use-context $(CONTEXT)
	kubectl set image deployment/slot-machine-game slot-machine-game=$(DOCKER_REGISTRY)/$(DOCKER_IMAGE_NAME):$(COMMIT_SHA) -n $(NAMESPACE)

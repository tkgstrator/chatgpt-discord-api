include .env

PHONY: lint
lint:
	act -j commitlint -P ubuntu-24.04=catthehacker/ubuntu:act-22.04

PHONY: check
check:
	act -j check -P ubuntu-24.04=catthehacker/ubuntu:act-22.04

PHONY: deploy
deploy:
	act -j deploy -P ubuntu-24.04=catthehacker/ubuntu:act-22.04 -s CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN} -s CLOUDDFLARE_ACCOUNT_ID=${CLOUDDFLARE_ACCOUNT_ID} --eventpath .github/pull_request.closed.develop.json

ARG BUN_VERSION

FROM oven/bun:${BUN_VERSION}

RUN \
  --mount=type=cache,target=/var/lib/apt,sharing=locked \
  --mount=type=cache,target=/var/cache/apt,sharing=locked \
  apt-get install -y build-essential make

USER bun
WORKDIR /home/bun/app
CMD ["/bin/bash"]

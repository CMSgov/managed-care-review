#!/bin/bash

set -e

install_deps() {
  if [ "$CI" == "true" ]; then # If we're in a CI system
    if [ ! -d "node_modules" ]; then # If we don't have any node_modules (CircleCI cache miss scenario), run yarn install --frozen-lockfile.  Otherwise, we're all set, do nothing.
      yarn install --frozen-lockfile
    fi
  else # We're not in a CI system, let's yarn install
    # Locally, set the APPLICATION_ENDPOINT to where `yarn start` runs
    # TODO: if this were run by dev we would get .env
    export APPLICATION_ENDPOINT=http://localhost:3000
    yarn install
  fi
}

pushd nightwatch
install_deps
PATH=$(pwd)/node_modules/.bin/:$PATH nightwatch --env chrome --headless
popd

#!/usr/bin/env bash
set -u

function_name="$1"
lambda_version="${2:-\$LATEST}"

cli_read_timeout=240

if (set -x ; aws lambda invoke --qualifier "$lambda_version" --cli-read-timeout "$cli_read_timeout" --function "$function_name" lambda_response.json) ; then
  exitCode="$(jq '.StatusCode' < lambda_response.json)"
  if [[ "$exitCode" != 200 ]] ; then
    jq '.ErrorMessage' < lambda_response.json
    echo "Migration of the database failed." 1>&2
    exit 1
  fi
else
  exit
fi
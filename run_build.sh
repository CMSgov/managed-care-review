#! /bin/bash
echo stage name
echo $(pwd)
echo "$REACT_APP_STAGE_NAME"
if [ "$REACT_APP_STAGE_NAME" == "prod" ] || [ "$REACT_APP_STAGE_NAME" == "val" ];
    then
        echo "building for prod or val without instrumentation"
        lerna run build:prod --scope=app-web
    else
        echo "instrumenting for cypress"
        lerna run build:instrumented --scope=app-web
fi


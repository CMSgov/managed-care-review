#!/bin/bash
function preparePrismaLayer() {
    echo pwd
    echo "Cleaning up workspace ..."
    rm -rf lambda-layers-prisma-client

    echo "Creating layer ..."
    mkdir -p lambda-layers-prisma-client/nodejs/node_modules/.prisma
    mkdir -p lambda-layers-prisma-client/nodejs/node_modules/@prisma
    mkdir -p lambda-layers-prisma-client/nodejs/node_modules/prisma

    echo "Prepare Prisma Client lambda layer ..."
    rsync -av node_modules/.prisma/ lambda-layers-prisma-client/nodejs/node_modules/.prisma
    rsync -av node_modules/@prisma/ lambda-layers-prisma-client/nodejs/node_modules/@prisma
    rsync -av node_modules/prisma/ lambda-layers-prisma-client/nodejs/node_modules/prisma

    echo "Remove Prisma CLI..."
    rm -rf lambda-layers-prisma-client/nodejs/node_modules/@prisma/cli

    echo "Compressing ..."
    pushd lambda-layers-prisma-client && tar -zcf /tmp/nodejs.tar.gz . && mv /tmp/nodejs.tar.gz ./nodejs.tar.gz

    echo "Remove unzipped files ..."
    rm -rf nodejs

    echo "Stats:"
    ls -lh nodejs.tar.gz

    popd || exit
}
preparePrismaLayer
import { APIGatewayProxyHandler } from 'aws-lambda'

// This endpoint exists to confirm that authentication is working
export const main: APIGatewayProxyHandler = async (event, context) => {

    // says hi
    const hello = {
        'hello': 'there',
    }

    console.log({"name": "hello",   // eslint-disable-line no-console
                    "everythin": event,
                })

    console.log({"name": "No", "everything else": context}) // eslint-disable-line no-console

    return {
        statusCode: 200,
        body: JSON.stringify(hello) + '\n',
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Credentials": true,
        },
    };

}
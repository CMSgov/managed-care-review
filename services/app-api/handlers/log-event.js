export async function main(event, context) {
	console.log(event.body);

	return {
      statusCode: 200,
      body: '',
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
    };
}
export default async (request) => {
    const { pathname } = new URL(request.url);

    if (pathname === '/clear-cookie') {
        return new Response('Cookie cleared', {
            headers: {
                'Set-Cookie': 'sessionid=; HttpOnly; Secure; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
            }
        });
    }

    return new Response('Not Found', { status: 404 });
};
export default async (request) => {
    const { pathname } = new URL(request.url);

    if (pathname === '/set-cookie') {
        const url = new URL(request.url);
        const email = url.searchParams.get('email');
        const sessionId = url.searchParams.get('sessionId');

        if (!email || !sessionId) {
            return new Response('Missing parameters', { status: 400 });
        }

        return new Response('Cookie is set', {
            headers: {
                'Set-Cookie': `sessionid=${sessionId}; HttpOnly; Secure; Path=/; SameSite=Strict`
            }
        });
    }

    return new Response('Not Found', { status: 404 });
};
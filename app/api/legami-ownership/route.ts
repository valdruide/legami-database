import { isValidProductId, setProductOwnership } from '@/lib/legami-ownership';

type OwnershipRequest = {
    productId?: unknown;
    owned?: unknown;
};

export async function PATCH(request: Request) {
    let body: OwnershipRequest;

    try {
        body = (await request.json()) as OwnershipRequest;
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof body.productId !== 'string' || !isValidProductId(body.productId)) {
        return Response.json({ error: 'Unknown Legami product' }, { status: 400 });
    }

    if (typeof body.owned !== 'boolean') {
        return Response.json({ error: 'The owned value must be a boolean' }, { status: 400 });
    }

    try {
        await setProductOwnership(body.productId, body.owned);
        return Response.json({ productId: body.productId, owned: body.owned });
    } catch {
        return Response.json({ error: 'Unable to update Legami ownership' }, { status: 500 });
    }
}

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import legamiData from '@/data/legami_stylos_effacables.json';

type OwnershipData = {
    ownedProductIds: string[];
};

const ownershipFilePath = path.join(process.cwd(), 'data', 'legami_owned.json');
const validProductIds = new Set(legamiData.products.map((product) => product.id));

let writeQueue: Promise<void> = Promise.resolve();

export function isValidProductId(productId: string) {
    return validProductIds.has(productId);
}

export async function readOwnershipData(): Promise<OwnershipData> {
    const fileContent = await readFile(ownershipFilePath, 'utf8');
    const data: unknown = JSON.parse(fileContent);

    if (
        typeof data !== 'object' ||
        data === null ||
        !('ownedProductIds' in data) ||
        !Array.isArray(data.ownedProductIds)
    ) {
        throw new Error('Invalid Legami ownership data');
    }

    const ownedProductIds = data.ownedProductIds.filter(
        (productId): productId is string => typeof productId === 'string' && isValidProductId(productId),
    );

    return { ownedProductIds: [...new Set(ownedProductIds)] };
}

export function setProductOwnership(productId: string, owned: boolean): Promise<OwnershipData> {
    const update = writeQueue.then(async () => {
        const data = await readOwnershipData();
        const ownedProductIds = new Set(data.ownedProductIds);

        if (owned) {
            ownedProductIds.add(productId);
        } else {
            ownedProductIds.delete(productId);
        }

        const nextData = { ownedProductIds: [...ownedProductIds].sort() };
        await writeFile(ownershipFilePath, `${JSON.stringify(nextData, null, 2)}\n`, 'utf8');

        return nextData;
    });

    writeQueue = update.then(
        () => undefined,
        () => undefined,
    );

    return update;
}

import { connection } from 'next/server';
import legamiData from '@/data/legami_stylos_effacables.json';
import { LegamiProducts } from '@/components/legami-products';
import { readOwnershipData } from '@/lib/legami-ownership';

async function getProductsWithLocalImages() {
    return Promise.all(
        legamiData.products.map(async (product) => {
            const imageFilename = product.image.split('/').at(-1);

            if (!imageFilename) {
                throw new Error(`Missing local image path for ${product.id}`);
            }

            const { default: image } = await import(`@/src/img/pens/${imageFilename}`);

            return { ...product, image };
        }),
    );
}

export default async function Home() {
    await connection();

    const [products, ownershipData] = await Promise.all([getProductsWithLocalImages(), readOwnershipData()]);

    return (
        <main className="min-h-screen bg-zinc-50 px-4 py-8 font-sans text-foreground sm:px-6 lg:px-8 dark:bg-black">
            <div className="mx-auto flex max-w-7xl flex-col gap-8">
                <header className="space-y-4">
                    <div className="space-y-2">
                        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Base Legami</p>
                        <h1 className="font-heading text-3xl font-semibold sm:text-4xl">Stylos effacables Legami</h1>
                    </div>
                </header>

                <LegamiProducts products={products} initialOwnedProductIds={ownershipData.ownedProductIds} />
            </div>
        </main>
    );
}

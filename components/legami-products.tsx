'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LegamiCard, type LegamiProduct } from '@/components/legami-card';

type OwnershipFilter = 'all' | 'owned' | 'missing';
type ProductSort = 'year-desc' | 'year-asc' | 'owned-first' | 'missing-first' | 'price-asc' | 'price-desc';

type LegamiProductsProps = {
    products: LegamiProduct[];
    initialOwnedProductIds: string[];
};

const filterLabels: Record<OwnershipFilter, string> = {
    all: 'Tous',
    owned: 'Possédés',
    missing: 'Manquants',
};

const sortLabels: Record<ProductSort, ReactNode> = {
    'year-desc': <>Année de sortie <ArrowDown className="size-4" aria-hidden="true" /><span className="sr-only">décroissante</span></>,
    'year-asc': <>Année de sortie <ArrowUp className="size-4" aria-hidden="true" /><span className="sr-only">croissante</span></>,
    'owned-first': 'Possédés en premier',
    'missing-first': 'Manquants en premier',
    'price-asc': 'Prix croissant',
    'price-desc': 'Prix décroissant',
};

export function LegamiProducts({ products, initialOwnedProductIds }: LegamiProductsProps) {
    const [filter, setFilter] = useState<OwnershipFilter>('all');
    const [sort, setSort] = useState<ProductSort>('year-desc');
    const [ownedProductIds, setOwnedProductIds] = useState(() => new Set(initialOwnedProductIds));
    const [pendingProductIds, setPendingProductIds] = useState(() => new Set<string>());
    const [saveError, setSaveError] = useState<string | null>(null);

    async function toggleOwnership(productId: string) {
        if (pendingProductIds.has(productId)) {
            return;
        }

        const wasOwned = ownedProductIds.has(productId);
        const owned = !wasOwned;

        setSaveError(null);
        setOwnedProductIds((currentIds) => {
            const nextIds = new Set(currentIds);

            if (owned) {
                nextIds.add(productId);
            } else {
                nextIds.delete(productId);
            }

            return nextIds;
        });
        setPendingProductIds((currentIds) => new Set(currentIds).add(productId));

        try {
            const response = await fetch('/api/legami-ownership', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, owned }),
            });

            if (!response.ok) {
                throw new Error('Ownership update failed');
            }
        } catch {
            setOwnedProductIds((currentIds) => {
                const nextIds = new Set(currentIds);

                if (wasOwned) {
                    nextIds.add(productId);
                } else {
                    nextIds.delete(productId);
                }

                return nextIds;
            });
            setSaveError("La modification n'a pas pu être enregistrée.");
        } finally {
            setPendingProductIds((currentIds) => {
                const nextIds = new Set(currentIds);
                nextIds.delete(productId);
                return nextIds;
            });
        }
    }

    const visibleProducts = useMemo(() => {
        const filteredProducts = products.filter((product) => {
            const owned = ownedProductIds.has(product.id);

            if (filter === 'owned') {
                return owned;
            }

            if (filter === 'missing') {
                return !owned;
            }

            return true;
        });

        return filteredProducts.sort((firstProduct, secondProduct) => {
            if (sort === 'year-desc') {
                return secondProduct.year - firstProduct.year;
            }

            if (sort === 'year-asc') {
                return firstProduct.year - secondProduct.year;
            }

            if (sort === 'price-asc') {
                return firstProduct.price - secondProduct.price;
            }

            if (sort === 'price-desc') {
                return secondProduct.price - firstProduct.price;
            }

            if (sort === 'owned-first' || sort === 'missing-first') {
                const firstOwned = Number(ownedProductIds.has(firstProduct.id));
                const secondOwned = Number(ownedProductIds.has(secondProduct.id));
                const ownershipDifference = secondOwned - firstOwned;

                return sort === 'owned-first' ? ownershipDifference : -ownershipDifference;
            }

            return 0;
        });
    }, [filter, ownedProductIds, products, sort]);

    const ownedCount = products.filter((product) => ownedProductIds.has(product.id)).length;

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-4 border-y bg-background/80 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{products.length} références</Badge>
                    <Badge variant="default">{ownedCount} possédés</Badge>
                    <Badge variant="outline">{products.length - ownedCount} manquants</Badge>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                    <Select value={filter} onValueChange={(value) => setFilter(value as OwnershipFilter)}>
                        <SelectTrigger className="w-full sm:w-48" aria-label="Filtrer par possession">
                            <SelectValue>{filterLabels[filter]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les produits</SelectItem>
                            <SelectItem value="owned">Possédés</SelectItem>
                            <SelectItem value="missing">Manquants</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sort} onValueChange={(value) => setSort(value as ProductSort)}>
                        <SelectTrigger className="w-full sm:w-48" aria-label="Trier les produits">
                            <SelectValue>{sortLabels[sort]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="year-desc">{sortLabels['year-desc']}</SelectItem>
                            <SelectItem value="year-asc">{sortLabels['year-asc']}</SelectItem>
                            <SelectItem value="owned-first">Possédés en premier</SelectItem>
                            <SelectItem value="missing-first">Manquants en premier</SelectItem>
                            <SelectItem value="price-asc">Prix croissant</SelectItem>
                            <SelectItem value="price-desc">Prix décroissant</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {visibleProducts.map((product) => (
                    <LegamiCard
                        key={product.id}
                        product={product}
                        owned={ownedProductIds.has(product.id)}
                        updating={pendingProductIds.has(product.id)}
                        onOwnershipToggle={() => toggleOwnership(product.id)}
                    />
                ))}
            </div>

            {saveError && (
                <p role="alert" className="text-sm font-medium text-destructive">
                    {saveError}
                </p>
            )}
        </section>
    );
}

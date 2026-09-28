import Image, { type StaticImageData } from 'next/image';
import Link from 'next/link';
import { ExternalLinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import styles from './legami-card.module.css';

export type LegamiProduct = {
    id: string;
    name: string;
    price: number;
    image: StaticImageData;
    url: string;
    limited_edition: boolean;
};

type LegamiCardProps = {
    product: LegamiProduct;
    owned: boolean;
    updating: boolean;
    onOwnershipToggle: () => void;
};

const priceFormatter = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function LegamiCard({ product, owned, updating, onOwnershipToggle }: LegamiCardProps) {
    function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
        if (
            event.pointerType !== 'mouse' ||
            updating ||
            !window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches
        ) {
            return;
        }

        const bounds = event.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
        const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));

        event.currentTarget.style.setProperty('--rotate-x', `${(0.5 - y) * 24}deg`);
        event.currentTarget.style.setProperty('--rotate-y', `${(x - 0.5) * 24}deg`);
    }

    function resetTilt(event: React.PointerEvent<HTMLDivElement>) {
        event.currentTarget.style.removeProperty('--rotate-x');
        event.currentTarget.style.removeProperty('--rotate-y');
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOwnershipToggle();
        }
    }

    return (
        <div className={styles.tiltArea} onPointerMove={handlePointerMove} onPointerLeave={resetTilt} onPointerCancel={resetTilt}>
            <Card
                role="button"
                tabIndex={updating ? -1 : 0}
                aria-pressed={owned}
                aria-busy={updating}
                aria-label={`${owned ? 'Retirer' : 'Ajouter'} ${product.name} de ma collection`}
                onClick={onOwnershipToggle}
                onKeyDown={handleKeyDown}
                className={cn(
                    'overflow-visible hover:shadow-2xl shadow-xl relative h-full cursor-pointer gap-4 pt-0 transition-all duration-200 focus-visible:outline-none',
                    styles.tiltCard,
                    owned && 'border-2 border-primary/50',
                    product.limited_edition === true && styles.shiny,
                    updating && 'pointer-events-none opacity-70',
                )}
            >
                {product.limited_edition === true && (
                    <div className="py-0.5 absolute -top-3 left-1/2 z-20 bg-amber-500 text-center font-semibold text-white w-1/2 -translate-x-1/2">
                        <div className="relative">
                            <div
                                className="absolute w-4 h-full -left-4 top-1"
                                style={{
                                    clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 50% 50%);',
                                    border: '11px solid #FE9A00',
                                    borderRight: '11px solid #FE9A00',
                                    borderBottomColor: '#FE9A00',
                                    borderLeftColor: 'transparent',
                                }}
                            ></div>
                            Édition limitée
                            <div
                                className="absolute w-4 h-full -right-4 top-1"
                                style={{
                                    clipPath: 'polygon(100% 100%, 0% 100%, 0% 0%, 100% 0%, 50% 50%)',
                                    border: '11px solid #FE9A00',
                                    borderLeft: '11px solid #FE9A00',
                                    borderBottomColor: '#FE9A00',
                                    borderRightColor: 'transparent',
                                }}
                            ></div>
                        </div>
                    </div>
                )}
                <div className="relative aspect-square overflow-hidden">
                    {owned && (
                        <div className="absolute top-5 -right-12 z-10 bg-primary text-center text-primary-foreground w-1/2 rotate-45">
                            {owned ? 'Possédé' : 'Manquant'}
                        </div>
                    )}

                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                        className="object-contain rounded-t-xl"
                    />
                </div>
                <CardHeader className="gap-3">
                    <CardTitle className="line-clamp-3 font-bold leading-5 flex items-start gap-2">
                        {product.name}{' '}
                        <Link
                            href={product.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                        >
                            <ExternalLinkIcon className="size-4" aria-hidden="true" />
                        </Link>
                    </CardTitle>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 text-sm">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                        <dt className="text-muted-foreground">Ref</dt>
                        <dd className="font-medium">{product.id}</dd>
                        <dt className="text-muted-foreground">Prix</dt>
                        <dd className="font-medium">{priceFormatter.format(product.price)} €</dd>
                    </dl>
                </CardContent>
            </Card>
        </div>
    );
}

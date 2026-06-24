export default function PriceDisplay({ price, originalPrice }) {
  const formattedPrice = price != null
    ? `${Number(price).toFixed(2)} SAR`
    : null;

  const formattedOriginal = originalPrice != null
    ? `${Number(originalPrice).toFixed(2)} SAR`
    : null;

  const hasDiscount = formattedOriginal && Number(originalPrice) > Number(price);

  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {hasDiscount && (
        <span className="text-sm text-gray-400 line-through decoration-gray-300">
          {formattedOriginal}
        </span>
      )}
      {formattedPrice && (
        <span className={`font-bold ${hasDiscount ? 'text-lg text-danger' : 'text-lg text-gray-800 dark:text-gray-100'}`}>
          {formattedPrice}
        </span>
      )}
      {hasDiscount && (
        <span className="text-[10px] font-semibold text-white bg-danger px-1.5 py-0.5 rounded">
          -{Math.round((1 - Number(price) / Number(originalPrice)) * 100)}%
        </span>
      )}
    </div>
  );
}

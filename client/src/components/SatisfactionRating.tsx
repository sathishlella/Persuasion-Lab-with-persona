import { useState } from "react";

interface SatisfactionRatingProps {
  onSubmit: (rating: number) => void;
  onSkip: () => void;
}

export function SatisfactionRating({ onSubmit, onSkip }: SatisfactionRatingProps) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  const handleSubmit = () => {
    if (selected > 0) onSubmit(selected);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-center">
        <p className="text-white/80 text-sm font-medium">How was your experience?</p>
        <p className="text-white/40 text-xs mt-0.5">Rate this AI sales conversation</p>
      </div>

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            className="text-3xl transition-all duration-150 hover:scale-125"
          >
            <span className={star <= (hovered || selected) ? "text-amber-400" : "text-white/20"}>
              ★
            </span>
          </button>
        ))}
      </div>

      {(hovered || selected) > 0 && (
        <p className="text-amber-400 text-sm font-medium">
          {labels[hovered || selected]}
        </p>
      )}

      <div className="flex gap-2 mt-1">
        <button
          onClick={onSkip}
          className="px-4 py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSubmit}
          disabled={selected === 0}
          className="px-5 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Submit Rating
        </button>
      </div>
    </div>
  );
}

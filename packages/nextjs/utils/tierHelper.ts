export const resolveTier = (tierIndex: number | string): string => {
  const t = Number(tierIndex);
  if (t === 0) return "immortal";
  if (t === 1) return "elite";
  return "founders"; // Default 2
};

export const getTierColorStyle = (tier: string) => {
  if (tier === "immortal")
    return { bg: "linear-gradient(135deg, #0a0a0a 0%, #1c1c1c 100%)", border: "#FCD535", color: "#FCD535" };
  if (tier === "elite")
    return { bg: "linear-gradient(135deg, #2b0505 0%, #4a0a0a 100%)", border: "#ff3232", color: "#ff3232" };
  return { bg: "linear-gradient(135deg, #001f24 0%, #003840 100%)", border: "#008080", color: "#4db6ac" };
};

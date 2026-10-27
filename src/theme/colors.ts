// Software Mansion palette, from the swmansion docs theme.
export const colors = {
  navy: "#001A72",
  navy80: "#33488E",
  navy60: "#6676AA",
  navy40: "#99A3C7",
  navy20: "#CCD1E3",
  purple: "#782AEB",
  red: "#FF6259",
  yellow: "#FFD61E",
  green: "#57B495",
  blue: "#38ACDD",
  white: "#FFFFFF",
  surface: "#F4F5FA",
  // Behind every list and nowhere inside a row, so a screen recording can count unrendered area
  // by this colour alone. Pure magenta because no row colour, photo or anti-aliased edge of navy
  // on white comes near it. Rows must stay opaque.
  blank: "#FF00FF",
} as const;

// DailyDose+ Typography
// Mirrors font sizes and weights from the HTML prototype

export const fonts = {
  regular:  'DMSans_400Regular',
  medium:   'DMSans_500Medium',
  bold:     'DMSans_700Bold',
};

export const fontSizes = {
  xs:   9,
  sm:   10,
  base: 12,
  md:   13,
  lg:   15,
  xl:   17,
  xxl:  20,
  hero: 28,
};

export const typography = {
  // Labels & caps
  label: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  // Body text
  body: {
    fontFamily: fonts.regular,
    fontSize: fontSizes.base,
    lineHeight: 18,
  },
  // Med name
  medName: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
  },
  // Section heading
  sectionHead: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  // Card big number
  bigNumber: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.hero,
    lineHeight: 32,
  },
  // Button text
  button: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.base,
    letterSpacing: 0.3,
  },
  // Screen title
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSizes.xxl,
    lineHeight: 26,
  },
};

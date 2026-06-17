// Panda runs first so its @layer directives are expanded, then Tailwind
// processes its own @tailwind directives. Both emit into the same stylesheet
// but live in distinct cascade layers, so they coexist without collision.
export default {
  plugins: {
    "@pandacss/dev/postcss": {},
    tailwindcss: {},
    autoprefixer: {},
  },
};

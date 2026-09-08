// Top-level route segments that a page's catch-all `/[slug]` must never
// shadow. Keep in sync with actual top-level folders under src/app.
export const RESERVED_SLUGS = [
  "admin",
  "blog",
  "shop",
  "cart",
  "checkout",
  "login",
  "register",
  "account",
  "search",
  "api",
];

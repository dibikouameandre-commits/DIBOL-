import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: string;
  categorySlug: string;
  quantity: number;
  // undefined = the shared/global storefront's cart, unchanged from before
  // company-scoping existed. Set only for an item added from a company's
  // own storefront (`/[entreprise]/...`).
  companySlug?: string;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          // A cart can only ever hold items from one storefront context at
          // a time (undefined counts as its own context, the shared/global
          // storefront) — adding from a different one starts a fresh cart
          // instead of silently mixing two companies' products together.
          const currentContext = state.items[0]?.companySlug;
          const items =
            state.items.length > 0 && currentContext !== item.companySlug
              ? []
              : state.items;

          const existing = items.find((i) => i.productId === item.productId);

          if (existing) {
            return {
              items: items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }

          return { items: [...items, { ...item, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId ? { ...i, quantity } : i
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "dibol-ai-cart" }
  )
);

export function cartTotal(items: CartItem[]) {
  return items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
}

export function cartCount(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

import { describe, expect, it } from "vitest";
import { normalizeShoppingListItemName } from "./shoppingListBuilder.js";

describe("normalizeShoppingListItemName", () => {
  it("removes plating descriptors while preserving useful specificity", () => {
    expect(normalizeShoppingListItemName("warm tortillas")).toBe("tortillas");
    expect(normalizeShoppingListItemName("corn tortillas")).toBe("corn tortillas");
    expect(normalizeShoppingListItemName("plain chicken pieces")).toBe("chicken");
    expect(normalizeShoppingListItemName("raw cucumber sticks")).toBe("cucumber");
    expect(normalizeShoppingListItemName("sumac onions")).toBe("sumac onions");
  });
});

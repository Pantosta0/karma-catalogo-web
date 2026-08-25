import {
  Beef,
  Beer,
  CakeSlice,
  Candy,
  Carrot,
  ChefHat,
  Citrus,
  Cookie,
  Croissant,
  CupSoda,
  Drumstick,
  Egg,
  Fish,
  Flame,
  Gift,
  Grape,
  IceCream2,
  Leaf,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Star,
  UtensilsCrossed,
  Wheat,
  Wine,
  type LucideIcon,
} from "lucide-react";

/**
 * Iconos elegibles para una categoría.
 *
 * Lista curada a propósito, no `lucide-react/dynamic`. El import dinámico
 * resuelve cualquier nombre en tiempo de ejecución, pero para poder hacerlo se
 * lleva el paquete entero al bundle — más de mil iconos para pintar cuatro. Con
 * imports nombrados sólo viajan estos, y el resto lo descarta el tree-shaking.
 *
 * El nombre (`name`) es lo que se guarda en la columna `icono` de la tabla
 * `categorias`. La etiqueta es para el buscador del panel, no se muestra.
 */
export const CATEGORY_ICONS: { name: string; label: string; Icon: LucideIcon }[] = [
  { name: "UtensilsCrossed", label: "general cubiertos plato", Icon: UtensilsCrossed },
  { name: "Beef", label: "hamburguesa carne res", Icon: Beef },
  { name: "Sandwich", label: "sandwich emparedado", Icon: Sandwich },
  { name: "Pizza", label: "pizza", Icon: Pizza },
  { name: "Drumstick", label: "pollo alitas", Icon: Drumstick },
  { name: "Flame", label: "asados parrilla brasa picante", Icon: Flame },
  { name: "Fish", label: "pescado mariscos", Icon: Fish },
  { name: "Soup", label: "sopa caldo sancocho", Icon: Soup },
  { name: "Salad", label: "ensalada saludable", Icon: Salad },
  { name: "Carrot", label: "vegetariano verduras", Icon: Carrot },
  { name: "Leaf", label: "vegano natural", Icon: Leaf },
  { name: "Egg", label: "huevo desayuno", Icon: Egg },
  { name: "Croissant", label: "panaderia desayuno", Icon: Croissant },
  { name: "Wheat", label: "arepas pan trigo", Icon: Wheat },
  { name: "ChefHat", label: "especialidad de la casa", Icon: ChefHat },
  { name: "CupSoda", label: "bebidas gaseosa jugo", Icon: CupSoda },
  { name: "Milk", label: "malteada leche batido", Icon: Milk },
  { name: "Citrus", label: "limonada jugos citricos", Icon: Citrus },
  { name: "Grape", label: "jugos frutas", Icon: Grape },
  { name: "Beer", label: "cerveza michelada", Icon: Beer },
  { name: "Wine", label: "vino coctel", Icon: Wine },
  { name: "IceCream2", label: "helado postre frio", Icon: IceCream2 },
  { name: "CakeSlice", label: "postres torta", Icon: CakeSlice },
  { name: "Cookie", label: "galletas dulces", Icon: Cookie },
  { name: "Candy", label: "dulces mecato", Icon: Candy },
  { name: "Gift", label: "combos promociones", Icon: Gift },
  { name: "Star", label: "destacados favoritos", Icon: Star },
];

const BY_NAME = new Map(CATEGORY_ICONS.map((i) => [i.name, i.Icon]));

/** Icono de una categoría. Cae en cubiertos si está vacío o si el nombre
 *  guardado ya no existe en la lista — así recortar la lista curada nunca deja
 *  una categoría sin pintar. */
export function getCategoryIcon(name: string | undefined): LucideIcon {
  return (name && BY_NAME.get(name)) || UtensilsCrossed;
}

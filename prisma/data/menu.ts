/**
 * Menu imported from the live ordering site (order.cocotamarindhp27.co.uk) on 10 Nov 2026.
 * Format per line: name | description | allergen text as published | spice label | V if vegetarian | price | X if unavailable
 * Spelling of descriptions corrected (e.g. "yougurt" → "yogurt"); names, prices and allergen text unchanged.
 * Allergen data is imported as UNVERIFIED — it must be confirmed by the kitchen before it is shown as definitive.
 */
export const MENU_SOURCE = "order.cocotamarindhp27.co.uk (imported 2026-11-10)";

export const CATEGORIES: { slug: string; name: string; description?: string; lines: string; visible?: boolean }[] = [
  {
    slug: "starters",
    name: "Starters",
    lines: `
Onion Bhaji|Deep fried shredded onion mixed with egg and gram flour.|Wheat & Egg|MEDIUM|V|5.45
Vegetable Samosa|Mixed vegetables stuffed in thin triangles of pastry.|Egg & Wheat|MEDIUM|V|5.45
Chicken Pakora|Chicken strips dipped in batter and deep fried.|Dairy, Wheat & Egg|MEDIUM||5.45
Mitha Murgh|Sliced chicken, cooked in a flavoured mango sauce.|Dairy|||5.75
Lamb Samosa|Minced lamb stuffed in thin triangles of pastry.|Egg & Wheat|MEDIUM||5.45
Royal Kabab|Minced lamb blended with chilli, garlic, ginger and coriander.|Egg, Soybean|FAIRLY HOT||5.50
Prawn Puri|In a medium sweet & sour sauce served in puri bread.|Shellfish & Wheat|HOT||5.95
King Prawn Puri|In a medium sweet & sour sauce served in puri bread.|Shellfish & Wheat|HOT||8.95
King Prawn Butterfly|Deep fried jumbo prawn in breadcrumbs.|Dairy, Shellfish & Wheat|MEDIUM||7.50
Tamarind Platter for 2|A variety of starters chosen by our chef.|Dairy, Egg & Wheat|||11.50`,
  },
  {
    slug: "tandoori-starters",
    name: "Tandoori Starters",
    lines: `
Chicken Tikka Starter|Chicken marinated in yogurt, herbs & spices, grilled in the tandoori oven.|Dairy & Mustard|MEDIUM||5.45
Lamb Tikka Starter|Marinated in yogurt, herbs & spices, grilled in the tandoori oven.|Dairy & Mustard|MEDIUM||5.45
Sheek Kabab Starter|Minced lamb, onions, herbs & spices, grilled over charcoal or pan fried.|Egg|MEDIUM||5.45
Shami Kabab Starter|Minced lamb, onions, herbs & spices, grilled over charcoal or pan fried.|Egg|MEDIUM||5.45
Lamb Chops Starter|Lamb chops marinated in herbs and spices, grilled in the tandoori oven.|Dairy|MEDIUM||8.50
Hash Tikka Starter|Cubed duck marinated in yogurt, herbs & spices, grilled in the tandoori oven.|Dairy & Mustard|MEDIUM||5.95
Salmon Tikka Starter|Cubes of salmon marinated with ginger, garlic, herbs and spices, cooked in the clay oven.|Dairy, Fish & Mustard|||7.50
Tandoori Monk Fish Starter|Marinated in herbs and spices, roasted in the charcoal tandoori oven.|Dairy, Fish & Mustard|HOT||7.95
Murgh Malai Tikka|Skewered chicken flavoured with garlic, nutmeg, cashew nuts and honey.|Dairy & Wheat|||5.45
Shahi King Prawn|King prawn spiced and charcoal grilled with onion, tomato and capsicum.|Dairy, Shellfish & Wheat|MEDIUM||7.95
Mixed Starter (for 1)|A variety of starters chosen by our chef.|Dairy, Egg, Shellfish, Wheat & Mustard|||7.95
Tamarind Special (for 2)|Selection of tandoori starters chosen by our chef.|Dairy, Egg, Shellfish & Mustard|MEDIUM||11.95`,
  },
  {
    slug: "tandoori-specialities",
    name: "Tandoori Specialities",
    description: "Marinated chicken, lamb or prawn with a tantalising flavour. Served with green salad.",
    lines: `
Tandoori Chicken Half on the bone|Chicken marinated in spices, herbs & yogurt.|Dairy & Mustard|MEDIUM||10.95
Chicken Tikka|Marinated in yogurt, herbs & spices and grilled in the tandoor oven.|Dairy & Mustard|MEDIUM||11.45
Chicken Shashlik|Marinated with onion, green peppers and tomatoes, cooked in the clay oven.|Dairy & Mustard|MEDIUM||12.95
Lamb Tikka|Marinated in yogurt, herbs & spices, grilled in the tandoor.|Dairy & Mustard|MEDIUM||11.45
Lamb Shashlik|Marinated with onion, green peppers and tomatoes, cooked in the clay oven.|Dairy & Mustard|MEDIUM||12.95
Lamb Chops|Lamb chops marinated in herbs and spices, grilled in the tandoori oven.|Dairy & Mustard|MEDIUM||14.50
Hash Tikka|Cubed duck marinated in yogurt, herbs & spices, grilled in the tandoori oven.|Dairy & Mustard|MEDIUM||12.95
Salmon Fillet|Marinated in the chef's special sauce and cooked on the charcoal grill.|Dairy, Fish & Mustard|MEDIUM||13.95
Shahi Chingri|Jumbo king prawn grilled over charcoal with tomatoes, onion and green peppers.|Dairy, Shellfish & Mustard|MEDIUM||14.95
Tandoori Monk Fish|Marinated in herbs and spices, roasted in the charcoal tandoori oven.|Dairy, Shellfish & Mustard|MEDIUM||14.95
Tandoori Mixed Grill|Chicken tikka, lamb chop, king prawn, sheek kabab & tandoori chicken.|Dairy, Shellfish, Egg & Mustard|MEDIUM||14.95`,
  },
  {
    slug: "house-specials",
    name: "Tamarind House Specials",
    description: "Seasonal specialities by our head chef.",
    lines: `
Achari Chicken|An authentic tangy curry, flavoured with pickle, spices and tomatoes.|Dairy|HOT||12.45
Chicken Karahi|Chicken pieces with onions, tomatoes and capsicum, cooked in a karahi.||HOT||12.45
La Jawab|Whole breast of chicken stuffed with spicy minced chicken, roasted in the oven and served with dried chilli and onion.||FAIRLY HOT||12.45
Khazana Chicken|Chicken cooked with garlic, onion and green peppers. Spicy and creamy.|Dairy, Treenut, Wheat, Peanut & Mustard|HOT||12.45
Jeera Chilli Chicken|Cooked with grilled baby shallots, olive oil, coriander, green chillies and cumin seeds.|Dairy & Mustard|VERY HOT||12.45
Lime Tista Chicken|Cooked with fresh lime leaf, fruits & lime zest in a medium spiced sauce.|Dairy|MEDIUM||12.45
Shimla Murgh|Chicken cooked with minced lamb, almonds and fresh coriander with an exotic blend of herbs and spices.|Dairy, Wheat|MEDIUM||12.45
Kalinji Chicken|Pieces of chicken cooked with spring onions, green chillies, garlic, fresh herbs and hot spices.|Dairy|FAIRLY HOT||12.45
Kandani Murgh|Marinated chicken cooked in the clay oven, simmered with lamb mince and baby shallots, finished with coriander and a touch of garam masala.|Dairy & Mustard|MEDIUM||12.45
Mirchi Chicken|Very hot curry with green chilli paste, ginger and a compendium of spices in a thick sauce.|Dairy|VERY HOT||12.45
Murgh Silsila|Chicken cooked with yogurt and fenugreek in a creamy, flavoursome sauce. Mild.|Dairy|||12.45
Murgh Tawa|Boneless chicken marinated with herbs and spices, grilled in the oven, then cooked with medium spices & tomato.|Dairy, Mustard|HOT||12.45
Karahi Kebab Khyberi|Cubed chicken cooked with tomatoes and green peppers to the chef's own recipe, originating from the Khyber Pass.|Dairy, Mustard|HOT||12.45
Tamarind Special Chicken|Whole breast of chicken stuffed with spicy minced chicken, roasted in the oven and served with a thick spinach sauce.|Dairy & Treenut|MEDIUM||12.45
Dilruba Chicken|Cooked with spices, yogurt, crushed chillies and special herbs.|Dairy|FAIRLY HOT||12.45
Chicken Badami|Tikka cooked with almond, sultana, cream and peanut butter.|Dairy & Peanut|||12.45
Chicken Naga|Chicken cooked with onions, peppers and desi hot chilli pickle.||VERY HOT||12.45
Chicken Makhani|Chicken cooked in butter, yogurt, fresh cream and mild spices in an exotic sauce.|Dairy|||11.95
Xacuti Chicken|A classic, full-flavoured spicy curry with roasted star anise, coconut, cinnamon, javitri (mace) and fenugreek seeds.|Treenut|HOT||12.45
Tai Moo Ri Chicken|Tender chicken cooked to perfection — spicy but not too hot.|Dairy|HOT||12.45
Chicken Tikka Masala|Cooked in a tandoori masala sauce. Mild.|Dairy|||12.45
Butter Chicken|Tandoori chicken off the bone cooked with cream and butter.|Dairy & Peanut|||12.45
Pere Pere Chicken|Cooked with onion, pepper, tomatoes & special pere pere sauce.||VERY HOT||12.45
Lajaz Chicken|Tender pieces of chicken cooked with onion, green peppers, tomatoes and fresh green chillies in the chef's own special sauce and cream. A hot and spicy dish.|Dairy|VERY HOT||12.45
Balti Chicken|Tender pieces of chicken cooked with onions and tomatoes, flavoured with crushed garlic.|Treenut, Wheat, Peanut & Mustard|HOT||12.45
Chicken Jhalfrezi|Jhal means hot; this curry uses fresh green chillies as its base, together with garlic, ginger and onion.||FAIRLY HOT||12.45
Indian Garlic Chicken|Chicken tikka cooked in a south Indian style with garlic, pepper and onions.|Dairy|FAIRLY HOT||12.45
Sikondari Raan|Lamb shank slowly cooked with onions, green pepper, tomatoes, potato and minced meat in a thick spicy sauce.||||11.50|X
Lamb Karahi|Lamb pieces with onions, tomatoes and capsicum, cooked in a karahi.||HOT||12.45
Gost Kata Masallam|Roasted lamb cooked with the chef's own spices, coconut milk and garlic.|Treenut|MEDIUM||12.45
Khazana Lamb|Lamb cooked with garlic, onion and green peppers. Spicy and creamy.|Dairy, Treenut, Wheat, Peanut & Mustard|HOT||12.45
Jeera Chilli Lamb|Cooked with grilled baby shallots, olive oil, coriander, green chillies and cumin seeds.|Dairy & Mustard|VERY HOT||12.45
Lime Tista Lamb|Cooked with fresh lime leaf, fruits & lime zest in a medium spiced sauce.|Dairy|MEDIUM||12.45
Achari Lamb|An authentic tangy curry, flavoured with pickle, spices and tomatoes.|Dairy|HOT||12.45
Kalinji Lamb|Pieces of lamb cooked with spring onions, green chillies, garlic, fresh herbs and hot spices.|Dairy|FAIRLY HOT||12.45
Mirchi Lamb|Very hot curry with green chilli paste, ginger and a compendium of spices in a thick sauce.|Dairy|VERY HOT||12.45
Lamb Badami|Tikka cooked with almond, sultana, cream and peanut butter.|Dairy & Peanut|||12.45
Lamb Naga|Lamb cooked with onions, peppers and desi hot chilli pickle.||VERY HOT||12.45
Xacuti Lamb|A classic, full-flavoured spicy curry with roasted star anise, coconut, cinnamon, javitri (mace) and fenugreek seeds.|Treenut|HOT||12.45
Tai Moo Ri Lamb|Tender lamb cooked to perfection — spicy but not too hot.|Dairy|HOT||12.45
Lamb Tikka Masala|Cooked in a tandoori masala sauce. Mild.|Dairy|||12.45
Dilruba Lamb|Cooked with spices, yogurt, crushed chillies and special herbs.|Dairy|FAIRLY HOT||12.45
Pere Pere Lamb|Cooked with onion, pepper, tomatoes and our special pere pere sauce.||VERY HOT||12.45
Lajaz Lamb|Tender pieces of lamb cooked with onion, green peppers, tomatoes and fresh green chillies in the chef's own special sauce and cream. A hot and spicy dish.|Dairy|VERY HOT||12.45
Balti Lamb|Tender pieces of lamb cooked with onions and tomatoes, flavoured with crushed garlic.|Treenut, Wheat, Peanut & Mustard|HOT||12.45
Lamb Jhalfrezi|Jhal means hot; this curry uses fresh green chillies as its base, together with garlic, ginger and onion.||FAIRLY HOT||12.45`,
  },
  {
    slug: "chicken-traditional",
    name: "Chicken Traditional",
    lines: `
Chicken Curry|||MEDIUM||10.95
Chicken Dhansak|Sweet, sour and fairly hot with lentils.||HOT||10.95
Chicken Korma|Mild and creamy with coconut.|Dairy, Tree nut|||10.95
Chicken Madras|||FAIRLY HOT||10.95
Chicken Vindaloo|Very hot with potatoes.||VERY HOT||10.95
Chicken Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||10.95
Chicken Bhuna|Medium with tomatoes and onions.||MEDIUM||10.95
Chicken Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||10.95
Chicken Tikka Curry|||MEDIUM||11.50
Chicken Tikka Dhansak|Sweet, sour and fairly hot with lentils.||HOT||11.50
Chicken Tikka Korma|Mild and creamy with coconut.|Dairy, Tree nut|||11.50
Chicken Tikka Madras|||FAIRLY HOT||11.50
Chicken Tikka Vindaloo|Very hot with potatoes.||VERY HOT||11.50
Chicken Tikka Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||11.50
Chicken Tikka Bhuna|Medium with tomatoes and onions.||MEDIUM||11.50
Chicken Tikka Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||11.50`,
  },
  {
    slug: "lamb-traditional",
    name: "Lamb Traditional",
    lines: `
Lamb Curry|||MEDIUM||11.50
Lamb Dhansak|Sweet, sour and fairly hot with lentils.||HOT||11.50
Lamb Korma|Mild and creamy with coconut.|Dairy, Tree nut|||11.50
Lamb Madras|||FAIRLY HOT||11.50
Lamb Vindaloo|Very hot with potatoes.||VERY HOT||11.50
Lamb Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||11.50
Lamb Bhuna|Medium with tomatoes and onions.||MEDIUM||11.50
Lamb Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||11.50
Lamb Tikka Curry|||MEDIUM||11.95
Lamb Tikka Dhansak|Sweet, sour and fairly hot with lentils.||HOT||11.95
Lamb Tikka Korma|Mild and creamy with coconut.|Dairy, Tree nut|||11.95
Lamb Tikka Madras|||FAIRLY HOT||11.95
Lamb Tikka Vindaloo|Very hot with potatoes.||VERY HOT||11.95
Lamb Tikka Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||11.95
Lamb Tikka Bhuna|Medium with tomatoes and onions.||MEDIUM||11.95
Lamb Tikka Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||11.95`,
  },
  {
    slug: "duck-traditional",
    name: "Duck Traditional",
    lines: `
Duck Curry|||MEDIUM||12.50
Duck Dhansak|Sweet, sour and fairly hot with lentils.||HOT||12.50
Duck Korma|Mild and creamy with coconut.|Dairy, Tree nut|||12.50
Duck Madras|||FAIRLY HOT||12.50
Duck Vindaloo|Very hot with potatoes.||VERY HOT||12.50
Duck Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||12.50
Duck Bhuna|Medium with tomatoes and onions.||MEDIUM||12.50
Duck Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||12.50`,
  },
  {
    slug: "seafood-traditional",
    name: "Seafood Traditional",
    lines: `
Prawn Curry|||MEDIUM||11.50
Prawn Dhansak|Sweet, sour and fairly hot with lentils.||HOT||11.50
Prawn Korma|Mild and creamy with coconut.|Dairy, Tree nut|||11.50
Prawn Madras|||FAIRLY HOT||11.50
Prawn Vindaloo|Very hot with potatoes.||VERY HOT||11.50
Prawn Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||11.50
Prawn Bhuna|Medium with tomatoes and onions.||MEDIUM||11.50
Prawn Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||11.50
King Prawn Curry|||MEDIUM||14.50
King Prawn Dhansak|Sweet, sour and fairly hot with lentils.||HOT||14.50
King Prawn Korma|Mild and creamy with coconut.|Dairy, Tree nut|||14.50
King Prawn Madras|||FAIRLY HOT||14.50
King Prawn Vindaloo|Very hot with potatoes.||VERY HOT||14.50
King Prawn Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT||14.50
King Prawn Bhuna|Medium with tomatoes and onions.||MEDIUM||14.50
King Prawn Rogan|Fairly hot and tangy with tomatoes.||MEDIUM||14.50`,
  },
  {
    slug: "seafood-specials",
    name: "Tamarind Seafood Specials",
    lines: `
Garlic Fish|Monkfish cooked with fresh garlic and fresh lime in a medium-to-hot, thick spiced sauce.|Fish, Wheat|MEDIUM||14.95
Bangla Fish|Pieces of tilapia cooked in a lightly spiced sauce with fresh baby spinach and a variety of herbs & spices.|Fish|MEDIUM||14.50
King Prawn Saag|King prawn gently cooked with spinach, creating a light, subtly flavoured dish.|Dairy, Shellfish|MEDIUM||14.50
Dilruba King Prawn|Jumbo king prawn cooked with spices, yogurt, crushed chillies and special herbs. Highly recommended.|Dairy, Shellfish|FAIRLY HOT||14.50
Peri Peri King Prawn|Cooked with onion, pepper, tomatoes and special peri peri sauce.|Shellfish|FAIRLY HOT||14.50
Chingri Jhalfrazi|King prawn on the shell cooked with hot spices, tomatoes, onions and green chillies.|Shellfish|FAIRLY HOT||14.50
Xacuti King Prawn|A classic, full-flavoured spicy king prawn curry with roasted star anise, coconut, cinnamon, javitri (mace) and fenugreek seeds.|Shellfish, Tree nut|HOT||14.50
Tandoori Chingri Masala|Mildly spiced king prawns, grilled tandoori-style over charcoal and served with masala sauce.|Dairy, Shellfish and Mustard|||14.50
Mango King Prawn|Mildly spiced king prawn tikka with mango, coconut, almond and fresh cream.|Dairy, Shellfish, Tree nut and Mustard|||14.50
Goan Fish Curry|Monkfish pieces cooked in coconut milk and traditional Goan spices.|Dairy, Fish and Tree nut|HOT||14.95
Sea Food Moilly|A mild curry of scallops and tiger prawns cooked in a south Indian style.|Dairy, Shellfish, Fish and Tree nut|HOT||14.95
Machli Jalali|Mixed seafood cocktail — monkfish, scallop and olive — cooked in Rajasthani style.|Shellfish, Fish and Mustard|FAIRLY HOT||14.95`,
  },
  {
    slug: "vegetable-traditional",
    name: "Vegetable Traditional",
    lines: `
Vegetable Curry|||MEDIUM|V|10.50
Vegetable Dhansak|Sweet, sour and fairly hot with lentils.||HOT|V|10.50
Vegetable Korma|Mild and creamy with coconut.|Dairy, Tree nut||V|10.50
Vegetable Madras|||FAIRLY HOT|V|10.50
Vegetable Pathia|Hot, sweet and sour.|Soyabean|FAIRLY HOT|V|10.50
Vegetable Bhuna|Medium with tomatoes and onions.||MEDIUM|V|10.50
Vegetable Rogan|Fairly hot and tangy with tomatoes.||MEDIUM|V|10.50
Vegetable Vindaloo|Very hot with potatoes.||VERY HOT|V|10.50`,
  },
  {
    slug: "vegetable-dishes",
    name: "Vegetable Dishes",
    lines: `
Vegetable Jhalfrezi|||FAIRLY HOT|V|11.50
Vegetable Masala||Dairy, Peanut||V|11.50
Vegetable Balti||Treenut, wheat, Peanut, Mustard|MEDIUM|V|11.50
Garlic Vegetable||Mustard|MEDIUM|V|11.50
Vegetable Karahi|||HOT|V|11.50
Vegetable Lajaz||Dairy|FAIRLY HOT|V|11.50
Xacuti Vegetable||Mustard|HOT|V|11.50`,
  },
  {
    slug: "side-vegetables",
    name: "Side Vegetables",
    description: "Any side dish can be ordered as a main course with a supplement.",
    lines: `
Mushroom Saag|Mushroom with spinach.||MEDIUM|V|5.75
Dall Samba|Lentils with vegetables.||MEDIUM|V|5.75
Dall Bukhara|Mixed lentils, cumin seeds, garlic and green chillies.||VERY HOT|V|5.75
Matar Paneer|Peas with cheese.|Dairy||V|5.75
Bagun Bhaji|Aubergine sautéed in mixed spices.|Dairy|MEDIUM|V|5.75
Saag Paneer|Spinach with cheese.|Dairy||V|5.75
Aloo Gobi|Potato with cauliflower.||MEDIUM|V|5.75
Tarka Daal|Lentils cooked with garlic and fresh coriander.|Dairy|MEDIUM|V|5.75
Channa Masala|Chickpeas cooked in a garam masala sauce.||MEDIUM|V|5.75
Shabji e Bahar|Mixed vegetables cooked dry with herbs and spices.|Dairy|MEDIUM|V|5.75
Mixed Vegetable Curry|Selection of vegetables cooked in a medium curry sauce.||MEDIUM|V|5.75
Bombay Aloo|Potatoes cooked in a traditional way.||MEDIUM|V|5.75
Cauliflower Bhaji|Cauliflower cooked dry with mixed spices.||MEDIUM|V|5.75
Bhindi Bhaji|Okra (lady fingers) sautéed in mixed spices.|Dairy|MEDIUM|V|5.75
Mushroom Bhaji|Mushrooms sautéed in mixed spices.||MEDIUM|V|5.75
Saag Bhaji|Spinach cooked with garlic.|Dairy|MEDIUM|V|5.75
Saag Aloo|Spinach with potato.|Dairy|MEDIUM|V|5.75`,
  },
  {
    slug: "biryani",
    name: "Biryani Specials",
    description: "All biryanis are prepared with basmati rice and served with vegetable curry.",
    lines: `
Vegetable Biryani||Dairy|MEDIUM|V|11.95
Chicken Biryani||Dairy|MEDIUM||12.95
Chicken Tikka Biryani||Dairy|MEDIUM||13.45
Lamb Biryani||Dairy|MEDIUM||12.95
Lamb Tikka Biryani||Dairy|MEDIUM||13.45
Lamb Tikka Special Biryani|||||11.95|X
Prawns Special Biryani|||||11.95|X
King Prawn Biryani||Dairy, Shellfish|MEDIUM||14.95
Special Biryani|Chicken tikka, lamb tikka, tandoori chicken & prawns.|Dairy, Shellfish|MEDIUM||13.95`,
  },
  {
    slug: "rice",
    name: "Basmati Rice",
    lines: `
Plain Rice||||V|3.25
Pilau Rice||Dairy||V|3.50
Mushroom Rice|Basmati rice cooked with mushroom.|Dairy||V|4.45
Coconut Rice|Basmati rice cooked with grated coconut.|Dairy, Tree nut||V|4.45
Tropical Rice|Basmati rice cooked with carrots, nuts and sultanas.|Dairy, Peanut||V|4.45
Vegetable Rice|Basmati rice cooked with mixed vegetables and spices.|Dairy|MEDIUM|V|4.45
Lemon Rice|Basmati rice cooked with lime and lemon.|Dairy|MEDIUM|V|4.45
Special Rice|Basmati rice cooked with peas and eggs.|Dairy, Egg|||4.45
Keema Rice|Basmati rice cooked with minced meat.|Dairy|MEDIUM||4.45`,
  },
  {
    slug: "breads-accompaniments",
    name: "Breads & Accompaniments",
    lines: `
Plain Poppadum||Wheat||V|0.90
Spicy Poppadum||Wheat|HOT|V|0.90
Mango Chutney||Dairy|MEDIUM|V|0.90
Lime Pickle||Dairy|MEDIUM|V|0.90
Onion Salad||Dairy|MEDIUM|V|0.90
Raita||Dairy||V|2.95
Red Sauce||||V|0.70
Chapati|Thin unleavened flat bread.|Wheat||V|2.95
Tandoori Roti|Thin, unleavened wheat bread.|Wheat||V|2.95
Plain Paratha|Buttered bread cooked on a griddle pan.|Dairy, Wheat||V|3.25
Stuffed Paratha|Bread stuffed with mashed vegetables.|Dairy, Wheat||V|3.95
Naan Bread|Bread baked in the clay oven, with butter.|Dairy, Egg & Wheat||V|2.95
Chilli Naan|Bread sprinkled with chopped green chilli.||||3.25
Cheese Naan|Bread stuffed with cheese.|Dairy, Egg & Wheat|||3.25
Garlic Naan|Bread sprinkled with fresh garlic.|Dairy, Egg & Wheat|||3.25
Peshwari Naan|Bread stuffed with almonds and sultanas.|Dairy, Egg, Tree nut & Wheat|||3.25
Keema Naan|Bread with minced meat.|Dairy, Egg & Wheat|||3.25
Mint Sauce|||||0.80`,
  },
  // Served in the restaurant but not on the ordering site — hidden until management supplies the menus.
  { slug: "desserts", name: "Desserts", lines: "", visible: false },
  { slug: "drinks", name: "Drinks", lines: "", visible: false },
];

/** Featured dishes for the homepage — a starting selection for management to change. */
export const FEATURED = ["Tandoori Mixed Grill", "Lamb Chops", "Goan Fish Curry", "Dilruba King Prawn", "Murgh Malai Tikka", "Tamarind Special Chicken"];

export const SPICE_MAP: Record<string, number> = { "": 0, MEDIUM: 1, HOT: 2, "FAIRLY HOT": 3, "VERY HOT": 4 };

/** Map the free-text allergen notes to the 14 UK allergen keys. */
export function parseAllergens(text: string): string[] {
  const t = text.toLowerCase();
  const out = new Set<string>();
  if (/dairy|milk/.test(t)) out.add("milk");
  if (/wheat|gluten/.test(t)) out.add("cereals_gluten");
  if (/egg/.test(t)) out.add("eggs");
  if (/shellfish|prawn/.test(t)) out.add("crustaceans");
  if (/\bfish\b/.test(t)) out.add("fish");
  if (/mustard/.test(t)) out.add("mustard");
  if (/peanut/.test(t)) out.add("peanuts");
  if (/tree ?nut/.test(t)) out.add("tree_nuts");
  if (/soy/.test(t)) out.add("soya");
  return [...out];
}

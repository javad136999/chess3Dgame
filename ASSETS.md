# Pawn Character Art Direction

The pawn characters follow the supplied StockCake reference direction: compact medieval knights with closed pointed helmets, dark/ivory plate armor, capes, shields, short swords, bronze/gold trim, and a narrow warm visor glow.

Runtime model:
- `public/models/knight.glb` — Quaternius Animated Knight Pack, converted to GLB by the Warptracker project and redistributed under CC0.
- Source: https://quaternius.com/packs/knightcharacter.html
- License: CC0 https://creativecommons.org/publicdomain/zero/1.0/

Generated visual references used during implementation:
- local-only `art/pawn-dark-knight.png`
- local-only `art/pawn-light-knight.png`

The runtime loads the real rigged knight model and keeps the existing idle/attack animation hooks. Three.js PBR meshes add the board-specific cape, shield, sword, helmet crest, visor glow, and color treatment for white and black sides.

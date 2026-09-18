# Pawn Character Art Direction

The pawn characters now follow the supplied StockCake reference direction: compact medieval knights with closed pointed helmets, dark/ivory plate armor, capes, shields, short swords, bronze/gold trim, and a narrow warm visor glow.

Generated visual references used during implementation:
- `art/pawn-dark-knight.png`
- `art/pawn-light-knight.png`

The runtime keeps the existing Knight.glb model and idle animation, then layers the helmet, visor, cape, shield, sword, and trim as Three.js PBR meshes so the pieces remain lightweight, interactive, and color-consistent on the board.

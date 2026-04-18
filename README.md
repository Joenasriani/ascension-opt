# ascension-opt
The puzzle game that started monument valley 
>> https://joenasriani.github.io/ascension-opt/

## Touch controls

- **Single finger**: unchanged from existing behavior (tap puzzle blocks and interact normally).
- **Two fingers**: swipe in one dominant axis to move the player in a straight cardinal direction:
  - Swipe left → move left
  - Swipe right → move right
  - Swipe up → move up
  - Swipe down → move down
- **Two-finger pan (scene/pedestal translation)**:
  - Place two fingers and move them together to translate the level group on **X/Y**.
  - Pan starts only when both fingers move in a similar direction.
  - Pan is suppressed when the gesture looks like a **pinch** (distance delta > `0.01` in normalized scene units) or significant **rotation** (angle delta > `0.12` radians).
  - Pan sensitivity is `0.012` world units per pixel of centroid motion.
  - To avoid control conflicts, straight two-finger cardinal swipes still move the player, while continuous coherent translation drives scene/pedestal pan.

Two-finger movement follows existing valid-walk constraints (linked blocks and collision checks), so invalid moves are ignored.

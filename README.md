# ascension-opt
The puzzle game that started monument valley 
>> https://joenasriani.github.io/ascension-opt/
>>
>> A S C E N S I O N 

Architectural Geometry Puzzle

Navigate broken paths, rotate  structures, and solve serene architectural puzzles in a floating world of alignment, and illusion.

ASCENSION is a minimalist architectural puzzle game where logic and geometry. Guide a silent traveler through calm, floating landscapes, broken stairways, rotating bridges, sliding pillars, and perspective-based paths that only exist when the world is aligned correctly.

Every level challenges you to study the space, rotate your view, manipulate architectural mechanisms, and create a path where there was none before. There are no timers, no enemies, and no pressure - only clean geometry, calm atmosphere, and satisfying puzzle logic.



FEATURES

- Geometry Puzzles

Solve perspective-based architectural puzzles where alignment, angle, and spatial logic decide the path forward.

- Serene Floating Worlds

Explore: calm minimalist environments built from clean architectural shapes, soft colors, and elegant geometric forms.

- Interactive Puzzle Mechanics

Use rotators, sliders, bridges, switches, and movable structures to reshape each level and open new routes.

- Perspective-Based Navigation: Change your viewing angle to understand impossible paths and reveal hidden solutions.

- 10 Color Themes: Progress through unique visual themes with refined palettes, clean interface design, and minimalist architectural presentation.

- Progressive Difficulty: Start with simple tutorial spires, then advance into more complex architectural challenges that require planning and observation.

- Calm Puzzle Experience: No health bars, no combat, no countdowns. ASCENSION focuses on slow thinking, spatial reasoning, and peaceful problem-solving.

- Browser-Friendly Gameplay: Play directly in your browser with smooth Three.js-powered 3D performance.



HOW TO PLAY

1. Click a path block to move the traveler.

2. Rotate the camera to inspect the world from different angles.

3. Click wheel mechanisms to rotate bridge segments.

4. Drag red handles to move sliding platforms.

5. Activate gold switches to create new paths.

6. Align broken structures to connect routes.

7. Reach the final platform to complete the puzzle.



CONTROLS

Desktop:

Click path blocks to move.
Click and drag the background to orbit the camera.
Click wheels to rotate bridge segments.
Drag red handles to move sliding platforms.
Mobile:

Tap path blocks to move.
Swipe or drag the background to orbit.
Tap wheels and switches to interact.
Drag handles to slide platforms.


WHY PLAY ASCENSION?

ASCENSION is designed for players who enjoy minimalist puzzle games, impossible geometry, architectural worlds, calm brain teasers, perspective puzzles, and atmospheric browser games.

It combines clean visual design with logic-based spatial puzzles, making it ideal for short, relaxing sessions or focused puzzle-solving play.



TECHNICAL DETAILS

Built with Three.js for smooth web-based 3D performance.
Optimized for desktop and mobile browsers.
Designed around strict alignment logic for fair puzzle solving.
Runs directly in the browser with no download required.


GOOD FOR PLAYERS WHO LIKE

- Impossible geometry games

- Minimalist puzzle games

- Architectural puzzle worlds

- Perspective-based puzzles

- Relaxing brain teasers

- Atmospheric indie games

- Logic puzzle games

- Browser-based 3D games

- Calm exploration games

- Spatial reasoning challenges

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


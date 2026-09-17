# 이미지 프롬프트 모음

## ★ 타이틀 화면 배경 (새로 추가 — 이것부터 필요합니다)

앱을 켜면 처음 나오는 화면의 **세로 전체 배경**입니다.
성장 단계 그림과 달리 **한 장짜리, 세로 방향**이고, **아래쪽 1/3은 어둡고 비어 있어야** 합니다
(거기에 앱 이름과 "시작하기" 버튼이 올라갑니다).

저장 이름: `title.png` → `art/` 폴더에 넣어주세요.

### 옵션 A — 황금룡 단독 (추천, 실패 확률 낮음)

```
Create a single VERTICAL portrait image, aspect ratio 2:3 (1024x1536), for a mobile game title screen.

SUBJECT: One colossal Eastern golden dragon, coiling upward through moonlit clouds above distant mountain peaks. Golden scales with amber highlights, long flowing whiskers, majestic antler-like horns, silky mane. Serene and awe-inspiring rather than aggressive — it is guarding, not attacking.

COMPOSITION — THIS IS THE MOST IMPORTANT PART:
- The dragon occupies the TOP 60% of the image, its head in the upper third.
- The BOTTOM 35% of the image must be DARK, EMPTY and UNCLUTTERED — deep night sky and soft shadow only, fading almost to black at the very bottom edge. App text will be placed over that area and must stay readable.
- No horizon line or bright element in the bottom third.

STYLE: cinematic fantasy key art, painterly, rich but restrained color, deep dark blue-black night palette with warm gold light coming from the dragon itself. Calm, premium, mysterious. Suitable for a quiet puzzle game, not a loud action game.

DO NOT include: any text, letters, numbers, logos, watermarks, UI elements, buttons, borders or frames.
```

### 옵션 B — 5종이 함께 (더 멋있지만 AI가 망칠 확률 높음)

```
Create a single VERTICAL portrait image, aspect ratio 2:3 (1024x1536), for a mobile game title screen.

SUBJECT: Five legendary guardian creatures arranged in a symmetrical heraldic composition against a night sky: a golden Eastern dragon at the top center and largest, a fiery phoenix upper left, a blue-glowing white tiger lower left, a bronze griffin upper right, and a teal sea serpent lower right. Each is distinct in colour and silhouette. Serene and majestic, not fighting — they are guardians at rest.

COMPOSITION — THIS IS THE MOST IMPORTANT PART:
- All five creatures sit within the TOP 60% of the image.
- The BOTTOM 35% must be DARK, EMPTY and UNCLUTTERED — deep night sky fading almost to black at the bottom edge. App text goes there and must stay readable.
- Keep the creatures clearly separated so none of them merge into another.

STYLE: cinematic fantasy key art, painterly, deep dark blue-black night palette, each creature lit by its own coloured glow. Calm, premium, mysterious.

DO NOT include: any text, letters, numbers, logos, watermarks, UI elements, buttons, borders or frames.
```

### 결과가 마음에 안 들 때

| 증상 | 이어서 할 말 |
|---|---|
| 아래쪽이 밝아서 글씨가 안 보일 것 같음 | `Make the bottom third of the image much darker and emptier — almost pure black, no detail at all.` |
| 동물이 너무 작음 | `Make the dragon much larger and closer to the viewer, filling most of the upper two thirds.` |
| 너무 무섭거나 공격적임 | `Make it calm and serene rather than aggressive. No open jaws, no fighting pose.` |
| 글자가 박혀 나옴 | `Remove all text and logos. Artwork only.` |

---

# 전설의 동물 5종 — 성장 단계 (완료됨)

이미 다 받아서 앱에 적용했습니다. 다시 뽑으실 일이 있을 때를 위해 남겨둡니다.

## (v2 · 포즈 다양화)

## v2에서 바뀐 것

v1은 단계마다 포즈가 비슷해서 **"자란 것"이 아니라 "확대한 것"처럼** 보였습니다.
v2는 단계마다 **포즈와 카메라 각도를 다르게** 못박았습니다.

| 단계 | 포즈 |
|---|---|
| 1 알 | 바닥에 놓여 있음, 살짝 기울어짐 |
| 2 부화 | 앉아서 고개 들고 정면을 봄, 입 벌리고 방긋 |
| 3 유체 | 공중에서 몸을 동그랗게 말고 어깨너머로 뒤돌아봄 |
| 4 성장기 | 앞으로 돌진·활강, 아래에서 올려다본 각도 |
| 5 성체 | 몸을 세우고 고개를 높이 들어 포효 |
| 6 전설 | 정면을 향해 대칭으로 펼침, 압도적 |

---

## 사용법

1. ChatGPT에 아래 프롬프트를 **하나씩** 붙여넣습니다 (총 5번).
2. 결과를 **PNG로 저장**합니다.
3. 파일명을 바꿔서 이 폴더(`art/`)에 넣어주세요.
   `dragon.png` / `phoenix.png` / `tiger.png` / `griffin.png` / `leviathan.png`
4. 나머지(잘라내기, 앱에 붙이기, 승급 연출)는 제가 합니다.

> **칸 폭이 제각각이어도 괜찮습니다.** 기계적으로 6등분하지 않고
> 각 동물의 실제 윤곽을 찾아서 잘라내니, 크기가 달라도 문제없습니다.
>
> **검은 배경 그대로 두세요.** 동그란 메달 모양으로 만들 거라 오히려 잘 맞습니다.

---

## ① 황금룡 (Golden Dragon)

```
Create a single wide landscape image (1536x1024) showing the evolution of ONE creature across 6 stages, arranged left to right in a single horizontal row, evenly spaced with clear empty gaps between them.

CREATURE: An Eastern golden dragon. Serpentine coiling body, golden scales with amber highlights, long flowing whiskers, majestic antler-like horns, silky mane.

THE 6 STAGES — each must have a DIFFERENT pose and camera angle:
1. Egg — cream shell with glowing gold veins, resting on the ground, slightly tilted, seen from the side
2. Hatchling — tiny and chubby, SITTING UPRIGHT facing the viewer, head tilted up, mouth open in a happy chirp, tiny horn nubs
3. Juvenile — airborne, body CURLED INTO A ROUND LOOP, looking back over its shoulder, playful, short horns
4. Adolescent — DIVING FORWARD, body stretched out diagonally, seen from a LOW ANGLE looking up, whiskers streaming back
5. Adult — REARING UP VERTICALLY, head raised high and ROARING, body coiled beneath, seen from the side
6. Legendary form — FACING THE VIEWER HEAD-ON, symmetrical, body spiraling outward around it, wreathed in golden light and swirling clouds, imposing and epic

CRITICAL: Do not repeat the same silhouette. Each of the 6 must be instantly distinguishable by pose alone.

STYLE (identical in all 6): clean semi-realistic fantasy game icon art, painterly with crisp edges, rich saturated color, soft rim lighting, glowing highlights. Single creature centered in its own space. Plain solid black background. Same art style, same color palette, same character identity throughout — one creature growing up.

DO NOT include: any text, numbers, labels, captions, borders, frames, panel dividers, grid lines, or watermarks.
```

---

## ② 불사조 (Phoenix)

```
Create a single wide landscape image (1536x1024) showing the evolution of ONE creature across 6 stages, arranged left to right in a single horizontal row, evenly spaced with clear empty gaps between them.

CREATURE: A phoenix. Crimson and orange plumage tipped with gold, long flowing tail feathers, drifting ember particles.

THE 6 STAGES — each must have a DIFFERENT pose and camera angle:
1. Egg — deep red shell with glowing ember cracks, resting on the ground, slightly tilted, seen from the side
2. Hatchling — tiny fluffy chick, SITTING UPRIGHT facing the viewer, head tilted up, beak open in a happy chirp
3. Juvenile — PERCHED on one leg, one small wing stretched out, looking back over its shoulder
4. Adolescent — DIVING FORWARD with wings swept back, seen from a LOW ANGLE looking up, tail feathers streaming
5. Adult — LANDING pose, wings thrown wide open, head raised and crying out, seen from the side
6. Legendary form — FACING THE VIEWER HEAD-ON, symmetrical, wings fully spread and engulfed in brilliant fire, radiant halo behind, imposing and epic

CRITICAL: Do not repeat the same silhouette. Each of the 6 must be instantly distinguishable by pose alone.

STYLE (identical in all 6): clean semi-realistic fantasy game icon art, painterly with crisp edges, rich saturated color, soft rim lighting, glowing highlights. Single creature centered in its own space. Plain solid black background. Same art style, same color palette, same character identity throughout — one creature growing up.

DO NOT include: any text, numbers, labels, captions, borders, frames, panel dividers, grid lines, or watermarks.
```

---

## ③ 백호 (White Tiger)

```
Create a single wide landscape image (1536x1024) showing the evolution of ONE creature across 6 stages, arranged left to right in a single horizontal row, evenly spaced with clear empty gaps between them.

CREATURE: A white tiger guardian beast. Snow-white fur with bold black stripes, piercing ice-blue eyes, faint glowing blue energy markings on its fur.

THE 6 STAGES — each must have a DIFFERENT pose and camera angle:
1. Egg — pale white shell with black stripe markings and blue glow, resting on the ground, slightly tilted, seen from the side
2. Hatchling — tiny fluffy cub, SITTING UPRIGHT facing the viewer, oversized paws, head tilted up, mouth open in a happy mew
3. Juvenile — CROUCHED LOW and playful, rear raised as if about to pounce, looking back over its shoulder
4. Adolescent — MID-LEAP through the air, body stretched out, seen from a LOW ANGLE looking up, claws extended
5. Adult — STANDING IN PROFILE, one paw forward, head turned to roar, thick mane-like ruff, commanding
6. Legendary form — FACING THE VIEWER HEAD-ON, symmetrical, armored shoulders, crackling blue lightning aura radiating outward, imposing and epic

CRITICAL: Do not repeat the same silhouette. Each of the 6 must be instantly distinguishable by pose alone.

STYLE (identical in all 6): clean semi-realistic fantasy game icon art, painterly with crisp edges, rich saturated color, soft rim lighting, glowing highlights. Single creature centered in its own space. Plain solid black background. Same art style, same color palette, same character identity throughout — one creature growing up.

DO NOT include: any text, numbers, labels, captions, borders, frames, panel dividers, grid lines, or watermarks.
```

---

## ④ 그리핀 (Griffin)

```
Create a single wide landscape image (1536x1024) showing the evolution of ONE creature across 6 stages, arranged left to right in a single horizontal row, evenly spaced with clear empty gaps between them.

CREATURE: A griffin. Eagle head and wings with a lion's hindquarters, bronze and cream feathers, sharp golden beak, tawny fur.

THE 6 STAGES — each must have a DIFFERENT pose and camera angle:
1. Egg — speckled tan shell with a single bronze feather resting against it, on the ground, slightly tilted, seen from the side
2. Hatchling — tiny fuzzy chick, SITTING UPRIGHT facing the viewer, oversized beak and paws, head tilted up, comical and endearing
3. Juvenile — PERCHED on a rock, one wing half-open for balance, looking back over its shoulder
4. Adolescent — DIVING FORWARD with wings swept back and talons out, seen from a LOW ANGLE looking up
5. Adult — LANDING pose, broad wings thrown wide, front paws planted, head turned in profile, proud and regal
6. Legendary form — FACING THE VIEWER HEAD-ON, symmetrical, enormous silver-edged wings fully spread, storm winds and swirling feathers, imposing and epic

CRITICAL: Do not repeat the same silhouette. Each of the 6 must be instantly distinguishable by pose alone.

STYLE (identical in all 6): clean semi-realistic fantasy game icon art, painterly with crisp edges, rich saturated color, soft rim lighting, glowing highlights. Single creature centered in its own space. Plain solid black background. Same art style, same color palette, same character identity throughout — one creature growing up.

DO NOT include: any text, numbers, labels, captions, borders, frames, panel dividers, grid lines, or watermarks.
```

---

## ⑤ 해룡 (Leviathan)

```
Create a single wide landscape image (1536x1024) showing the evolution of ONE creature across 6 stages, arranged left to right in a single horizontal row, evenly spaced with clear empty gaps between them.

CREATURE: A sea serpent leviathan. Deep teal and sapphire scales, translucent fins like flowing silk, glowing bioluminescent markings along its body.

THE 6 STAGES — each must have a DIFFERENT pose and camera angle:
1. Egg — smooth blue-green pearlescent shell with faint glowing spots, resting on the seabed, slightly tilted, seen from the side
2. Hatchling — tiny and round, SITTING UPRIGHT facing the viewer, big eyes, small fins, mouth open happily
3. Juvenile — swimming with body CURLED INTO A ROUND LOOP, looking back over its shoulder, fins trailing
4. Adolescent — LUNGING FORWARD through water, body stretched out diagonally, seen from a LOW ANGLE looking up
5. Adult — RISING VERTICALLY out of crashing waves, head raised and jaws open, body coiled beneath, seen from the side
6. Legendary form — FACING THE VIEWER HEAD-ON, symmetrical, immense body spiraling outward, deep abyssal light radiating, imposing and epic

CRITICAL: Do not repeat the same silhouette. Each of the 6 must be instantly distinguishable by pose alone.

STYLE (identical in all 6): clean semi-realistic fantasy game icon art, painterly with crisp edges, rich saturated color, soft rim lighting, glowing highlights. Single creature centered in its own space. Plain solid black background. Same art style, same color palette, same character identity throughout — one creature growing up.

DO NOT include: any text, numbers, labels, captions, borders, frames, panel dividers, grid lines, or watermarks.
```

---

## 결과가 마음에 안 들 때 — 이어서 붙여넣을 수정 요청

| 증상 | ChatGPT에 이어서 할 말 |
|---|---|
| **포즈가 다 비슷함** | `The 6 poses are too similar. Redo it so each stage has a completely different pose and camera angle: sitting / curled loop / diving from below / rearing up roaring / facing the viewer symmetrically.` |
| 단계마다 그림체가 다름 | `All 6 must use the exact same art style and color palette. Redo it so it clearly looks like one single creature growing up.` |
| 글자·숫자가 박혀 나옴 | `Remove all text, numbers and labels from the image. Artwork only.` |
| 서로 붙어서 겹침 | `Add clear empty space between each of the 6 creatures so none of them touch or overlap.` |
| 마지막이 안 웅장함 | `Make the 6th stage far more epic and imposing — bigger, glowing, dramatic lighting, facing the viewer.` |
| 동물이 잘림 | `Center each creature fully with even margin. Nothing cropped at the edges.` |
| 6마리가 아님 | `It must be exactly 6 creatures in one horizontal row.` |

## 저작권

OpenAI 약관상 생성한 이미지는 사용자 소유이고 상업적 이용이 가능합니다.
요금제·약관은 바뀔 수 있으니 앱 출시 전에 한 번 확인해 두시는 게 안전합니다.

# CPR Scenario Lab v1 — Interaction Specification

## Purpose

Turn passive CPR recall into a facilitator-led rehearsal where four learners each own one meaningful action. The prop supports teaching and discussion; it does not assess CPR competence or replace manikin practice.

## Cognitive requirements

- Present one decision at a time; never expose the whole algorithm while a novice is choosing.
- Keep the active rehearsal model to four named missions: `Kenal pasti`, `Aktifkan bantuan`, `Tekan dada`, `Gunakan AED`.
- A wrong decision must prompt a retry; it must never unlock the next mission.
- Reveal the full route only during debrief, after learners have traversed it.
- Reserve colour semantics: red = emergency activation, coral = compressions, cyan = AED/information, green = correct/recovery, amber = caution.
- Use motion only for the compression pulse and current-step transition; respect reduced-motion preferences.

## Physical role cards

| Role | Symbol | Responsibility |
|---|---|---|
| Safety Coach | Shield | Identify danger and verify safe approach |
| Caller | Phone | Call 999, use speaker mode, give location |
| Compressor | Hands | Start and maintain 100–120/min compressions |
| AED Runner | Bolt | Retrieve, power, place pads, call clear |

Cards can be handwritten or printed. The projector uses the same symbols and names.

## State machine

```text
lobby
  -> roles
  -> decision-recognition
  -> decision-activation
  -> compression-practice
  -> aed-placement
  -> debrief
  -> lobby (reset)
```

The facilitator owns all transitions. No screen auto-advances.

## Screen wireframes

### Lobby

```text
[CPR Scenario Lab v1]                 [BM / EN]
One room. Four roles. One chain.
[Start rehearsal]
Educational safety note
```

### Decision

```text
[Mission 2/4] [Active role: Caller]
[Recognise] [Activate help] [Compress] [Use the AED]
Scenario update
What should happen now?
[Choice A]
[Choice B]
[Choice C]
[Reasoning appears after selection]
[Wrong choice stays in the mission; learner retries]
[Back] [Continue]
```

### Compression challenge

```text
[Compressor]
30-tap training pad
[count] [live BPM] [consistency]
Target 100–120/min
[Reset attempt] [Continue]
```

### AED placement

```text
[AED Runner]
Torso diagram with two target zones
[Pad A] [Pad B]
Click the correct zones, then call CLEAR
```

### Debrief

```text
Full four-step chain
Time taken | decision accuracy | rhythm result
What protected the chain? What broke it?
[Rehearse again]
```

## Component contract

```js
AppState = {
  phase: 'lobby' | 'roles' | 'recognition' | 'activation' | 'compressions' | 'aed' | 'debrief',
  language: 'bm' | 'en',
  answers: Record<string, number>,
  attempts: Record<string, number>,
  compression: { timestamps: number[], bpm: number, consistency: number },
  aedPads: string[],
  startedAt: number | null
}

RoleCard = { id, symbol, name, instruction, accent }
DecisionStep = { id, role, prompt, choices[], correctIndex, reasoning }
```

## Accessibility and fallback

- Full keyboard operation and visible focus.
- Touch targets at least 44 px.
- Text and symbols repeat colour meaning.
- Reduced-motion mode disables scale/pulse animation.
- App remains usable on a phone, but projector/facilitator use is primary.
- No network calls after the static page loads.

## Revision rationale

- Miller's Law is applied as meaningful chunking, not as a literal item-count rule: the active route is four named missions and each decision exposes only three choices.
- Perception-first sequencing keeps one dominant action per screen, shows orientation without exposing the entire algorithm, and turns explanation into feedback after the learner acts.
- First-attempt accuracy is retained for debrief while an unsafe choice cannot advance the scenario.

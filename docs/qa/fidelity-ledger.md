# Production visual and interaction QA

Verified against `https://xuanji.chendanhuang31016.workers.dev` on 2026-07-11.

1. Desktop editorial layout preserves the intended light chart canvas and dark reading panel hierarchy.
2. Mobile layout keeps all four pillars, hidden stems, ten gods, decade fortunes, evidence and chat readable without horizontal page overflow.
3. The birth form exposes date, time, place, coordinates, IANA timezone, precision, gender basis and methodology controls.
4. The completed report visibly identifies Gateway `xuanji`, renders structured Claims and exposes ten Evidence cards.
5. Think chat connects through WebSocket, restores prior messages and returns a streamed answer; cumulative Workers AI fragments are normalized for display.
6. History cards navigate to persistent report routes, and dedicated profile/chart/reading/chat/methodology routes return production pages.
7. Chrome console showed no warnings or errors after the completed report and follow-up interaction.

Artifacts:

- `desktop-reading.png`
- `mobile-reading.png`

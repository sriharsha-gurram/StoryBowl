// Prepared stories make the example enjoyable even when live AI is unavailable.
// Each mood uses the same five objects to drive a complete, four-paragraph plot.
import type { Mood } from "./index";

export const fixtures: Record<Mood, { title: string; story: string }> = {
  calm: {
    title: "A Dry Place to Wait",
    story: `Rain began just as Meera reached her flat in Pune. She shook out her umbrella and heard a small cry behind the stairwell. A wet cat was hiding there, too frightened to cross the puddle by the door. Meera held the umbrella low and waited. The cat finally stepped beneath it and followed her upstairs.

Inside, she switched on the lamp and spread a towel beside her chair. The cat settled down, but kept looking towards the window. Meera noticed a letter on her table, delivered that morning. Her mother had written that she wanted to visit on Sunday, though she worried Meera was too busy to have company. Meera had been putting off answering because the flat felt small and untidy.

The cat stood up and pressed its nose against the window. Across the lane, an elderly neighbour was searching under parked cars in the rain. Meera recognised the same worried movement. She called down, and the neighbour looked up with relief. Meera fetched her umbrella again, crossed the lane, and brought him back without either of them getting soaked.

He sat beside the lamp while his cat climbed onto his lap. Meera found another cup and made tea. The little room suddenly had space for two people, a drying umbrella, and a very comfortable cat. After the neighbour left, she picked up her mother's letter and called her. “Come on Sunday,” she said. “I'll have the kettle ready.”`,
  },
  funny: {
    title: "The Guest Who Arrived First",
    story: `Ravi received a letter inviting him to dinner at his neighbour's Chennai flat. He read it beside the lamp, which was missing its shade and lit only half the page. “Bring your own plate,” he read aloud. His cat watched him put a large steel plate in a bag, apparently impressed by this sensible preparation.

Rain started while Ravi was looking for his sandals. He opened his umbrella in the corridor to check for holes, and the cat slipped underneath it. Ravi tried to close the umbrella, but the cat kept moving from one side to the other. By the time he persuaded it out, a neighbour had passed them twice and politely asked whether this was a new exercise.

The cat ran straight into the dinner flat when the door opened. Ravi followed, holding his umbrella, his bag, and the invitation. His neighbour looked puzzled when he handed her the plate. She took the letter back to a brighter light and pointed to the line he had missed. “Bring your own plate only if you're entering the washing-up contest.” That was her little joke below the actual invitation.

Ravi put the plate away and sat down. Then the neighbour asked everyone to help carry food from the kitchen. His cat was already beside the bowls, waiting hopefully. Ravi took out his plate again. “I brought equipment,” he announced. “And apparently an assistant.” The assistant immediately knocked his empty bag off the chair and claimed the seat.`,
  },
  mystery: {
    title: "The Letter Under the Lamp",
    story: `After a night of rain in Jaipur, Asha found a folded letter tucked beneath the lamp outside her front door. It had no stamp and no name. Inside were six words: “Your missing thing stayed close to home.” Asha had lost her small silver bracelet yesterday, but had told nobody except her brother over the phone.

She checked the stairs and the empty flowerpot where she sometimes left small parcels. Nothing. Her cat followed her, then stopped beside the umbrella drying against the wall. Asha lifted it and heard a faint rattle inside the handle. She unscrewed the little cap and found her bracelet wrapped in tissue. Someone had hidden it carefully instead of leaving it outside in the rain.

Now the letter was more puzzling than the lost bracelet. Asha took it under the lamp and saw a tiny blue thumbprint near the fold. Downstairs, the boy from the stationery shop was stacking newspapers. His fingers were covered in blue ink. He admitted finding the bracelet by their gate, but shook his head when she asked how he knew which umbrella was hers.

“I didn't,” he said. “Your brother was visiting. He showed me.” Asha called her brother, who laughed and confessed that he had planned a little surprise before leaving for work. The cat had followed him upstairs and delayed him at the door. He had tucked the letter under the lamp so it wouldn't blow away. Asha put on the bracelet, then sent him a message: “Next time, just ring the bell.”`,
  },
};

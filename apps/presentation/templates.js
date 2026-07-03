/*
  Slide template definitions: shape of each slide type + a blank factory.
  Adding a new template = add an entry here + a render case in app.js.
*/
const Templates = {
  title: {
    label: "Title",
    icon: "🏷️",
    blank: () => ({ heading: "Title", subheading: "Subtitle or your name" }),
  },
  bullets: {
    label: "Bullet points",
    icon: "•",
    blank: () => ({ heading: "Heading", items: ["First point", "Second point"] }),
  },
  image: {
    label: "Image + caption",
    icon: "🖼️",
    blank: () => ({ heading: "Heading", imageUrl: "", caption: "Caption" }),
  },
  compare: {
    label: "Comparison",
    icon: "⚖️",
    blank: () => ({
      heading: "Heading",
      leftTitle: "Option A",
      leftItems: ["Point"],
      rightTitle: "Option B",
      rightItems: ["Point"],
    }),
  },
  timeline: {
    label: "Timeline",
    icon: "🕒",
    blank: () => ({
      heading: "Heading",
      steps: [
        { label: "Step 1", detail: "" },
        { label: "Step 2", detail: "" },
      ],
    }),
  },
  quote: {
    label: "Quote / big statement",
    icon: "❝",
    blank: () => ({ quote: "Your quote or key statement", attribution: "" }),
  },
};

function newSlide(type) {
  return { id: Storage.newSlideId(), type, data: Templates[type].blank() };
}

// Family Hub Configuration & Initial Dataset
window.FamilyHubConfig = {
  version: "1.0",
  household: {
    name: "Rumah Hilmi",
    tagline: "Daily Family Dashboard & Task Hub",
    parentPinHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // default PIN: "1234" (SHA-256)
    autoLockSeconds: 120
  },
  members: [
    { id: "m1", name: "Noah", role: "child", avatar: "👦", color: "#3B82F6" },
    { id: "m2", name: "Hud", role: "child", avatar: "🧒", color: "#10B981" },
    { id: "m3", name: "Isa", role: "child", avatar: "👶", color: "#F59E0B" },
    { id: "m4", name: "Rahman", role: "adult", avatar: "👨", color: "#8B5CF6" },
    { id: "m5", name: "Ibu", role: "adult", avatar: "👩", color: "#EC4899" }
  ],
  tasks: [
    { id: "t1", memberId: "m1", title: "Pack school bag & homework", category: "morning", completed: false, priority: "high" },
    { id: "t2", memberId: "m1", title: "Fill water bottle (1L)", category: "morning", completed: true, priority: "medium" },
    { id: "t3", memberId: "m1", title: "Finish Mengaji / Quran reading", category: "evening", completed: false, priority: "high" },
    { id: "t4", memberId: "m2", title: "Put shoes in rack", category: "morning", completed: false, priority: "medium" },
    { id: "t5", memberId: "m2", title: "Pack art sketchbook", category: "morning", completed: true, priority: "medium" },
    { id: "t6", memberId: "m3", title: "Tidy up play blocks", category: "evening", completed: true, priority: "low" }
  ],
  checklists: [
    {
      id: "c1",
      title: "Leaving for School Checklist",
      icon: "🎒",
      items: [
        { id: "ci1", text: "Water bottles packed", checked: true },
        { id: "ci2", text: "Homework folders inside bag", checked: true },
        { id: "ci3", text: "Pocket money checked", checked: false },
        { id: "ci4", text: "Shoes on & tied", checked: false }
      ]
    },
    {
      id: "c2",
      title: "Leaving for Football Practice",
      icon: "⚽",
      items: [
        { id: "ci5", text: "Sports boots & socks", checked: false },
        { id: "ci6", text: "Extra towel & fresh shirt", checked: false },
        { id: "ci7", text: "Electrolyte water bottle", checked: true }
      ]
    }
  ],
  events: [
    { id: "e1", title: "School Departure", time: "7:15 AM", member: "Noah & Hud", badge: "Morning" },
    { id: "e2", title: "Football Training", time: "5:30 PM", member: "Noah", badge: "Sports" },
    { id: "e3", title: "Family Dinner", time: "7:45 PM", member: "All", badge: "Home" }
  ]
};

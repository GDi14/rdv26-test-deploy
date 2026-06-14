// projects_db.js — RDV26 Gallery Data
// =====================================================
// Each entry is a "category" (event or year) with local photos.
// To add photos: drop them in /assets/images/gallery/ and add
// entries below. The "images" array replaces "videos" for the globe grid.
// =====================================================

window.PROJECTS_DATA = [
  {
    name: "RDV 2025 Highlights",
    slug: "rdv-2025",
    projectID: "RDV",
    sortOrder: 1,
    year: 2025,
    services: "FESTIVAL HIGHLIGHTS",
    tags: ["rdv", "2025"],
    type: "featured",
    industry: "festival",
    shortTitle: "Rendezvous 2025",
    longTitle: "Highlights from Rendezvous 2025",
    description1: "A retrospective celebration of talent, creativity, and unforgettable moments from RDV 2025.",
    description2: "Highlights including opening night, stage performances, and crowds.",
    images: [
      "/assets/images/gallery/IMG_7178.JPG",
      "/assets/images/gallery/_MG_6812.JPG",
      "/assets/images/gallery/IMG_20250628_101550007.jpg"
    ],
    gridImages: [
      "/assets/images/gallery/IMG_7178.JPG",
      "/assets/images/gallery/_MG_6812.JPG",
      "/assets/images/gallery/IMG_20250628_101550007.jpg",
      "/assets/images/gallery/_MG_8102.jpg",
      "/assets/images/gallery/IMG_8172.jpg",
      "/assets/images/gallery/IMG_7213.jpg",
      "/assets/images/gallery/IMG_7205.jpg",
      "/assets/images/gallery/_MG_7984.jpg",
      "/assets/images/gallery/rv1.jpeg",
      "/assets/images/gallery/rv2.jpeg",
      "/assets/images/gallery/rv3.jpeg",
      "/assets/images/gallery/rv4.jpeg",
      "/assets/images/gallery/rv9.jpeg",
      "/assets/images/gallery/rv10.jpeg",
      "/assets/images/gallery/rv12.jpeg",
      "/assets/images/gallery/rv13.jpeg",
      "/assets/images/gallery/rv14.jpeg",
      "/assets/images/gallery/rv15.jpeg",
      "/assets/images/gallery/rv16.jpeg"
    ],
    active: true,
    gallery: true
  },
  {
    name: "Melodia",
    slug: "melodia",
    projectID: "MELODIA",
    sortOrder: 2,
    year: 2026,
    services: "ACOUSTIC & BAND",
    tags: ["rdv", "2026", "music"],
    type: "event",
    industry: "music",
    shortTitle: "Melodia Music",
    longTitle: "Melodia Band Competition",
    description1: "Capturing the rhythm, energy, and competitive soul of the bands competing at RDV26.",
    description2: "Stunning stage captures of vocalists and instrumentalists.",
    images: [
      "/assets/images/gallery/rv5.jpeg",
      "/assets/images/gallery/rv6.jpeg",
      "/assets/images/gallery/rv11.jpeg"
    ],
    gridImages: [
      "/assets/images/gallery/rv6.jpeg",
      "/assets/images/gallery/rv11.jpeg"
    ],
    active: true,
    gallery: true
  },
  {
    name: "Invogue",
    slug: "invogue",
    projectID: "INVOGUE",
    sortOrder: 3,
    year: 2026,
    services: "FASHION SHOW",
    tags: ["rdv", "2026", "fashion"],
    type: "event",
    industry: "fashion",
    shortTitle: "Invogue Fashion",
    longTitle: "Invogue Fashion Show",
    description1: "The ultimate runway showdown where style meets creative conceptual design.",
    description2: "Exquisite silhouettes and dramatic styling on the ramp.",
    images: [
      "/assets/images/gallery/IMG_7213.JPG",
      "/assets/images/gallery/_MG_7973.JPG",
      "/assets/images/gallery/_MG_6812.JPG"
    ],
    gridImages: [
      "/assets/images/gallery/rv7.jpeg",
      "/assets/images/gallery/rv8.jpeg"
    ],
    active: true,
    gallery: true
  },
  {
    name: "Seismic",
    slug: "seismic",
    projectID: "SEISMIC",
    sortOrder: 4,
    year: 2026,
    services: "DANCE BATTLE",
    tags: ["rdv", "2026", "dance"],
    type: "event",
    industry: "dance",
    shortTitle: "Seismic Dance",
    longTitle: "Seismic Choreography & Street Dance",
    description1: "High-octane performances, synchronized group dances, and intense street battles.",
    description2: "Frozen in motion: energy, athleticism, and absolute sync.",
    images: [
      "/assets/images/gallery/IMG_8172.JPG",
      "/assets/images/gallery/_MG_7970.JPG"
    ],
    gridImages: [
      "/assets/images/gallery/rv10.jpeg",
    ],
    active: true,
    gallery: true
  },
  {
    name: "Gourmet Crusade",
    slug: "gourmet-crusade",
    projectID: "GOURMET",
    sortOrder: 5,
    year: 2026,
    services: "CULINARY COMPETITION",
    tags: ["rdv", "2026", "culinary"],
    type: "event",
    industry: "food",
    shortTitle: "Gourmet Crusade",
    longTitle: "Gourmet Crusade Culinary Showdown",
    description1: "Showcasing culinary masterclasses, plating art, and intense taste tests.",
    description2: "A celebration of gastronomy and flavors.",
    images: [
      "/assets/images/gallery/_MG_7984.JPG"
    ],
    gridImages: [
      "/assets/images/gallery/rv16.jpeg"
    ],
    active: true,
    gallery: true
  },
  {
    name: "Game F",
    slug: "game-f",
    projectID: "game",
    sortOrder: 6,
    year: 2026,
    services: "gaming",
    tags: ["rdv", "2026", "gaming"],
    type: "event",
    industry: "gaming",
    shortTitle: "Game F",
    longTitle: "Game F FIFA",
    description1: "Showcasing exceptional skills in gaming",
    description2: "FIFA",
    images: [
      "/assets/images/gallery/_MG_7984.JPG"
    ],
    gridImages: [
      "/assets/images/gallery/rv15.jpeg",
      "/assets/images/gallery/rv17.jpeg"
    ],
    active: true,
    gallery: true
  }
];

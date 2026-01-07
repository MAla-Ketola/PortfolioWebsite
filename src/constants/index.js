import {
  javascript,
  html,
  css,
  reactjs,
  tailwind,
  nodejs,
  git,
  figma,
  threejs,
  LittleLemon,
  csharp,
  cplusplus,
  unity,
  unreal,
  AK,
  stepnbloom,
  happytracker,
  eneme,
  uwe,
  coursera,
  portfolio,
  rootodyssey,
  oldschool,
  platformer,
} from "../assets";

export const navLinks = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Projects",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const technologies = [
  {
    name: "HTML 5",
    icon: html,
  },
  {
    name: "CSS 3",
    icon: css,
  },
  {
    name: "JavaScript",
    icon: javascript,
  },
  {
    name: "C#",
    icon: csharp,
  },
  {
    name: "React JS",
    icon: reactjs,
  },
  {
    name: "C++",
    icon: cplusplus,
  },
  {
    name: "Tailwind CSS",
    icon: tailwind,
  },
  {
    name: "Node JS",
    icon: nodejs,
  },
  {
    name: "Unity",
    icon: unity,
  },
  {
    name: "Unreal Engine",
    icon: unreal,
  },
  {
    name: "Three JS",
    icon: threejs,
  },
  {
    name: "git",
    icon: git,
  },
  {
    name: "figma",
    icon: figma,
  },
];

const experiences = [
  {
    title: "Games Technology",
    company_name: [
      "Bachelor of Science, Games Technology, 2:1 ",
      "University of the West of England",
    ],
    icon: uwe,
    iconBg: "#383E56",
    date: "2020 - 2023",
    points: [],
  },
  {
    title: "Meta Front-End Developer Certificate",
    company_name:
      "Focused on React, JavaScript, and front-end development best practices",
    icon: coursera,
    iconBg: "#E6DEDD",
    date: "2025",
    points: [],
  },
];

const projects = [
  {
    name: "Little Lemon",
    description:
      "Fictional Mediterranean restaurant brief turned into a desktop React app with a guided Reserve-a-Table flow.",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "javascript",
        color: "green-text-gradient",
      },
      {
        name: "css",
        color: "pink-text-gradient",
      },
    ],
    image: LittleLemon,
    source_code_link: "https://github.com/MAla-Ketola/Little-Lemon",
  },
  {
    name: "Ali-Ketola",
    description:
      "Wix design-to-build for a countryside venue—new structure, landing pages, and consistent brand palette to make exploring spaces easier.",
    tags: [
      {
        name: "wix",
        color: "blue-text-gradient",
      },
      {
        name: "figma",
        color: "green-text-gradient",
      },
      {
        name: "ux",
        color: "pink-text-gradient",
      },
      {
        name: "webdesign",
        color: "pink-text-gradient",
      },
    ],
    image: AK,
    source_code_link: null,
    live_demo: "https://en.ali-ketolantila.fi/",
    page: "/ali-ketola",
  },
  {
    name: "Portfolio",
    description: "My portfolio website, you're probably looking at right now.",
    tags: [
      {
        name: "react",
        color: "blue-text-gradient",
      },
      {
        name: "threejs",
        color: "green-text-gradient",
      },
      {
        name: "tailwind",
        color: "pink-text-gradient",
      },
    ],
    image: portfolio,
    source_code_link: "https://github.com/MAla-Ketola/PortfolioWebsite",
  },
  {
    name: "Step & Bloom",
    description:
      "Step & Bloom is a vertical-slice step tracker where every step waters a virtual flower, motivating daily movement through light gamification.​",
    tags: [
      {
        name: "csharp",
        color: "blue-text-gradient",
      },
      {
        name: "unity",
        color: "green-text-gradient",
      },
    ],
    image: stepnbloom,
    source_code_link: null,
  },
  {
    name: "Happy Tracker",
    description:
      "A vertical slice of a user-friendly habit-building app designed to help users manage daily habits, and track progress.​",
    tags: [
      {
        name: "xcode",
        color: "blue-text-gradient",
      },
      {
        name: "swift",
        color: "green-text-gradient",
      },
    ],
    image: happytracker,
    source_code_link: null,
  },
  {
    name: "Eneme",
    description:
      "Two-player puzzle-platformer: sabotage your time-displaced twin in a past–present limbo. Inspired by It Takes Two and Fez.",
    tags: [
      {
        name: "c++",
        color: "blue-text-gradient",
      },
    ],
    image: eneme,
    source_code_link: null,
  },
  {
    name: "Root Odyssey",
    description:
      "I designed and implemented an advanced inventory system with an intuitive user interface. Working in a five-person team (Global Game Jam 2023) strengthened my integration and collaboration skills.",
    tags: [
      {
        name: "unity",
        color: "blue-text-gradient",
      },
      {
        name: "csharp",
        color: "blue-text-gradient",
      },
    ],
    image: rootodyssey,
    source_code_link: null,
  },
  {
    name: "Fantasy RPG Platformer",
    description:
      "Designed a challenging level with complex puzzles and dynamic player abilities, showcasing expertise in level design, gameplay mechanics, and problem-solving.",
    tags: [
      {
        name: "unrealengine",
        color: "blue-text-gradient",
      },
    ],
    image: platformer,
    source_code_link: null,
  },
  {
    name: "Old School FPS",
    description:
      "A vertical slice of an old-school first-person shooter game inspired by classic titles such as Wolfenstein 3D and Doom.",
    tags: [
      {
        name: "c++",
        color: "blue-text-gradient",
      },
      {
        name: "unrealengine",
        color: "blue-text-gradient",
      },
    ],
    image: oldschool,
    source_code_link: null,
  },
];

export { technologies, experiences, projects };

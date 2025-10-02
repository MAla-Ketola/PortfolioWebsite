import {
  mobile,
  backend,
  creator,
  web,
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
  portfolio
} from "../assets";

export const navLinks = [
  {
    id: "about",
    title: "About",
  },
  {
    id: "work",
    title: "Work",
  },
  {
    id: "contact",
    title: "Contact",
  },
];

const services = [
  {
    title: "Web Developer",
    icon: web,
  },
  {
    title: "React Native Developer",
    icon: mobile,
  },
  {
    title: "Backend Developer",
    icon: backend,
  },
  {
    title: "Content Creator",
    icon: creator,
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
    points: [
    ],
  },
  {
    title: "Meta Front-End Developer Certificate",
    company_name: "Focused on React, JavaScript, and front-end development best practices",
    icon: coursera,
    iconBg: "#E6DEDD",
    date: "2025",
    points: [
    ],
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
        name: "UX",
        color: "pink-text-gradient",
      },
           {
        name: "webdesign",
        color: "pink-text-gradient",
      },
    ],
    image: AK,
    source_code_link: null,
    live_demo:"https://en.ali-ketolantila.fi/"
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
    source_code_link: "https://github.com/",
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
        name: "Unity",
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
        name: "XCode",
        color: "blue-text-gradient",
      },
      {
        name: "Swift",
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
        name: "C++",
        color: "blue-text-gradient",
      },
    ],
    image: eneme,
    source_code_link: null,
  },
];

export { services, technologies, experiences, projects };

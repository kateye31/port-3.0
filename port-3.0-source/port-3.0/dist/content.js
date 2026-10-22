// Every fact here comes from katrinaadewale.dev or the résumé. Project covers
// are Unsplash photos (assets/photos/CREDITS.txt), not screenshots.
export const LINKS = Object.freeze({
  email: 'katwale797@gmail.com',
  github: 'https://github.com/kateye31',
  linkedin: 'https://linkedin.com/in/katrina-adewale',
  resume: 'assets/katrina-adewale-resume.pdf',
});

export const ABOUT = {
  lede: 'Software engineer, leader, STEM advocate, designer, author and cat-lover.',
  body: [
    'I study Computer Science and Intelligent Robotic Systems at the University of Central Florida, and I’m a UCF STEM Ambassador who loves talking STEM around Orlando.',
    'I like staying involved, meeting new people and travelling any chance I get. The world is big, so why not explore it?',
  ],
  likes: ['animals', 'travelling', 'musicals', 'dancing', 'cooking for friends', 'making cool things together'],
};

export const SKILLS = [
  { group: 'Languages', items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'C', 'C++', 'R', 'HTML5', 'CSS', 'PowerShell', 'LaTeX'] },
  { group: 'Frameworks & cloud', items: ['React', 'Next.js', 'Node.js', 'Three.js', 'GSAP', 'Tailwind', 'PyTorch', 'AWS', 'DynamoDB'] },
  { group: 'Tools & design', items: ['Git', 'VS Code', 'Blender', 'Figma', 'Canva', 'SketchUp'] },
  { group: 'Concepts', items: ['AI / ML', 'Computer vision', 'Parallel computing', 'CI/CD'] },
  { group: 'People skills', items: ['Leadership', 'Communication', 'Teamwork', 'Time management'] },
];

// Featured first (Fireline, LeetField), then Genesis AI and the rest. media is
// what plays on the desk monitor: demo videos (from Katrina's site GIFs), the
// Phantom Wall YouTube thumbnail, or a screenshot. Unsplash only where no
// screenshot exists yet.
export const PROJECTS = [
  { id: 'fireline', title: 'Fireline', featured: true, when: 'Knight Hacks IX · Oct 2026',
    media: { image: 'assets/projects/fireline.webp' }, tags: ['NVIDIA Jetson', 'YOLO + TensorRT', 'ESP32', 'FastAPI', 'React'],
    text: 'Tree-mounted camera units that spot wildfire smoke on the device, in forests with no power or internet, and send one alert packet of 340 bytes or less over a satellite link.',
    links: [['Website', 'https://fire-line.tech/'], ['GitHub', 'https://github.com/kateye31/fireline']], note: 'Demo video coming soon.' },
  { id: 'leetfield', title: 'LeetField', featured: true, when: 'Girls Who Code',
    media: { video: 'assets/projects/leetfield.webm', poster: 'assets/projects/leetfield.webp' }, tags: ['React', 'TypeScript', 'GSAP', 'Gemini API', 'Vite'],
    text: 'A Stardew Valley–style, gamified LeetCode platform for Girls Who Code: 2,500+ problems, 15+ reusable components and a Gemini tutor that gives debugging feedback in under 500ms. Cut user blockage time by ~40%.',
    links: [['GitHub', 'https://github.com/kateye31/nov-14-leetfield']] },
  { id: 'genesis', title: 'Genesis AI', when: 'Senior design · in progress',
    media: { video: 'assets/projects/genesis.webm', poster: 'assets/projects/genesis.webp' }, tags: ['VR/AR', 'AI', 'Capstone'],
    text: 'Reimagine reality, redefine recovery: immersive, AI-assisted mixed reality that makes physical rehabilitation more engaging for patients.' },
  { id: 'phantom', title: 'Phantom Wall', subtitle: 'The Drone Dilemma', when: 'METIL Lab · Oak Ridge National Lab',
    media: { image: 'assets/projects/phantom.webp' }, tags: ['Computer vision', 'LiDAR', 'Three.js', 'Python'],
    text: 'A $15.8k non-kinetic drone neutralization proposal: a hydro-projected fake wall on a laminar water screen tricks LiDAR and VSLAM obstacle avoidance into a stop-and-hover, forcing a controlled descent.',
    links: [['Watch the video', 'https://youtu.be/_lH-aE0-N80']] },
  { id: 'parallel', title: 'Parallel Computing for Hospitals',
    media: { video: 'assets/projects/parallel.webm', poster: 'assets/projects/parallel.webp' }, tags: ['R', 'Slurm', 'Bridges-2', 'Linux'],
    text: 'Parallelized healthcare data processing on the Bridges-2 supercomputer across 256+ CPU cores, cutting execution time by 85%+ with 99.9% pipeline reliability.' },
  { id: 'lawgic', title: 'Lawgic', when: 'Knight Hacks VIII',
    media: { video: 'assets/projects/lawgic.webm', poster: 'assets/projects/lawgic.webp' }, tags: ['Gemini API', 'React', 'Python'],
    text: 'A full-stack AI legal assistant: file upload, a human-in-the-middle review step and email suggestions, with Gemini behind a Python backend.' },
  { id: 'gridlock', title: 'GridLock', when: 'ShellHacks 2026',
    media: { image: 'assets/projects/gridlock.webp' }, tags: ['React', 'GSAP', 'Python', 'Vite'],
    text: 'Maps every planned project from two utilities’ public construction plans and ranks where they’ll be building near each other at the same time, so they can share crews and outage windows.',
    links: [['Live demo', 'https://kateye31.github.io/shellhack/'], ['GitHub', 'https://github.com/kateye31/shellhack']] },
  { id: 'fecafe', title: 'FE Café', when: 'Ongoing since Dec 2025',
    media: { image: 'assets/photos/feprep.webp' }, tags: ['Next.js', 'React', 'GSAP'],
    text: 'A cozy study café for UCF’s Foundation Exam: 18 topics, 19 interactive playgrounds, a C code studio on real gcc, and a pomodoro brew timer.',
    links: [['GitHub', 'https://github.com/kateye31/ulta-feprep']] },
  { id: 'cloud', title: 'Cloud Media Processor', when: 'Nov 2025',
    media: { image: 'assets/photos/cloud.webp' }, tags: ['AWS Lambda', 'S3', 'Rekognition'],
    text: 'A serverless AWS pipeline that processes video uploads, generates thumbnails and detects content. My first step into the cloud.' },
  { id: 'lexer', title: 'Lexical Scanner in C',
    media: { image: 'assets/photos/lexer.webp' }, tags: ['C', 'Compilers', 'State machines'],
    text: 'Built with my project partner Jhanel: a from-scratch ANSI C lexer that turns PL/0 source into tokens and reports every lexical error in one pass.' },
];

export const EXPERIENCE = [
  { when: 'Oct 2026 – now', role: 'IIoT Solutions Engineer', org: 'Lockheed Martin',
    text: 'Digital transformation for IIoT in production manufacturing: dashboard analytics UX for business-area insights, integrated into an AWS cloud solution set.' },
  { when: '2025 – now', role: 'Software Engineer Intern', org: 'UCF Transfer Connect',
    text: 'Automated Excel lookups across 40,000+ cells, cut inconsistency detection time 50%+ across 300+ files, and shipped a tool that processes 3,000+ data points in seconds.' },
  { when: 'Jan – May 2026', role: 'Data Science Research Intern', org: 'Spatial Analysis Lab',
    text: 'Python statistics and modeling on how natural disasters affect resource availability; co-authored a research paper.' },
  { when: 'Dec 2025 – Jan 2026', role: 'Software Development Research Intern', org: 'METIL Lab',
    text: 'Engineered a $15.8k defense proposal for autonomous-drone collisions, sponsored by Oak Ridge National Laboratory, with a Python/PyTorch and ROS 2 pipeline.' },
];

export const MOMENTS = [
  { when: 'Oct 2026', what: 'Knight Hacks IX', note: 'UCF · 700+ hackers' },
  { when: 'Sep 2026', what: 'ShellHacks', note: 'FIU · 1,200+ hackers' },
  { when: '2026', what: 'HackSTEM Innovation Program', note: 'Siemens Energy · 16 weeks' },
  { when: 'Aug 2026', what: 'Industry shadows', note: 'RF-Smart and US Hunger, via Knight Shadow' },
  { when: 'Dec 2025', what: 'I/ITSEC', note: 'Conference attendee' },
  { when: 'Nov 2025', what: 'BSides Jax organizer', note: '15+ volunteers, 250+ attendees' },
  { when: 'Oct 2025', what: 'Knight Hacks VIII', note: 'First hackathon, became team lead' },
  { when: 'Oct 2025', what: 'Horse Plinko', note: 'Led a 4-person blue team' },
];

export const EDUCATION = [
  { school: 'University of Central Florida', degree: 'B.S. Computer Science', detail: 'Intelligent Robotic Systems', when: '2025 – Dec 2027 (expected)' },
  { school: 'Florida Atlantic University', degree: 'A.S. Computer Science', detail: 'Dean’s List, Dec 2024', when: '2022 – 2024' },
];
export const AWARDS = ['Knight Research Scholar · UCF, 2026', 'T-LEARN Scholar · UCF, 2026', 'Florida Bright Futures Scholar', 'AI for Work and Life · UNF, 2025'];
export const COURSEWORK = ['Data Structures & Algorithms I & II', 'Object-Oriented Programming', 'Robot Vision', 'Cyber Defense Analysis', 'Entrepreneurship for Defense', 'Managing IT Integration'];
export const ORGS = ['UCF STEM Ambassador', 'Hack@UCF organizer', 'Girls Who Code', 'BSides Florida organizer', 'WEECS', 'Knight Research Scholars'];

// Stills from katrinaadewale.dev's "What I've been watching" shelf.
export const SHOWS = [
  { title: 'Howl’s Moving Castle', image: 'howls-moving-castle' },
  { title: 'One Piece', image: 'one-piece' },
  { title: 'Fantastic Mr. Fox', image: 'fantastic-mr-fox' },
  { title: 'Breaking Bad', image: 'breaking-bad' },
  { title: 'Everything Everywhere All at Once', image: 'everything-everywhere' },
  { title: 'Death Note', image: 'death-note' },
  { title: 'Bob’s Burgers', image: 'bobs-burgers' },
  { title: 'Parasite', image: 'parasite' },
  { title: 'Attack on Titan', image: 'attack-on-titan' },
  { title: 'The White Lotus', image: 'the-white-lotus' },
  { title: 'Harry Potter', image: 'harry-potter' },
  { title: 'Alice in Borderland', image: 'alice-in-borderland' },
  { title: 'Beef', image: 'beef' },
];

export const OFF_CLOCK = {
  text: 'If I’m not coding, I’m listening to music, dancing, or cooking for my friends.',
  stage: 'I’ve seen Wicked, The Lion King and Maybe Happy Ending on Broadway. Three years of theater, a Drama Award in middle school, and Mamma Mia in high school.',
  places: [
    { name: 'New York City', image: 'nyc' },
    { name: 'Spain', image: 'madrid' },
    { name: 'Hawaii', image: 'hawaii' },
  ],
  more: 'California and Maine too. A travel blog is on the way.',
};

// The tech-stack blocks from github.com/kateye31 (shields.io badges, saved in assets/badges).
export const BADGES = ['python', 'typescript', 'javascript', 'java', 'c', 'cpp', 'r', 'html5', 'css', 'latex', 'powershell', 'react', 'next-js', 'nodejs', 'threejs', 'gsap', 'pytorch', 'aws', 'amazondynamodb', 'git', 'visual-studio-code', 'notepad', 'blender', 'figma', 'canva', 'sketch-up']
  .map(file => ({ file }));

// From the "What's on my shelf" corner of katrinaadewale.dev.
export const BOOKS = [
  ['Dune', 'Frank Herbert', 'dune'], ['1984', 'George Orwell', '1984'], ['Things Fall Apart', 'Chinua Achebe', 'things-fall-apart'],
  ['The Pragmatic Programmer', 'David Thomas & Andrew Hunt', 'pragmatic-programmer'], ['Fundamentals of Character Design', '3dtotal Publishing', 'fundamentals-of-character-design'],
  ['A Doll’s House', 'Henrik Ibsen', 'a-dolls-house'], ['And Then There Were None', 'Agatha Christie', 'and-then-there-were-none'],
  ['Wuthering Heights', 'Emily Brontë', 'wuthering-heights'], ['The Lord of the Rings', 'J.R.R. Tolkien', 'lord-of-the-rings'],
  ['The Hunger Games', 'Suzanne Collins', 'hunger-games'], ['Harry Potter and the Prisoner of Azkaban', 'J.K. Rowling', 'prisoner-of-azkaban'],
].map(([title, author, image]) => ({ title, author, image }));

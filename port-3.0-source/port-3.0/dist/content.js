// Every fact here comes from katrinaadewale.dev or the résumé. Project covers
// are Unsplash photos (assets/photos/CREDITS.txt), not screenshots.
export const LINKS = Object.freeze({
  email: 'katwale797@gmail.com',
  github: 'https://github.com/kateye31',
  linkedin: 'https://linkedin.com/in/katrina-adewale',
  resume: 'assets/katrina-adewale-resume.pdf',
});

export const ABOUT = {
  lede: 'Hi, I’m Katrina! I’m a software engineer who also designs, writes, and can’t walk past a cat.',
  body: [
    'I’m at UCF studying Computer Science with a minor in Intelligent Robotic Systems. I’m also a STEM Ambassador, so I get to visit schools around Orlando and show kids that engineering is actually fun.',
    'I say yes to a lot: clubs, hackathons, organizing things (somehow I keep ending up team lead), and any trip I can afford. The world is big and I’d like to see most of it.',
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
// what plays on the desk monitor: demo videos (from my site GIFs), the
// Phantom Wall YouTube thumbnail, or a screenshot. Unsplash only where no
// screenshot exists yet.
export const PROJECTS = [
  { id: 'fireline', title: 'Fireline', featured: true, wins: 2, award: '1st + 3rd place', when: 'Knight Hacks IX · Oct 2026',
    media: { image: 'assets/projects/fireline.webp' }, tags: ['NVIDIA Jetson', 'YOLO + TensorRT', 'ESP32', 'FastAPI', 'React'],
    text: 'Awarded 1st and 3rd place at Knight Hacks IX. Fireline is a set of tree-mounted camera units that spot wildfire smoke right on the device, out in forests with no power or internet, then send a single alert of 340 bytes or less over satellite.',
    links: [['GitHub', 'https://github.com/kateye31/fireline']], note: 'Demo video coming soon.',
    photos: [
      { image: 'kh-team.webp', caption: 'the team + our prototype', alt: 'Katrina and the Fireline team at Knight Hacks IX holding the tree-mounted camera prototype' },
      { image: 'kh-oneethos.webp', caption: 'on stage with OneEthos', alt: 'The Fireline team on stage with the OneEthos judges at Knight Hacks IX' },
    ] },
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
  { id: 'cloud', title: 'Cloud Media Processor', when: 'Nov 2025',
    media: { image: 'assets/photos/cloud.webp' }, tags: ['AWS Lambda', 'S3', 'Rekognition'],
    text: 'A serverless AWS pipeline that processes video uploads, generates thumbnails and detects content. My first step into the cloud.' },
];

export const EXPERIENCE = [
  { when: 'Oct 2026 – now', role: 'IIoT Solutions Engineer', org: 'Lockheed Martin', logo: 'lockheed-martin.png',
    text: 'Digital transformation for IIoT in production manufacturing: dashboard analytics UX for business-area insights, integrated into an AWS cloud solution set.' },
  { when: 'Sept 2026 – now', role: 'Engineering Ambassador', org: 'UCF Center for Initiatives in STEM (iSTEM) · Orlando, FL', logo: 'stem.webp',
    text: 'Representing UCF Computer Science at 5+ K-12 school visits and campus events, reaching 6,000+ students.' },
  { when: 'Aug 2025 – now', role: 'Software Engineer Intern', org: 'UCF Transfer Connect', logo: 'ucf.png',
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
// Logos from katrinaadewale.dev (assets/orgs).
export const ORGS = [
  { name: 'UCF STEM Ambassador', logo: 'stem', bg: '#FFFFFF' },
  { name: 'Girls Who Code', logo: 'gwc', bg: '#2FA294' },
  { name: 'BSides Florida organizer', logo: 'bsides', bg: '#FFFFFF' },
  { name: 'WEECS', logo: 'weecs', bg: '#F2B8CE' },
  { name: 'Knight Research Scholars', logo: 'krs', bg: '#1E1631' },
];

// Stills from my old site’s "What I've been watching" shelf.
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
  playbills: [
    { show: 'Wicked', theatre: 'Gershwin Theatre', image: 'wicked' },
    { show: 'Maybe Happy Ending', theatre: 'Belasco Theatre', image: 'maybe-happy-ending' },
    { show: 'Hadestown', theatre: 'Walter Kerr Theatre', image: 'hadestown' },
  ],
  places: [
    { name: 'NYC', image: 'trip-nyc' },
    { name: 'Madrid', image: 'trip-madrid' },
    { name: 'Washington DC', image: 'trip-dc' },
    { name: 'Hawaii', image: 'trip-hawaii' },
    { name: 'San Diego, California', image: 'trip-san-diego' },
  ],
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

// "What's on the radio" from katrinaadewale.dev. Covers in assets/albums.
export const ALBUMS = [
  ['Eternal Sunshine', 'Ariana Grande', 'eternal-sunshine'], ['Hit Me Hard and Soft', 'Billie Eilish', 'hit-me-hard-and-soft'],
  ['AM', 'Arctic Monkeys', 'am'], ['Parachutes', 'Coldplay', 'parachutes'], ['ANTI', 'Rihanna', 'anti'],
  ['Doo-Wops & Hooligans', 'Bruno Mars', 'doo-wops-hooligans'], ['OK Computer', 'Radiohead', 'ok-computer'],
  ['Demon Days', 'Gorillaz', 'demon-days'], ['Californication', 'Red Hot Chili Peppers', 'californication'],
  ['The Best of Sade', 'Sade', 'the-best-of-sade'], ['Never for Ever', 'Kate Bush', 'never-for-ever'],
  ['The Stranger', 'Billy Joel', 'the-stranger'], ['Uprising', 'Bob Marley & The Wailers', 'uprising'],
  ['Hatful of Hollow', 'The Smiths', 'hatful-of-hollow'], ['The Eminem Show', 'Eminem', 'the-eminem-show'],
  ['Stankonia', 'OutKast', 'stankonia'], ['In Between Dreams', 'Jack Johnson', 'in-between-dreams'],
  ['Songs About Jane', 'Maroon 5', 'songs-about-jane'], ['Third Eye Blind', 'Third Eye Blind', 'third-eye-blind'],
  ['The Lumineers', 'The Lumineers', 'the-lumineers'], ['All I Want Is You', 'Miguel', 'all-i-want-is-you'],
].map(([title, artist, image]) => ({ title, artist, image }));

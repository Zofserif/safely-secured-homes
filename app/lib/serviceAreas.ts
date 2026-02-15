export type ServiceAreaFaq = {
  question: string;
  answer: string;
};

export type ServiceAreaConfig = {
  slug: string;
  name: string;
  region: string;
  primaryKeywords: string[];
  introCopy: string;
  serviceProof: string[];
  useCases: string[];
  faq: ServiceAreaFaq[];
  nearbyCities: string[];
  internalLinks: Array<{ label: string; href: string }>;
};

export const SERVICE_AREAS: ServiceAreaConfig[] = [
  {
    slug: "metro-manila",
    name: "Metro Manila",
    region: "NCR",
    primaryKeywords: [
      "CCTV installation Metro Manila",
      "home security system Metro Manila",
      "smart home security NCR",
    ],
    introCopy:
      "Need dependable CCTV installation in Metro Manila? We design practical, privacy-first camera and smart-security setups for condos, townhouses, and family homes across NCR.",
    serviceProof: [
      "Structured camera layouts for entry points, elevators, and shared corridors.",
      "Bandwidth-aware setup that keeps remote work and streaming stable.",
      "Clear handover so every family member can use the system confidently.",
    ],
    useCases: [
      "Condo unit entry monitoring and package-delivery visibility.",
      "Townhouse blind-spot coverage for side access and parking.",
      "Family alert setup for children arriving home from school.",
    ],
    faq: [
      {
        question: "Can you install in condo buildings with admin restrictions?",
        answer:
          "Yes. We plan around building rules and use placements that meet admin policies while keeping key areas covered.",
      },
      {
        question: "Will 24/7 recording slow down our internet?",
        answer:
          "We tune bitrate, recording mode, and remote access settings so your cameras stay reliable without disrupting daily internet use.",
      },
    ],
    nearbyCities: [
      "Quezon City",
      "Makati",
      "Pasig",
      "Taguig",
      "Manila",
    ],
    internalLinks: [
      { label: "Luzon Service Hub", href: "/service-areas/luzon-cctv-installation" },
      { label: "Read the Security Blog", href: "/blog" },
      { label: "Start Your Free Plan", href: "/form" },
    ],
  },
  {
    slug: "laguna",
    name: "Laguna",
    region: "CALABARZON",
    primaryKeywords: [
      "CCTV installation Laguna",
      "home security Laguna",
      "smart CCTV setup Calamba Santa Rosa",
    ],
    introCopy:
      "We help Laguna homeowners build calm, practical security setups with CCTV, smart alerts, and reliable monitoring tailored to family routines.",
    serviceProof: [
      "Entry-first camera planning for subdivisions and gated communities.",
      "Night-visibility setup tuned for driveways and perimeter walls.",
      "Simple app walkthrough for parents, helpers, and seniors.",
    ],
    useCases: [
      "Covering main gate plus side access in subdivision homes.",
      "Monitoring driveway and garage for daily arrivals.",
      "Verifying school pick-up and delivery activity remotely.",
    ],
    faq: [
      {
        question: "Do you recommend cloud or local storage in Laguna homes?",
        answer:
          "For most families, we prioritize local storage for privacy and predictable costs, then add cloud backup only when needed.",
      },
      {
        question: "Can you improve existing camera setups?",
        answer:
          "Yes. We audit current placements, fix blind spots, and reconfigure recording and alerts before recommending new hardware.",
      },
    ],
    nearbyCities: ["Calamba", "Santa Rosa", "San Pablo", "Biñan", "Cabuyao"],
    internalLinks: [
      { label: "Luzon Service Hub", href: "/service-areas/luzon-cctv-installation" },
      { label: "Quezon Service Page", href: "/service-areas/quezon" },
      { label: "Book a Security Call", href: "/schedule-call" },
    ],
  },
  {
    slug: "quezon",
    name: "Quezon",
    region: "CALABARZON",
    primaryKeywords: [
      "CCTV installation Quezon",
      "home security Candelaria Quezon",
      "smart home security Quezon Province",
    ],
    introCopy:
      "From Candelaria to nearby Quezon towns, we design CCTV and smart-home security plans that focus on real household routines, not overcomplicated setups.",
    serviceProof: [
      "On-site layout review focused on practical family movement paths.",
      "Weather-aware camera placement and lighting recommendations.",
      "After-install support to keep your system working long-term.",
    ],
    useCases: [
      "Securing large family compounds with multiple entry paths.",
      "Balancing indoor privacy and outdoor perimeter coverage.",
      "Improving incident evidence quality for local reporting.",
    ],
    faq: [
      {
        question: "Do you serve both town centers and nearby barangays?",
        answer:
          "Yes. We work across Quezon serviceable areas and adapt the plan to your access, lighting, and connectivity conditions.",
      },
      {
        question: "What is included after installation?",
        answer:
          "You get system walkthrough, usage guidance, and support so your setup remains useful beyond day-one installation.",
      },
    ],
    nearbyCities: ["Candelaria", "Lucena", "Sariaya", "Tayabas", "Tiaong"],
    internalLinks: [
      { label: "Luzon Service Hub", href: "/service-areas/luzon-cctv-installation" },
      { label: "Laguna Service Page", href: "/service-areas/laguna" },
      { label: "Apply for a Custom Plan", href: "/apply" },
    ],
  },
  {
    slug: "cavite",
    name: "Cavite",
    region: "CALABARZON",
    primaryKeywords: [
      "CCTV installation Cavite",
      "home security system Cavite",
      "smart camera setup Imus Dasmariñas",
    ],
    introCopy:
      "We help Cavite families secure gates, side access, and shared spaces with practical CCTV installation and smart-home security that is easy to manage day to day.",
    serviceProof: [
      "Coverage mapping for townhouse clusters and detached homes.",
      "Smart alert tuning to reduce false notifications.",
      "Clear recommendations aligned to budget and home size.",
    ],
    useCases: [
      "Monitoring front gate activity and delivery drop-offs.",
      "Protecting garage and perimeter corners at night.",
      "Coordinating family alerts during work and school hours.",
    ],
    faq: [
      {
        question: "How many cameras are usually enough for Cavite homes?",
        answer:
          "It depends on layout. We usually start with essential choke points, then scale only where blind spots remain.",
      },
      {
        question: "Can smart locks and cameras be integrated together?",
        answer:
          "Yes. We can unify camera views, lock status, and notifications into a simpler control flow.",
      },
    ],
    nearbyCities: ["Imus", "Dasmariñas", "Bacoor", "General Trias", "Tagaytay"],
    internalLinks: [
      { label: "Luzon Service Hub", href: "/service-areas/luzon-cctv-installation" },
      { label: "Metro Manila Service Page", href: "/service-areas/metro-manila" },
      { label: "Start Free Security Plan", href: "/form" },
    ],
  },
  {
    slug: "rizal",
    name: "Rizal",
    region: "CALABARZON",
    primaryKeywords: [
      "CCTV installation Rizal",
      "home security Rizal Province",
      "smart security Antipolo Cainta",
    ],
    introCopy:
      "For homes in Rizal, we build camera and smart-security setups that keep families informed without adding stress to daily life.",
    serviceProof: [
      "Terrain-aware placement for sloped driveways and split-level homes.",
      "Night coverage planning for low-light exterior zones.",
      "Practical maintenance guidance for long-term reliability.",
    ],
    useCases: [
      "Monitoring main road-facing gates and side approaches.",
      "Checking elderly family safety while away from home.",
      "Reviewing incidents quickly with organized playback.",
    ],
    faq: [
      {
        question: "Do you provide recommendations for lighting plus CCTV?",
        answer:
          "Yes. Lighting and camera placement are planned together because poor lighting can reduce video quality.",
      },
      {
        question: "Can you train non-technical family members?",
        answer:
          "Yes. We focus on simple controls and clear routines so everyone can use the system confidently.",
      },
    ],
    nearbyCities: ["Antipolo", "Cainta", "Taytay", "Rodriguez", "Binangonan"],
    internalLinks: [
      { label: "Luzon Service Hub", href: "/service-areas/luzon-cctv-installation" },
      { label: "Metro Manila Service Page", href: "/service-areas/metro-manila" },
      { label: "Read Security Guides", href: "/blog" },
    ],
  },
  {
    slug: "batangas",
    name: "Batangas",
    region: "CALABARZON",
    primaryKeywords: [
      "CCTV installation Batangas",
      "home security Batangas Province",
      "smart CCTV Lipa Batangas City",
    ],
    introCopy:
      "Batangas families trust practical, durable CCTV and smart-home setups that cover key access points and keep response steps clear for everyone at home.",
    serviceProof: [
      "Heat and weather-aware recommendations for outdoor hardware.",
      "Coverage design for wider lots and mixed indoor/outdoor zones.",
      "Setup walkthrough focused on daily family use.",
    ],
    useCases: [
      "Securing driveways, gate entries, and perimeter access.",
      "Improving visibility for store-front or home-based business areas.",
      "Keeping children and seniors safer with timely alerts.",
    ],
    faq: [
      {
        question: "Is remote monitoring stable for families who travel often?",
        answer:
          "Yes, with proper network setup and recording strategy. We configure for reliable remote access and useful alerting.",
      },
      {
        question: "Can installations be phased by budget?",
        answer:
          "Yes. We prioritize high-impact zones first, then schedule expansion in stages based on budget.",
      },
    ],
    nearbyCities: ["Lipa", "Batangas City", "Tanauan", "Santo Tomas", "Nasugbu"],
    internalLinks: [
      { label: "Luzon Service Hub", href: "/service-areas/luzon-cctv-installation" },
      { label: "Cavite Service Page", href: "/service-areas/cavite" },
      { label: "Apply for a Personalized Plan", href: "/apply" },
    ],
  },
];

export const SERVICE_AREA_HUB_PATH = "/service-areas/luzon-cctv-installation";

export const getServiceAreaBySlug = (slug: string) =>
  SERVICE_AREAS.find((area) => area.slug === slug);

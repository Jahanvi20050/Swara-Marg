// ---- Hardcoded mock data (swap for real NSQF/MSME data later) ----
const COURSES = [
  { name: "Solar Panel Installation & Repair — NSQF L3", skills: ["electrical", "solar", "wiring", "repair"], center: "MSME Kalyanpur", district: "Samastipur" },
  { name: "Basic Plumbing & Pipe Fitting — NSQF L2",       skills: ["plumbing", "pipe fitting", "repair"],     center: "GIA Center Rosera", district: "Samastipur" },
  { name: "Tailoring & Garment Making — NSQF L2",          skills: ["tailoring", "stitching", "sewing"],       center: "GIA Center Hajipur", district: "Vaishali" },
  { name: "Welding & Fabrication — NSQF L3",               skills: ["welding", "fabrication", "metal work"],   center: "MSME Muzaffarpur", district: "Muzaffarpur" },
  { name: "Two-Wheeler Repair & Servicing — NSQF L2",      skills: ["mechanic", "repair", "engine"],           center: "GIA Center Darbhanga", district: "Darbhanga" },
];

const JOB_DEMAND = [
  { district: "Samastipur", trade: "electrical", openings: 22 },
  { district: "Samastipur", trade: "plumbing", openings: 15 },
  { district: "Vaishali", trade: "tailoring", openings: 9 },
  { district: "Muzaffarpur", trade: "welding", openings: 18 },
  { district: "Darbhanga", trade: "mechanic", openings: 12 },
];

const submissions = [];

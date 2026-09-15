// ---- Skill overlap + district-matching logic ----
function matchCourse(skills, district) {
  let best = null;
  let bestScore = -1;
  for (const c of COURSES) {
    const overlap = c.skills.filter(s => skills.some(us => us.includes(s) || s.includes(us))).length;
    const districtBonus = c.district.toLowerCase() === (district || "").toLowerCase() ? 2 : 0;
    const score = overlap + districtBonus;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  const demand = JOB_DEMAND.find(
    j => j.district.toLowerCase() === (district || "").toLowerCase() &&
         best && best.skills.includes(j.trade)
  );
  return { course: best, demand };
}

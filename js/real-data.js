// real-data.js
// Real, sourced data about EduSpots' network and safeguarding programme.
// Individual Catalyst names, training dates, and compliance statuses are
// entirely synthetic — none of that is public data, nor should it ever be.

const REAL_REGIONAL_COORDINATORS = [
  { id: "rc1", name: "Cynthia Mawuena Tetteh", region: "Volta Region" },
  { id: "rc2", name: "Getrude Akunlibe",       region: "Northern Region" },
  { id: "rc3", name: "Abdul Wadud Suleiman",   region: "Central/Western Regions" },
  { id: "rc4", name: "Abdul-Malik Iddrisu",    region: "New Spots" },
]; // source: https://eduspots.org/about-us/team/

const REAL_SPOT_NAMES = [
  "Aboabo No.4", "Abofour", "Abutia", "Agbledomi", "Ahenkro", "Akumadan",
  "Ameyaw", "Asemasa", "Atanve", "Banda Kabrono", "Bimbilla", "Bono Manso",
  "Bosomadwe", "Dadwen", "Dodome Awuiasu", "Donkorkrom", "Dulugu",
  "Dzemeni", "Ejura", "Fiave", "Gbintiri", "Gushegu", "Gwolu", "Huhunya",
  "Juaben", "Kasoa", "Kete Krachi", "Kingtampo", "Kpandai", "Kpassa",
  "Kpeve", "Kumbungu", "Kwamoso", "Kyekyewere", "Mampong", "Mankrong",
  "Mpasatia", "Nkwanta", "Ntonso", "Nyamebekyere", "Odumase", "Offinso",
  "Otaakrom", "Prang", "Saaman", "Salaga", "Sandema",
  "Soko", "Takuve", "Teshie", "Wodome", "Yamfo", "Zangbalun",
]; // source: https://eduspots.org/ — 49+ individually named Spots

// Real, published safeguarding programme description (policy-level only,
// no compliance statistics) — source: eduspots.org
const REAL_SAFEGUARDING_PROGRAMME = {
  name: "Keeping Spots Safe",
  description: "A community-rooted approach to safeguarding centering care, trust, and youth voice rather than a policy checklist. All Catalysts and headteachers complete training and are expected to understand the policy.",
  source: "https://eduspots.org/education-hub/keeping-spots-safe/",
  note: "Programme description only. Any outcome metrics from evaluations are sampled results, not network-wide compliance rates — do not present them as such.",
};

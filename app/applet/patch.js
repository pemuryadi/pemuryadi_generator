const fs = require('fs');
let code = fs.readFileSync('./src/constants.ts', 'utf8');

// 1. replace in subjectsByLevel
code = code.replace(/{ id: 'seni-budaya', label: 'Seni Budaya' }/g, 
  `{ id: 'seni-rupa', label: 'Seni Rupa' },
    { id: 'seni-musik', label: 'Seni Musik' },
    { id: 'seni-tari', label: 'Seni Tari' },
    { id: 'seni-teater', label: 'Seni Teater' }`);

// 2. mapelNames
code = code.replace(/'seni': 'Seni Rupa',/g, 
  `'seni-rupa': 'Seni Rupa',
  'seni-musik': 'Seni Musik',
  'seni-tari': 'Seni Tari',
  'seni-teater': 'Seni Teater',`);

// 3. cpData for seni-rupa
const cpSeniRupa = `
  'seni-rupa': {
      A: '1. Mengalami (Experiencing) Mengenali dan menyebutkan unsur-unsur rupa dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengenali dan menguji coba alat dan/atau bahan yang dimiliki. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan hasil pengamatan terhadap lingkungan sekitar. 5. Berdampak (Impacting) Menghasilkan karya seni rupa yang berdampak pada perasaan dirinya.',
      B: '1. Mengalami (Experiencing) Mengidentifikasi unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengenali dan menguji coba alat dan/atau bahan yang dimiliki serta prosedur penggunaannya. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan hasil pengamatan terhadap lingkungan sekitar. 5. Berdampak (Impacting) Menghasilkan karya seni rupa yang berdampak pada perasaan atau mewakili harapannya.',
      C: '1. Mengalami (Experiencing) Menjelaskan unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengenali dan menguji coba variasi teknik penggunaan alat dan/atau bahan. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar melalui pengembangan imajinasi. 5. Berdampak (Impacting) Menghasilkan karya seni rupa yang mewakili minatnya.',
      D: '1. Mengalami (Experiencing) Menganalisis unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan dan mengapresiasi karya diri sendiri dan teman sekelas; membandingkan unsur rupa, prinsip desain, dan fungsi karya seni rupa menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengaplikasikan variasi teknik penggunaan alat dan bahan yang dimiliki untuk berkarya; mengeksplorasi alternatif/potensi alat dan bahan yang ada di lingkungan sekitar. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar, dengan mempertimbangkan fungsi, menggunakan gaya atau teknik yang telah dipelajari. 5. Berdampak (Impacting) Menghasilkan karya seni rupa untuk merespon pengalaman sehari-hari dan mengekspresikan perasaan atau minat.',
      E: '1. Mengalami (Experiencing) Mengeksplorasi unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan penggunaan unsur rupa, prinsip desain, dan fungsi dalam karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Mengeksplorasi alternatif/potensi alat dan bahan yang ada di lingkungan sekitar dan menghubungkan seni dengan kelompok atau bidang keilmuan lain dalam berkarya seni rupa. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar, dengan mempertimbangkan fungsi, menggunakan gaya atau teknik yang dipilih. 5. Berdampak (Impacting) Menghasilkan karya seni rupa untuk mengajak orang lain, merespon pengalaman sehari-hari, dan mengekspresikan perasaan atau minat.',
      F: '1. Mengalami (Experiencing) Mengeksplorasi penggunaan unsur rupa dan prinsip desain dalam benda-benda di sekitar/karya seni rupa. 2. Merefleksikan (Reflecting) Merefleksikan penggunaan unsur rupa, prinsip desain, dan fungsi dalam karya diri sendiri dan teman sekelas menggunakan kosa kata seni rupa yang sesuai. 3. Berpikir dan Bekerja Artistik (Thinking and Working Artistically) Menganalisis potensi alat dan bahan yang ada di lingkungan sekitar dan keterhubungan seni rupa dengan kelompok atau bidang keilmuan lain dalam berkarya. 4. Menciptakan (Making/Creating) Membuat karya seni rupa berdasarkan pengalaman dan/atau hasil pengamatan terhadap lingkungan sekitar, dengan mempertimbangkan fungsi, menggunakan gaya atau teknik yang dikuasai. 5. Berdampak (Impacting) Menghasilkan karya seni rupa untuk mengajak orang lain, merespon pengalaman sehari-hari, mengekspresikan perasaan, minat, dan/atau isu sosial dalam masyarakat.'
  },
  'bahasa-indonesia':`;
code = code.replace(/'bahasa-indonesia':/g, cpSeniRupa);

// mapel descriptions to be read in prompt
const desc = `export const mapelDescriptions: Record<string, string> = {
  'seni-rupa': 'Fokus pada eksplorasi bentuk, warna, garis, dan tekstur melalui kegiatan menggambar, melukis, seni patung, grafis, desain komunikasi visual, maupun kerajinan tangan (kriya).',
  'seni-musik': 'Mencakup eksplripsi bunyi, vokal, alat musik, dan apresiasi musik, baik tradisional maupun modern.',
  'seni-tari': 'Berfokus pada gerak tubuh yang estetis, ekspresif, dan berirama, yang mencakup tari tradisional maupun kreasi baru.',
  'seni-teater': 'Meliputi kegiatan akting, olah tubuh, vokal, pementasan drama, dan pemahaman unsur-unsur pertunjukan'
};

export const topicsBySubject`;
code = code.replace(/export const topicsBySubject/g, desc);

fs.writeFileSync('./src/constants.ts', code);

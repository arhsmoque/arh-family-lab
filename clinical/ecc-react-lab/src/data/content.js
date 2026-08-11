export const CONTENT = {
  en: {
    header: {
      title: "ECC CPG Interactive",
      subtitle: "Klinik Pergigian Dato Keramat",
    },
    hero: {
      eyebrow: "Clinical Practice Guideline",
      title: "Management of Early Childhood Caries",
      subtitle:
        "An interactive teaching companion for the Malaysian CPG on Early Childhood Caries (ECC). Explore risk factors, clinical progression, prevention strategies, and treatment pathways.",
      meta: [
        "CPG MX of ECC",
        "Dr. Nur Diyana Ramli",
        "KKM Malaysia",
      ],
    },
    nav: [
      { id: "intro", label: "Introduction" },
      { id: "risk", label: "Risk & Protection" },
      { id: "exam", label: "Examination" },
      { id: "prevent", label: "Prevention" },
      { id: "treat", label: "Treatment" },
      { id: "home", label: "Take Home" },
    ],
    intro: {
      title: "Introduction",
      subtitle: "What is Early Childhood Caries?",
      definition: {
        title: "Definition",
        text:
          "The presence of one or more primary teeth with carious lesions (cavitated or non-cavitated), missing due to caries, or filled surfaces in a child under six years of age (72 months).",
      },
      severe: {
        title: "Severe ECC by Age",
        rows: [
          { age: "\u003c 3 years", criteria: "Any signs of smooth-surface caries" },
          { age: "3 years", criteria: "dmf ≥ 4" },
          { age: "4 years", criteria: "dmf ≥ 5" },
          { age: "5 years", criteria: "dmf ≥ 6" },
        ],
      },
      epidemiology: {
        title: "Epidemiology in Malaysia",
        text:
          "The National Oral Health Survey of Preschool Children (NOHPS) reports a downward trend in caries prevalence among preschool children:",
        stats: [
          { value: "71.2%", label: "Prevalence in 2015" },
          { value: "4.8", label: "Mean dft in 2015" },
          { value: "\u003C 6 years", label: "Age definition" },
        ],
      },
      progression: {
        title: "Clinical Progression",
        stages: [
          {
            key: "sound",
            label: "Sound enamel",
            desc: "Healthy enamel with no visible plaque or discolouration.",
            note: "Point out the smooth, shiny enamel and healthy gingival margin.",
          },
          {
            key: "plaque",
            label: "Plaque accumulation",
            desc: "Soft, glutinous plaque collects at the gingival margin — the earliest visible sign.",
            note: "Check the gingival margin first, especially on the upper anterior teeth.",
          },
          {
            key: "white",
            label: "White spot lesion",
            desc: "Chalky white band beneath plaque; enamel is demineralising but still reversible.",
            note: "Emphasise reversibility with fluoride varnish and supervised brushing.",
          },
          {
            key: "brown",
            label: "Brown spot lesion",
            desc: "The demineralised band darkens to brown or tan as enamel breakdown continues.",
            note: "Discuss caries risk assessment and stepping up recall frequency.",
          },
          {
            key: "cavity",
            label: "Cavitated lesion",
            desc: "The enamel surface has broken down into a cavity; restorative treatment is now required.",
            note: "Link to non-invasive versus invasive management options in the CPG.",
          },
        ],
      },
    },
    risk: {
      title: "Risk & Protective Factors",
      subtitle: "Causes and defences against ECC",
      riskTitle: "Main Risk Factors",
      risks: [
        { title: "Feeding practices", detail: "Breastfeeding and/or bottle feeding, including on-demand or overnight feeding, are recognised risk factors for ECC." },
        { title: "Dietary sugars", detail: "Frequency and type of sugar exposure drive cariogenic bacterial activity at the tooth surface." },
        { title: "Oral microbiome", detail: "Early acquisition of cariogenic bacteria such as S. mutans and lactobacilli shapes a child’s caries risk." },
        { title: "Poor oral hygiene practices", detail: "Inconsistent or absent supervised toothbrushing allows plaque and the lesions it causes to persist." },
        { title: "Lack of protective factors", detail: "No fluoride toothpaste or varnish application significantly increases ECC risk." },
      ],
      protectiveTitle: "Protective Factors",
      protective: [
        { title: "Protective diet", detail: "Milk and cheese mitigate metabolic acids and lower plaque acidity. Whole fruit (OR 0.47) and milk (OR 0.50) are associated with reduced ECC risk." },
        { title: "Saliva", detail: "Saliva provides physical buffering, chemical neutralisation of plaque pH, rinsing of food debris, and antibacterial action that favours remineralisation." },
        { title: "Fluoride exposure", detail: "Use of fluoride toothpaste (1000–1500 ppm) and professional fluoride varnish are core protective strategies." },
      ],
    },
    exam: {
      title: "Examination & Diagnosis",
      subtitle: "Detecting and assessing ECC",
      methods: [
        {
          title: "Visual Examination",
          text: "The standard method for caries diagnosis. Perform under a good light source on clean, dry teeth. Look for white-spot lesions, brown discolouration, and cavitation.",
          tag: "Primary diagnostic tool",
        },
        {
          title: "Radiographic Examination",
          text: "Used as an adjunct. Bitewing radiography improves detection of proximal dentinal caries when surfaces cannot be visualised or probed.",
          tag: "Adjunct",
        },
        {
          title: "ICDAS",
          text: "The International Caries Detection and Assessment System provides a structured visual scoring framework to classify caries severity consistently.",
          tag: "Structured scoring",
        },
      ],
      keyConsideration:
        "History-taking is essential before examination. Patients without disease signs and with open proximal contacts may not require radiographs at the first visit.",
    },
    prevention: {
      title: "Prevention of ECC",
      subtitle: "Evidence-based strategies",
      diet: {
        title: "Diet Advice & Plaque Control",
        text: "Start oral hygiene counselling at tooth eruption. Brush twice daily with an age-appropriate amount of 1000–1500 ppm fluoride toothpaste. Supervise brushing until at least seven years of age. Spit, do not rinse.",
      },
      ohe: {
        title: "Oral Health Education & Behavioural Intervention",
        text: "Provide oral health education to pregnant women, new mothers, and caregivers. Motivational interviewing and anticipatory guidance improve prevention outcomes, especially for high-risk families.",
      },
      professional: {
        title: "Professional Prevention",
        text: "Caries risk assessment should be performed for every child aged six and below. Apply sodium fluoride varnish (5%) six-monthly, or difluorsilane (0.9%) three-monthly, based on risk status.",
      },
      recommendations: [
        { id: "R6", text: "Provide diet advice to pregnant women, new mothers, and primary caregivers.", level: "Recommendation 6" },
        { id: "R7", text: "Use mechanical plaque control with electric or manual toothbrushes; consider chemical agents as adjuncts.", level: "Recommendation 7" },
        { id: "R8", text: "Brush twice daily with 1000–1500 ppm fluoride toothpaste, supervised by an adult.", level: "Recommendation 8" },
        { id: "R9", text: "Provide oral health education to expectant mothers, new mothers, and caregivers.", level: "Recommendation 9" },
        { id: "R12", text: "Use motivational interviewing for parents of children at high caries risk.", level: "Recommendation 12" },
        { id: "R13", text: "Give anticipatory guidance to all parents and caregivers as early as after birth.", level: "Recommendation 13" },
        { id: "R14", text: "Perform caries risk assessment for all children aged six and below.", level: "Recommendation 14" },
        { id: "R15", text: "Apply 5% NaF varnish six-monthly or 0.9% difluorsilane three-monthly.", level: "Recommendation 15" },
      ],
    },
    treatment: {
      title: "Treatment",
      subtitle: "From non-invasive to invasive management",
      nonInvasive: {
        title: "Non-Invasive Methods",
        for: "For non-cavitated lesions, or cavitated lesions when treatment cannot be performed immediately:",
        items: [
          "Non-fluoride remineralising agents",
          "Fluoride remineralisation (topical application)",
          "Fissure sealant for pits and fissures",
          "Resin infiltration for proximal lesions",
          "Composite resin sealing as interim management",
        ],
      },
      invasive: {
        title: "Invasive Methods",
        for: "For cavitated lesions requiring intervention:",
        items: [
          "Stepwise excavation (SWE)",
          "Selective caries removal (SCR)",
          "Non-selective caries removal (NSCR)",
          "Pulp therapy when caries approaches or involves the pulp",
        ],
      },
    },
    home: {
      title: "Take Home Message",
      subtitle: "Core actions for frontline officers",
      officer: {
        title: "Frontline Officer Duties",
        items: [
          "Counsel caregivers on appropriate breastfeeding and bottle-feeding practices.",
          "Advise supervised toothbrushing twice daily with 1000–1500 ppm fluoride toothpaste.",
          "Educate on risk factors, protective factors, and early signs of ECC.",
          "Arrange dental appointments for professional fluoride varnish application.",
        ],
      },
      cra: {
        title: "Caries Risk Assessment & Recall",
        text: "Perform CRA for every child under six. Issue an LP1 appointment card based on risk stratification:",
        intervals: [
          { risk: "High risk", interval: "3 monthly" },
          { risk: "Moderate risk", interval: "6 monthly" },
          { risk: "Low risk", interval: "6–12 monthly" },
        ],
      },
      reminder:
        "Every contact with a child under six is an opportunity to assess risk, educate caregivers, and prevent disease progression. Prevention is always better than treatment.",
    },
    toothLab: {
      title: "Interactive Tooth Lab",
      subtitle: "Rotate, focus surfaces, and step through ECC progression",
      toothTypes: { incisor: "Incisor", canine: "Canine", molar: "Molar" },
      surface: {
        title: "Surface focus",
        options: {
          gingival: "Gingival margin",
          smooth: "Smooth surface",
          proximal: "Proximal",
          occlusal: "Pits & fissures",
        },
        detail: {
          gingival: "Gingival margin — where plaque collects first in ECC. Check at every visit, especially on the upper anterior teeth.",
          smooth: "Facial/buccal surfaces — visible on routine visual examination under good light.",
          proximal: "Between teeth — often requires bitewing radiographs, as it cannot be seen directly.",
          occlusal: "Pits and fissures — common site for fissure sealant placement in primary molars.",
        },
      },
      reset: "Reset",
      auto: "Auto play",
      stop: "Stop",
    },
    mouthMap: {
      title: "Primary Dentition Map",
      subtitle: "Mark ECC stages on the upper anterior teeth most commonly affected",
      modeTitle: "Select a stage, then click a tooth to mark it",
      legend: {
        sound: "Sound",
        white: "White spot",
        brown: "Brown spot",
        cavity: "Cavitated",
        filled: "Filled / treated",
        missing: "Missing (caries)",
      },
      reset: "Clear map",
      selected: "Selected teeth",
      none: "No teeth marked.",
    },
  },
  bm: {
    header: {
      title: "ECC CPG Interaktif",
      subtitle: "Klinik Pergigian Dato Keramat",
    },
    hero: {
      eyebrow: "Garis Panduan Amalan Klinikal",
      title: "Pengurusan Karies Kanak-Kanak Awal",
      subtitle:
        "Rakan pengajaran interaktif bagi Garis Panduan Amalan Klinikal Malaysia mengenai Karies Kanak-Kanak Awal (ECC). Terokai faktor risiko, perkembangan klinikal, strategi pencegahan, dan laluan rawatan.",
      meta: ["CPG MX of ECC", "Dr. Nur Diyana Ramli", "KKM Malaysia"],
    },
    nav: [
      { id: "intro", label: "Pengenalan" },
      { id: "risk", label: "Risiko & Perlindungan" },
      { id: "exam", label: "Pemeriksaan" },
      { id: "prevent", label: "Pencegahan" },
      { id: "treat", label: "Rawatan" },
      { id: "home", label: "Mesej Utama" },
    ],
    intro: {
      title: "Pengenalan",
      subtitle: "Apakah Karies Kanak-Kanak Awal?",
      definition: {
        title: "Definisi",
        text:
          "Kehadiran satu atau lebih gigi susu dengan lesi karies (berkaviti atau tanpa kaviti), hilang disebabkan karies, atau permukaan tampal pada kanak-kanak berumur bawah enam tahun (72 bulan).",
      },
      severe: {
        title: "ECC Teruk mengikut Umur",
        rows: [
          { age: "\u003C 3 tahun", criteria: "Sebarang tanda karies permukaan licin" },
          { age: "3 tahun", criteria: "dmf ≥ 4" },
          { age: "4 tahun", criteria: "dmf ≥ 5" },
          { age: "5 tahun", criteria: "dmf ≥ 6" },
        ],
      },
      epidemiology: {
        title: "Epidemiologi di Malaysia",
        text:
          "National Oral Health Survey of Preschool Children (NOHPS) melaporkan trend penurunan prevalens karies dalam kalangan kanak-kanak prasekolah:",
        stats: [
          { value: "71.2%", label: "Prevalens 2015" },
          { value: "4.8", label: "Min dft 2015" },
          { value: "\u003C 6 tahun", label: "Definisi umur" },
        ],
      },
      progression: {
        title: "Perkembangan Klinikal",
        stages: [
          {
            key: "sound",
            label: "Enamel sihat",
            desc: "Enamel sihat tanpa plak atau perubahan warna yang kelihatan.",
            note: "Tunjukkan enamel yang licin dan berkilat serta margin gingiva yang sihat.",
          },
          {
            key: "plaque",
            label: "Pengumpulan plak",
            desc: "Plak lembut dan glutinus terkumpul di margin gingiva — tanda kelihatan yang paling awal.",
            note: "Periksa margin gingiva terlebih dahulu, terutamanya pada gigi hadapan atas.",
          },
          {
            key: "white",
            label: "Lesi tanda putih",
            desc: "Jalur putih kapur di bawah plak; enamel sedang demineralisasi tetapi masih boleh pulih.",
            note: "Tekankan bahawa tahap ini boleh pulih dengan varnish fluoride dan gosok gigi diawasi.",
          },
          {
            key: "brown",
            label: "Lesi tanda perang",
            desc: "Jalur demineralisasi menjadi gelap ke perang atau coklat apabila kehancuran enamel berterusan.",
            note: "Bincangkan penilaian risiko karies dan meningkatkan frekuensi ulangan.",
          },
          {
            key: "cavity",
            label: "Lesi berkaviti",
            desc: "Permukaan enamel telah runtuh menjadi kaviti; rawatan restoratif kini diperlukan.",
            note: "Hubungkan dengan pilihan pengurusan non-invasif berbanding invasif dalam CPG.",
          },
        ],
      },
    },
    risk: {
      title: "Faktor Risiko & Perlindungan",
      subtitle: "Punca dan pertahanan terhadap ECC",
      riskTitle: "Faktor Risiko Utama",
      risks: [
        { title: "Amalan penyusuan", detail: "Penyusuan susu ibu dan/atau penyusuan botol, termasuk pada waktu permintaan atau semalaman, merupakan faktor risiko ECC yang dikenal pasti." },
        { title: "Gula dalam diet", detail: "Frekuensi dan jenis pendedahan gula meningkatkan aktiviti bakteria kariogenik di permukaan gigi." },
        { title: "Mikrobiom oral", detail: "Perolehan awal bakteria kariogenik seperti S. mutans dan lactobacilli membentuk risiko karies kanak-kanak." },
        { title: "Amalan kebersihan oral lemah", detail: "Gosok gigi yang tidak konsisten atau tiada pengawasan membolehkan plak dan lesi yang disebabkannya berterusan." },
        { title: "Kekurangan faktor perlindungan", detail: "Tiada ubat gigi fluoride atau aplikasi varnish fluoride meningkatkan risiko ECC dengan ketara." },
      ],
      protectiveTitle: "Faktor Perlindungan",
      protective: [
        { title: "Diet perlindungan", detail: "Susu dan keju mengurangkan asid metabolik dan keasidan plak. Buah whole (OR 0.47) dan susu (OR 0.50) dikaitkan dengan risiko ECC yang lebih rendah." },
        { title: "Air liur", detail: "Air liur menyediakan penampan fizikal, peneutralan pH plak secara kimia, pembilasan sisa makanan, dan tindakan antibakteria yang menyokong remineralisasi." },
        { title: "Pendedahan fluoride", detail: "Penggunaan ubat gigi fluoride (1000–1500 ppm) dan varnish fluoride profesional merupakan strategi perlindungan teras." },
      ],
    },
    exam: {
      title: "Pemeriksaan & Diagnosis",
      subtitle: "Mengesan dan menilai ECC",
      methods: [
        {
          title: "Pemeriksaan Visual",
          text: "Kaedah standard untuk diagnosis karies. Dilakukan di bawah sumber cahaya yang baik pada gigi yang bersih dan kering. Cari lesi tanda putih, perubahan warna perang, dan kaviti.",
          tag: "Alat diagnosis utama",
        },
        {
          title: "Pemeriksaan Radiografi",
          text: "Digunakan sebagai adjunct. Radiografi bitewing meningkatkan pengesanan karies dentin proksimal apabila permukaan tidak dapat dilihat atau disondir.",
          tag: "Adjunct",
        },
        {
          title: "ICDAS",
          text: "International Caries Detection and Assessment System menyediakan kerangka penskoran visual berstruktur untuk mengklasifikasikan keseriusan karies secara konsisten.",
          tag: "Penskoran berstruktur",
        },
      ],
      keyConsideration:
        "Pengambilan sejarah adalah penting sebelum pemeriksaan. Pesakit tanpa tanda penyakit dan dengan kontak proksimal terbuka mungkin tidak memerlukan radiografi pada lawatan pertama.",
    },
    prevention: {
      title: "Pencegahan ECC",
      subtitle: "Strategi berasaskan bukti",
      diet: {
        title: "Nasihat Diet & Kawalan Plak",
        text: "Mulakan kaunseling kebersihan oral sebaik gigi tumbuh. Gosok gigi dua kali sehari dengan jumlah ubat gigi fluoride 1000–1500 ppm yang sesuai umur. Awasi gosok gigi sehingga sekurang-kurangnya tujuh tahun. Ludah, jangan bilas.",
      },
      ohe: {
        title: "Pendidikan Kesihatan Oral & Intervensi Tingkah Laku",
        text: "Berikan pendidikan kesihatan oral kepada ibu mengandung, ibu baru, dan penjaga. Temu bual motivasi dan bimbingan antisipasi meningkatkan hasil pencegahan, terutamanya bagi keluarga berisiko tinggi.",
      },
      professional: {
        title: "Pencegahan Profesional",
        text: "Penilaian risiko karies hendaklah dilakukan untuk setiap kanak-kanak berumur enam tahun dan ke bawah. Aplikasi varnish sodium fluoride (5%) enam bulan sekali, atau diflourosilane (0.9%) tiga bulan sekali, berdasarkan status risiko.",
      },
      recommendations: [
        { id: "Syor 6", text: "Berikan nasihat diet kepada ibu mengandung, ibu baru, dan penjaga utama.", level: "Syor 6" },
        { id: "Syor 7", text: "Gunakan kawalan plak mekanikal dengan berus elektrik atau manual; pertimbangkan agen kimia sebagai adjunct.", level: "Syor 7" },
        { id: "Syor 8", text: "Gosok gigi dua kali sehari dengan ubat gigi fluoride 1000–1500 ppm, diawasi oleh dewasa.", level: "Syor 8" },
        { id: "Syor 9", text: "Berikan pendidikan kesihatan oral kepada ibu mengandung, ibu baru, dan penjaga.", level: "Syor 9" },
        { id: "Syor 12", text: "Lakukan temu bual motivasi untuk ibu bapa kanak-kanak berisiko tinggi.", level: "Syor 12" },
        { id: "Syor 13", text: "Berikan bimbingan antisipasi kepada semua ibu bapa dan penjaga seawal selepas bersalin.", level: "Syor 13" },
        { id: "Syor 14", text: "Lakukan penilaian risiko karies untuk semua kanak-kanak berumur enam tahun dan ke bawah.", level: "Syor 14" },
        { id: "Syor 15", text: "Aplikasi varnish NaF 5% enam bulan sekali atau diflourosilane 0.9% tiga bulan sekali.", level: "Syor 15" },
      ],
    },
    treatment: {
      title: "Rawatan",
      subtitle: "Daripada pengurusan non-invasif ke invasif",
      nonInvasive: {
        title: "Kaedah Non-Invasif",
        for: "Untuk lesi tanpa kaviti, atau lesi berkaviti apabila rawatan tidak dapat dilakukan segera:",
        items: [
          "Agen remineralisasi bukan-fluoride",
          "Remineralisasi fluoride (aplikasi topikal)",
          "Sealant fissure untuk pit dan fissure",
          "Infiltrasi resin untuk lesi proksimal",
          "Penutupan resin komposit sebagai pengurusan interim",
        ],
      },
      invasive: {
        title: "Kaedah Invasif",
        for: "Untuk lesi berkaviti yang memerlukan intervensi:",
        items: [
          "Stepwise excavation (SWE)",
          "Selective caries removal (SCR)",
          "Non-selective caries removal (NSCR)",
          "Terapi pulpa apabila karies mendekati atau melibatkan pulpa",
        ],
      },
    },
    home: {
      title: "Mesej Utama",
      subtitle: "Tindakan teras untuk petugas barisan hadapan",
      officer: {
        title: "Tugas Pegawai Barisan Hadapan",
        items: [
          "Kaunsel penjaga tentang amalan penyusuan susu ibu dan botol yang sesuai.",
          "Nasihatkan gosok gigi diawasi dua kali sehari dengan ubat gigi fluoride 1000–1500 ppm.",
          "Didik tentang faktor risiko, faktor perlindungan, dan tanda awal ECC.",
          "Atur temujanji pergigian untuk aplikasi varnish fluoride profesional.",
        ],
      },
      cra: {
        title: "Penilaian Risiko Karies & Ulangan",
        text: "Lakukan CRA untuk setiap kanak-kanak bawah enam tahun. Berikan kad temujanji LP1 berdasarkan stratifikasi risiko:",
        intervals: [
          { risk: "Risiko tinggi", interval: "3 bulan" },
          { risk: "Risiko sederhana", interval: "6 bulan" },
          { risk: "Risiko rendah", interval: "6–12 bulan" },
        ],
      },
      reminder:
        "Setiap sentuhan dengan kanak-kanak bawah enam tahun adalah peluang untuk menilai risiko, mendidik penjaga, dan mencegah perkembangan penyakit. Pencegahan sentiasa lebih baik daripada rawatan.",
    },
    toothLab: {
      title: "Makmal Gigi Interaktif",
      subtitle: "Putar, fokus permukaan, dan langkaui perkembangan ECC",
      toothTypes: { incisor: "Insisor", canine: "Kanin", molar: "Molar" },
      surface: {
        title: "Fokus Permukaan",
        options: {
          gingival: "Margin gingiva",
          smooth: "Permukaan licin",
          proximal: "Proksimal",
          occlusal: "Pit & fissure",
        },
        detail: {
          gingival: "Margin gingiva — di mana plak berkumpul pertama dalam ECC. Periksa pada setiap lawatan, terutamanya pada gigi hadapan atas.",
          smooth: "Permukaan muka/bukan — kelihatan pada pemeriksaan visual rutin di bawah cahaya mencukupi.",
          proximal: "Di antara gigi — sering memerlukan radiografi bitewing kerana tidak dapat dilihat secara langsung.",
          occlusal: "Pit dan fissure — lokasi biasa untuk penempatan sealant fissure pada geraham susu.",
        },
      },
      reset: "Tetap semula",
      auto: "Main automatik",
      stop: "Henti",
    },
    mouthMap: {
      title: "Peta Dentisi Susu",
      subtitle: "Tandakan tahap ECC pada gigi hadapan atas yang paling kerana terjejas",
      modeTitle: "Pilih tahap, kemudian klik gigi untuk menandakannya",
      legend: {
        sound: "Sihat",
        white: "Tanda putih",
        brown: "Tanda perang",
        cavity: "Berkaviti",
        filled: "Tampal / dirawat",
        missing: "Hilang (karies)",
      },
      reset: "Kosongkan peta",
      selected: "Gigi dipilih",
      none: "Tiada gigi ditandakan.",
    },
  },
};

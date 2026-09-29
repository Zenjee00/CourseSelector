import { universities } from '../data/universities';
import {
  getMatchingPrograms,
  normalizeProgram,
} from './programMatching';

export const TUITION_RESEARCH_DATE = '2026-09-22';

const money = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value);

const key = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const degreeKey = (value = '') =>
  key(
    value
      .replace(
        /^bachelor of science in\s+/i,
        'Bachelor of Science in ',
      )
      .replace(
        /^bachelor of arts in\s+/i,
        'BA ',
      ),
  );

const sources = {
  silliman:
    'https://su.edu.ph/costs/estimated-tuition-fees/',

  ust:
    'https://www.ust.edu.ph/tuition-fees/',

  uerm:
    'https://www.uerm.edu.ph/wp-content/uploads/2026/06/Nursing-F.png',

  dlsau:
    'https://serp.dlsau.edu.ph/SERP/Downloadables/DLSAU/DLSAU.TEDNEWSY2026-2027-1CAST.pdf',

  feuAlabang:
    'https://feualabang.edu.ph/faqs',

  freeEducation:
    'https://ched.gov.ph/wp-content/uploads/2025-Updated-FHE-FRONT-AND-BACK.pdf',
};

const publicSchools = new Map(
  [
    [
      'University of the Philippines Los Banos (UPLB)',
      'https://gs.uplb.edu.ph/wp-content/uploads/2025/03/studenthandbook3-2023.pdf',
    ],
    [
      'Cavite State University (CvSU) - Main Campus',
      'https://cvsu.edu.ph/2018/07/presidents-message-2018/',
    ],
    [
      'Batangas State University (BatStateU)',
      'https://sustainability.batstate-u.edu.ph/wp-content/uploads/2025/11/NON-DISCRIMINATION-LAWS-RULES-AND-REGULATIONS-IN-THE-ACCESS-OF-THE-BATSTATEU-EDUCATION.pdf',
    ],
    [
      'Southern Luzon State University (SLSU)',
      'https://www.slsu.edu.ph/office-of-the-student-affairs-and-services/',
    ],
    [
      'EARIST - Cavite Branch (GMA)',
      'https://earist.edu.ph/wp-content/uploads/annual-2019_2019compressed-4.pdf',
    ],
  ].map(([name, url]) => [
    key(name),
    url,
  ]),
);

const publishedRecords = [
  ...[
    [
      'Bachelor of Science in Information Technology',
      54897.8,
    ],
    [
      'Bachelor of Science in Accountancy',
      59601.58,
    ],
    [
      'Bachelor of Science in Nursing',
      70373.18,
    ],
    [
      'Bachelor of Science in Medical Technology',
      76048.53,
    ],
    [
      'Bachelor of Science in Physical Therapy',
      64906.08,
    ],
  ].map(([program, amount]) => ({
    school: 'Silliman University',
    program,
    amount,

    status: 'official_estimate',
    academicYear: null,
    period: 'first semester',
    yearLevel: 1,

    feeType:
      'estimated tuition and fees',

    sourceUrl: sources.silliman,

    notes:
      'Official undergraduate estimate table. The undergraduate table itself does not explicitly label its academic year. Summer, later-year, and internship charges may be separate. Confirm the current assessment.',
  })),

  {
    school:
      'De La Salle Araneta University',

    program:
      'Bachelor of Science in Computer Science',

    amount: 35966.11,
    tuitionOnly: 18267.2,

    academicYear: '2026-2027',
    period: 'first term',
    yearLevel: 1,
    units: 14,

    status: 'official_schedule',

    feeType:
      'total school fees before cash discount',

    sourceUrl: sources.dlsau,

    paymentOptions: {
      cashWithDiscount: 35052.75,
      twoInstallmentsTotal: 35966.11,
      fourInstallmentsTotal: 37764.42,
    },

    notes:
      'New students, Bachelor of Science in Computer Science, 14 units. Published total includes non-tuition charges. All fees are subject to reassessment.',
  },

  {
    school:
      'UERM Memorial Medical Center',

    program:
      'Bachelor of Science in Nursing',

    amount: 79797,
    tuitionOnly: 46467,

    academicYear: '2026-2027',
    period: 'first semester',
    yearLevel: 1,
    units: 27,

    status: 'official_schedule',

    feeType:
      'tuition and other school fees, cash basis',

    sourceUrl: sources.uerm,

    paymentOptions: {
      cashTotal: 79797,
      installmentTotal: 82588,
    },

    notes:
      'First-year Bachelor of Science in Nursing only. Use the Accounting Office assessment for final charges. The installment total is different. This is not a Medicine fee.',
  },

  ...[
    [
      'Bachelor of Science in Computer Science',
      71439,
      45057,
      72439,
      'https://www.ust.edu.ph/wp-content/uploads/2026/07/CICS-Table-of-Fees-1st-Term-A.Y.-2026-2027.png',
    ],
    [
      'Bachelor of Science in Accountancy',
      70876,
      47016,
      71876,
      'https://www.ust.edu.ph/wp-content/uploads/2026/07/Accountancy-Table-of-Fees-1st-Term.-A.Y.-2026-2027_x.png',
    ],
    [
      'Bachelor of Science in Chemical Engineering',
      67688,
      41139,
      68688,
      'https://www.ust.edu.ph/wp-content/uploads/2026/08/Engineering-Table-of-Fees-1st-Term-A.Y.-2026-2027-images-0-scaled.jpg',
    ],
  ].map(
    ([
      program,
      amount,
      tuitionOnly,
      installmentTotal,
      sourceUrl,
    ]) => ({
      school:
        'University of Santo Tomas',

      program,
      amount,
      tuitionOnly,

      academicYear: '2026-2027',
      period: 'first term',
      yearLevel: 1,

      status: 'official_schedule',

      feeType:
        'total fees, full payment',

      sourceUrl,

      paymentOptions: {
        fullPayment: amount,
        installmentTotal,
      },

      notes:
        'UST Manila, Level I. The published amount includes the applicable listed charges. This is not the UST General Santos fee. The final amount may vary depending on enrolled subjects, payment scheme, and additional charges.',
    }),
  ),
];

const recordIndex = new Map(
  publishedRecords.map((record) => [
    `${key(record.school)}|${degreeKey(
      record.program,
    )}`,
    record,
  ]),
);

const followUpEntries = [
  [
    'Miriam College',
    'https://mc.edu.ph/beu/faqs/',
    'contact_school',
    'The official FAQ directs applicants to Student Accounts for a program-specific and year-level-specific breakdown.',
  ],
  [
    'University of Asia and the Pacific',
    'https://www.uap.asia/admissions',
    'contact_school',
    'The admissions FAQ states that the final SY 2026-2027 assessment will be released with the admission results.',
  ],
  [
    'De La Salle Medical and Health Sciences Institute (DLSMHSI)',
    'https://sites.google.com/dlsmhsi.edu.ph/confirmation-procedure-ug-dire/home',
    'source_not_extracted',
    'The official enrollment page links to tentative tuition fees, but the program-specific amount was not verified in this research.',
  ],
  [
    'Mapua Malayan Colleges Laguna (MMCL)',
    'https://mcl.edu.ph/a-guide-to-mapua-mcl-tuition-fees/',
    'source_not_extracted',
    'The official guide identifies the undergraduate fees as First Term AY 2025-2026 and states that they may change. A readable program-specific amount was not verified.',
  ],
  [
    'Ateneo de Naga University',
    'https://www.adnu.edu.ph/school-fee-estimator/',
    'use_official_estimator',
    'Select the exact degree, year level, and term in the official fee estimator. No calculator result was stored.',
  ],
  [
    'FEU Cavite',
    'https://feucavite.edu.ph/feu-cavite-announces-no-tuition-fee-increase-for-sy-2025-2026/',
    'not_verified',
    'The official no-increase announcement does not provide a program-specific peso amount. Do not reuse FEU Alabang fees.',
  ],
  [
    'De La Salle University - Dasmarinas (DLSU-D)',
    'https://www.dlsud.edu.ph/offices/finance/faqs.htm',
    'contact_school',
    'Request the current undergraduate assessment. The publicly available College of Law rate is not an undergraduate rate.',
  ],
  [
    'Lyceum of the Philippines University (LPU) - Cavite Campus',
    'https://cavite.lpu.edu.ph/admissions/academic-scholarships-and-financial-aid-grants/',
    'not_verified',
    'Scholarship percentages are not tuition amounts. Request a program-specific assessment from LPU Cavite.',
  ],
  [
    'Lyceum of the Philippines University (LPU) - Laguna Campus',
    'https://lpulaguna.edu.ph/enrollment-procedure-for-new-students/',
    'contact_school',
    'The enrollment down payment is not the total tuition. Request an assessment for the exact program.',
  ],
  [
    'Lyceum of the Philippines University (LPU) - Batangas Campus',
    'https://lpubatangas.edu.ph/admissions/college-high-school-and-certificate-programs/',
    'contact_school',
    'The enrollment portal computes fees after subject selection. Do not use the minimum down payment as tuition.',
  ],
  [
    'University of Perpetual Help System DALTA (UPHSD) - Binan Campus',
    'https://www.uphsl.edu.ph/verify/',
    'campus_identity_unverified',
    'The catalog campus identity needs correction. The official Binan institution belongs to the UPHS JONELTA or UPHSL system. No DALTA amount was assigned.',
  ],
  [
    'University of Perpetual Help System DALTA (UPHSD) - Calamba Campus',
    'https://perpetualdalta.edu.ph/new/calamba-campus-home/',
    'not_verified',
    'No program-specific fee was verified. Confirm program availability and request a Calamba assessment.',
  ],
  [
    'Emilio Aguinaldo College (EAC)',
    'https://www.eac.edu.ph/osa/',
    'not_verified',
    'No Cavite program-specific amount was verified. Manila rates must not be substituted.',
  ],
  [
    'National College of Science and Technology',
    'https://payments.ncst.edu.ph/College',
    'contact_school',
    'The official payment portal does not establish the tuition for a particular course. Request the current assessment.',
  ],
  [
    'National University',
    'https://www.nu.edu.ph/admissions/requirements?campus_id=nu-manila',
    'contact_school',
    'Request an NU Manila program assessment. Amounts from other NU campuses are not interchangeable.',
  ],
  [
    'National University - DasmariÃ±as',
    'https://www.nu.edu.ph/campus-page/nu-dasmarinas',
    'contact_school',
    'No dated course-specific tuition schedule was verified. Request the current first-term assessment from NU Dasmarinas.',
  ],
  [
    'MapÃºa University',
    'https://www.mapua.edu.ph/pages/admissions/mapua-scholarships/financial-assistance',
    'not_verified',
    'Scholarship percentages and sample enrollment forms do not establish a current program fee. Confirm the campus and term system.',
  ],
  [
    'Pasig Catholic College',
    'https://pcccollege.orangeapps.ph/online-admission',
    'contact_school',
    'No course-specific public assessment was verified. Do not confuse this institution with Pines City Colleges.',
  ],
  [
    'World Citi Colleges',
    'https://wcc.orangeapps.ph/',
    'contact_school',
    'Request the current Quezon City assessment. No verified fee was found for the listed program.',
  ],
  [
    'Central Colleges of the Philippines',
    'https://www.ccp.edu.ph/enrollment_procedure.php',
    'contact_school',
    'Request an undergraduate program assessment. Certificate in Teacher Education fees are not bachelor-degree tuition.',
  ],
  [
    'Aldersgate College',
    'https://aldersgate.edu.ph/programs/higher-education/scholarships-grants-in-aid-discounts/',
    'not_verified',
    'The official source describes discounts, not a current course-specific tuition schedule.',
  ],
  [
    'Ateneo de Manila University',
    null,
    'not_verified',
    'No current official course-specific assessment was verified. Third-party university-wide estimates were not used.',
  ],
  [
    'La Salle University - Ozamiz',
    null,
    'not_verified',
    'No current official program-specific fee was verified. Historical figures were not used.',
  ],
  [
    'Vatel Manila',
    null,
    'not_verified',
    'No current official Manila program fee was verified. Fees from foreign Vatel campuses were not used.',
  ],
];

const followUps = new Map(
  followUpEntries.map(
    ([
      name,
      sourceUrl,
      status,
      notes,
    ]) => [
      key(name),
      {
        sourceUrl,
        status,
        notes,
      },
    ],
  ),
);

const pending = (
  status = 'not_verified',
  notes =
    'No verified fee for this campus and program.',
  sourceUrl = null,
) => ({
  amount: null,
  minAmount: null,
  maxAmount: null,
  tuitionOnly: null,

  currency: 'PHP',
  academicYear: null,
  period: null,
  yearLevel: null,

  status,
  notes,
  sourceUrl,

  feeType: null,
  checkedOn: TUITION_RESEARCH_DATE,
  requiresConfirmation: true,
});

export const getTuitionForSchoolProgram = (
  school,
  programName,
) => {
  const university =
    typeof school === 'string'
      ? universities.find(
          (entry) =>
            key(entry.name) === key(school),
        )
      : school;

  if (
    !university ||
    typeof programName !== 'string'
  ) {
    return pending();
  }

  const schoolKey = key(university.name);

  const listedProgram = (
    university.programs || []
  ).find(
    (name) =>
      degreeKey(name) ===
      degreeKey(programName),
  );

  if (!listedProgram) {
    return pending('program_not_in_catalog');
  }

  const programStatus =
    university.programDetails?.[
      listedProgram
    ]?.status || '';

  if (
    /no longer current|legacy|historical/i.test(
      programStatus,
    ) ||
    schoolKey === key('Kalayaan College')
  ) {
    return pending(
      'historical_program',
      'Historical or inactive catalog entry. Do not display a current tuition quote.',
    );
  }

  const record = recordIndex.get(
    `${schoolKey}|${degreeKey(
      listedProgram,
    )}`,
  );

  if (record) {
    return {
      ...pending(),
      ...record,

      paymentOptions:
        record.paymentOptions
          ? { ...record.paymentOptions }
          : undefined,

      evidenceScope: 'program',
    };
  }

  if (publicSchools.has(schoolKey)) {
    return {
      ...pending(),

      status:
        'conditional_free_tuition',

      /*
       * The ordinary amount remains null
       * because student eligibility has
       * not been verified.
       */
      eligibleTuitionAmount: 0,

      evidenceScope:
        'institution_policy',

      feeType:
        'tuition and covered school fees for eligible students',

      sourceUrl:
        publicSchools.get(schoolKey),

      eligibilitySourceUrl:
        sources.freeEducation,

      notes:
        'Free Higher Education may apply to eligible Filipino undergraduate students, subject to current admission, retention, and eligibility rules confirmed by the university. This does not mean that living costs, transportation, supplies, uniforms, and every possible charge are free.',
    };
  }

  if (
    schoolKey === key('FEU Alabang')
  ) {
    return {
      ...pending(),

      status:
        'official_school_range',

      minAmount: 48000,
      maxAmount: 50000,

      period: 'term',
      yearLevel: 1,

      evidenceScope: 'institution',

      feeType:
        'school-wide tentative freshman tuition range',

      sourceUrl:
        sources.feuAlabang,

      notes:
        'This is the official school-wide freshman range, not an exact quote for this particular course. The academic year and inclusion of other fees were not specified. Confirm the final amount with Admissions.',
    };
  }

  const followUp =
    followUps.get(schoolKey);

  if (followUp) {
    return {
      ...pending(),
      ...followUp,
    };
  }

  return pending();
};

export const formatTuition = (
  tuition,
) => {
  if (!tuition) {
    return 'Tuition not verified - contact Admissions';
  }

  if (
    tuition.status ===
    'conditional_free_tuition'
  ) {
    return 'Free tuition for eligible students only - confirm eligibility';
  }

  if (
    tuition.status ===
    'historical_program'
  ) {
    return 'Historical program - no current tuition quote';
  }

  if (
    tuition.status ===
    'campus_identity_unverified'
  ) {
    return 'Campus identity needs verification - tuition unavailable';
  }

  const year =
    tuition.academicYear
      ? `AY ${tuition.academicYear}`
      : 'academic year not stated';

  if (
    Number.isFinite(tuition.amount)
  ) {
    const estimate =
      tuition.status ===
      'official_estimate'
        ? 'Estimated '
        : '';

    return (
      `${estimate}${money(
        tuition.amount,
      )} - ` +
      `Year ${tuition.yearLevel}, ` +
      `${tuition.period}; ` +
      `${year}; ` +
      `${tuition.feeType}`
    );
  }

  if (
    Number.isFinite(
      tuition.minAmount,
    ) &&
    Number.isFinite(
      tuition.maxAmount,
    )
  ) {
    return (
      `${money(
        tuition.minAmount,
      )}-${money(
        tuition.maxAmount,
      )} per ${tuition.period} - ` +
      'school-wide tentative freshman range, ' +
      `not course-specific; ${year}`
    );
  }

  return 'Tuition not verified - contact Admissions';
};

export const getSchoolsForProgram = (
  programName,
  schoolCatalog = universities,
) =>
  schoolCatalog
    .map((university) => {
      const matchedProgram =
        getMatchingPrograms(
          programName,
          university.programs,
        )[0];

      if (!matchedProgram) {
        return null;
      }

      const tuition =
        getTuitionForSchoolProgram(
          university,
          matchedProgram,
        );

      const tuitionFee =
        formatTuition(tuition);

      return {
        ...university,

        matchedProgram,
        tuition,
        tuitionFee,

        details: {
          duration:
            'Not publicly specified',

          status:
            'Not publicly specified',

          ...university
            .programDetails?.[
              matchedProgram
            ],

          tuition,
          tuitionFee,
        },
      };
    })
    .filter(Boolean);

export const getProgramDetails = (
  programName,
  schoolCatalog = universities,
) =>
  schoolCatalog
    .map(
      (university) =>
        university.programDetails?.[
          programName
        ],
    )
    .find(Boolean) || {
    duration:
      'Not publicly specified',

    status:
      'Not publicly specified',
  };

export const getCanonicalPrograms = (
  schoolCatalog = universities,
) => {
  const uniquePrograms = new Map();

  schoolCatalog
    .flatMap(
      (university) =>
        university.programs,
    )
    .forEach((programName) => {
      const programKey =
        normalizeProgram(programName);

      if (
        !uniquePrograms.has(programKey)
      ) {
        uniquePrograms.set(
          programKey,
          programName,
        );
      }
    });

  return [
    ...uniquePrograms.values(),
  ];
};

export const getProgramKey = (
  programName,
) => normalizeProgram(programName);
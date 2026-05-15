export const IMPORT_KINDS = {
  ALTERNATIVES: 'alternatives',
  TOPSIS_EVALUATIONS: 'topsis_evaluations',
  RULE_EVALUATIONS: 'rule_evaluations',
}

export const IMPORT_MODES = {
  CREATE_ONLY: 'create_only',
  UPSERT: 'upsert',
}

export const IMPORT_MODE_OPTIONS = [
  {
    value: IMPORT_MODES.UPSERT,
    label: 'Tambah & perbarui',
    description: 'Buat data baru dan perbarui data yang sudah ada (default).',
  },
  {
    value: IMPORT_MODES.CREATE_ONLY,
    label: 'Hanya tambah baru',
    description: 'Tolak baris yang konflik dengan data yang sudah ada.',
  },
]

export const IMPORT_TITLES = {
  [IMPORT_KINDS.ALTERNATIVES]: 'Import Alternatif',
  [IMPORT_KINDS.TOPSIS_EVALUATIONS]: 'Import Evaluasi TOPSIS',
  [IMPORT_KINDS.RULE_EVALUATIONS]: 'Import Evaluasi Rule (RBS)',
}

export const IMPORT_DESCRIPTIONS = {
  [IMPORT_KINDS.ALTERNATIVES]: 'Unggah file Excel berisi daftar alternatif. Pastikan nama unik per decision model.',
  [IMPORT_KINDS.TOPSIS_EVALUATIONS]: 'Unggah file Excel berisi pemetaan alternatif → sub-kriteria untuk perhitungan TOPSIS.',
  [IMPORT_KINDS.RULE_EVALUATIONS]: 'Unggah file Excel berisi nilai fakta tiap variabel rule untuk setiap alternatif.',
}

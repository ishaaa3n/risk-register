export const DEPARTMENTS = [
  'Q&FS',
  'Operations',
  'Warehousing/Logistics',
  'Engineering',
  'Admin',
  'Utilities'
];

export const AREAS_BY_DEPARTMENT = {
  'Q&FS': ['Micro Lab', 'Q&FS Lab', 'NQL', 'Sensory Lab', 'Control Room', 'Quality Store Room', 'Fumigation Room', 'Housekeeping Storage Room', 'Scrap Handling', 'Other (To specify)'],
  'Operations': ['TR', 'RMC', 'Shell Line', 'C&M Line', 'NML', 'NCM', 'BV Making', 'Other (To specify)'],
  'Warehousing/Logistics': ['PM Warehouse', 'EM Warehouse', 'FG Warehouse', 'Crumb Warehouse', 'Butter Warehouse', 'TR Warehouse', 'Other (To specify)'],
  'Admin': ['Admin and CSNL', 'Female Changing Room', 'Male Changing Room', 'Green Office', 'Green Training Room', 'TTC', 'Red Canteen', 'Green Canteen and Kitchen', 'OHC', 'Staff Sale Room', 'Time Office', 'Parking', 'Main Gate', 'Other (To specify)'],
  'Engineering': ['Engineering Store', 'Green Shed', 'Fabrication Yard', 'Other (To specify)'],
  'Utilities': ['ETP & RWH', 'Boiler', 'Solar Area', 'Powerhouse 1', 'Powerhouse 2', 'Other (To specify)']
};

export const ROUTINE_OPTIONS = ['Routine', 'Non-Routine'];

export const ACTIVITY_TYPE_OPTIONS = ['manual', 'process'];

export const HAZARD_OPTIONS = [
  'Fall from height > 2 m',
  'Fall from height < 2 m',
  'Slip & Trip',
  'Moving objects',
  'Manual handling & Sharp edges',
  'Collapse (Buildings, steel structures,etc)',
  'Electricity > 480 V',
  'Electricity > 220 V',
  'Electricity< 110 V',
  'Contact with moving machinery',
  'Fire',
  'Harmful Substances/Chemicals and Gases',
  'Noise and Vibrations',
  'Explosions',
  'Steam/pressurized fluids & gases',
  'powered mechanical equipment/electrical power distribution',
  'Falling Object',
  'Other (To specify)'
];

export const PROBABILITY_OPTIONS = [
  { label: 'Never heard of in the industry OR Improbable', value: 1 },
  { label: 'Heard in industry OR at risk', value: 2 },
  { label: 'Has happened in the organization', value: 5 },
  { label: 'Has happened more than once per year in the organization', value: 8 },
  { label: 'Has happened in the location', value: 10 },
  { label: 'Has happened more than once per year at the location', value: 15 }
];

export const FREQUENCY_OPTIONS = [
  { label: 'Less than once a year', value: 0.2 },
  { label: 'Once a year', value: 0.5 },
  { label: 'Monthly', value: 1 },
  { label: 'Weekly', value: 1.5 },
  { label: 'Daily', value: 2.5 },
  { label: 'Hourly', value: 4 },
  { label: 'Multiple Times an hour', value: 5 }
];

export const SEVERITY_OPTIONS = [
  { label: 'Minor injuries, scratch, bruise', value: 0.1 },
  { label: 'Cut (laceration), mild (usual disease)', value: 0.5 },
  { label: 'Temporary disability (Body portion <9%)', value: 1 },
  { label: 'Temporary disability (Body portion >9%) OR Occupational disease (temporary)', value: 2 },
  { label: 'Permanent disability (Body portion <9%) OR loss of one eye OR occupational disease (permanent)', value: 4 },
  { label: 'Permanent disability (Body portion >9%) OR loss of two eyes OR Death causing occupational disease', value: 8 },
  { label: 'Fatality', value: 15 }
];

export const PEOPLE_EXPOSED_OPTIONS = [
  { label: '1 - 2 Persons', value: 1 },
  { label: '3 - 7 Persons', value: 2 },
  { label: '8 - 15 Persons', value: 4 },
  { label: '16 - 50 Persons', value: 8 },
  { label: 'More than 50 Persons', value: 12 }
];

export const CONTROL_MEASURE_OPTIONS = [
  { label: 'Elimination', value: 0 },
  { label: 'Substitution', value: 0 },
  { label: 'Engineering control plus training and PPE as required', value: 0.2 },
  { label: 'Administrative control OR Eng Controls that require Admin', value: 0.6 },
  { label: 'PPE', value: 0.9 },
  { label: 'None', value: 1 }
];

export function riskLevelForRRN(rrn) {
  if (rrn <= 5) return 'Very Low';
  if (rrn <= 10) return 'Low';
  if (rrn <= 50) return 'Medium (acceptable)';
  if (rrn <= 100) return 'Medium (consider controls)';
  if (rrn <= 500) return 'High (consider stopping task and implement interim controls)';
  return 'Unacceptable (stop task and implement interim controls)';
}

export function lookupValue(options, label) {
  const found = options.find((o) => o.label === label);
  return found ? found.value : null;
}

export const RISK_LEVEL_STATUS = {
  'Very Low': 'good',
  'Low': 'good',
  'Medium (acceptable)': 'warning',
  'Medium (consider controls)': 'serious',
  'High (consider stopping task and implement interim controls)': 'critical',
  'Unacceptable (stop task and implement interim controls)': 'critical'
};

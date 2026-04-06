import NepaliDate from 'nepali-date-converter';

export const NEPALI_MONTHS = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export function formatBsDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function convertBsToAd(bsDate: string) {
  const nepaliDate = new NepaliDate(bsDate);
  return nepaliDate.toJsDate();
}

export function convertAdToBs(adDate: string | Date) {
  const nepaliDate = new NepaliDate(typeof adDate === 'string' ? new Date(adDate) : adDate);
  const bs = nepaliDate.getBS();
  return {
    year: bs.year,
    month: bs.month + 1,
    day: bs.date,
    monthLabel: NEPALI_MONTHS[bs.month],
    formatted: formatBsDate(bs.year, bs.month + 1, bs.date),
  };
}

export function toAdInputValue(bsDate: string) {
  return convertBsToAd(bsDate).toISOString().slice(0, 10);
}

export function getFiscalYearLabelFromBs(year: number, month: number) {
  const fiscalStartYear = month >= 4 ? year : year - 1;
  const fiscalEndYear = fiscalStartYear + 1;
  return `${fiscalStartYear}/${String(fiscalEndYear).slice(-2)}`;
}

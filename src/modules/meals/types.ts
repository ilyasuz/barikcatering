export interface MealExcursion {
  id: string;
  start_date: string;
  end_date: string;
  days: number;
  note?: string;
}

export interface DailyPaxRecord {
  date: string;
  pax?: number;
  morning_pax?: number;
  evening_pax?: number;
}

export interface MealCalculation {
  id: string;
  company_id: string;
  hotel_name: string;
  entry_date: string;
  entry_morning: number;
  entry_evening: number;
  exit_date: string;
  exit_morning: number;
  exit_evening: number;
  pax_count: number;
  morning_price: number;
  evening_price: number;
  total_days: number;
  total_amount: number;
  currency: string;
  region: string;
  created_at?: string;
  
  // excursion fields
  excursion_start_date?: string;
  excursion_end_date?: string;
  excursion_days?: number;
  excursion_note?: string;
  excursions?: MealExcursion[];

  // variable pax fields
  is_variable_pax?: boolean;
  daily_pax?: DailyPaxRecord[];

  // joined from companies
  company_name?: string;
}

export interface CreateMealCalculationDTO {
  company_id: string;
  hotel_name: string;
  entry_date: string;
  entry_morning: number;
  entry_evening: number;
  exit_date: string;
  exit_morning: number;
  exit_evening: number;
  pax_count: number;
  morning_price: number;
  evening_price: number;
  total_days: number;
  total_amount: number;
  currency: string;
  region: string;
  
  excursion_start_date?: string;
  excursion_end_date?: string;
  excursion_days?: number;
  excursion_note?: string;
  excursions?: MealExcursion[];

  is_variable_pax?: boolean;
  daily_pax?: DailyPaxRecord[];
}

export function getExcursionsFromMeal(meal: Partial<MealCalculation>): MealExcursion[] {
  if (meal.excursions && Array.isArray(meal.excursions) && meal.excursions.length > 0) {
    return meal.excursions;
  }
  if (meal.excursion_note) {
    try {
      const parsed = JSON.parse(meal.excursion_note);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      // plain text note
    }
  }
  if (meal.excursion_days && meal.excursion_days > 0) {
    return [{
      id: '1',
      start_date: meal.excursion_start_date || '',
      end_date: meal.excursion_end_date || '',
      days: meal.excursion_days,
      note: meal.excursion_note || ''
    }];
  }
  return [];
}

export function calculateTotalPaxSums(meal: Partial<MealCalculation>): { totalMorningPax: number; totalEveningPax: number } {
  let totalMorningPax = 0;
  let totalEveningPax = 0;

  const paxCount = meal.pax_count || 0;
  const entryMorning = meal.entry_morning ?? 0.5;
  const entryEvening = meal.entry_evening ?? 0.5;
  const exitMorning = meal.exit_morning ?? 0.5;
  const exitEvening = meal.exit_evening ?? 0;

  if (meal.is_variable_pax && meal.daily_pax && meal.daily_pax.length > 0) {
    const len = meal.daily_pax.length;
    meal.daily_pax.forEach((d, idx) => {
      let mMult = 1;
      let eMult = 1;
      if (idx === 0) {
        mMult = entryMorning > 0 ? 1 : 0;
        eMult = entryEvening > 0 ? 1 : 0;
      }
      if (idx === len - 1) {
        mMult = exitMorning > 0 ? 1 : 0;
        eMult = exitEvening > 0 ? 1 : 0;
      }
      const mPax = d.morning_pax ?? d.pax ?? paxCount;
      const ePax = d.evening_pax ?? d.pax ?? paxCount;
      totalMorningPax += (mPax * mMult);
      totalEveningPax += (ePax * eMult);
    });
  } else {
    // Fixed pax count
    const start = new Date(meal.entry_date || new Date());
    const end = new Date(meal.exit_date || new Date());
    let dayCount = 0;
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dayCount++;
      }
    } else {
      dayCount = (meal.total_days || 1) + 1;
    }
    const mDays = Math.max(0, dayCount - 1 + (entryMorning > 0 ? 0.5 : 0) + (exitMorning > 0 ? 0.5 : 0));
    const eDays = Math.max(0, dayCount - 1 + (entryEvening > 0 ? 0.5 : 0) + (exitEvening > 0 ? 0.5 : 0));
    totalMorningPax = Math.round(paxCount * mDays);
    totalEveningPax = Math.round(paxCount * eDays);
  }

  return { totalMorningPax, totalEveningPax };
}


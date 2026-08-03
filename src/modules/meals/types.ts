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


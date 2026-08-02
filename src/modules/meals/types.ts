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
}

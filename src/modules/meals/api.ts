import { supabase } from '../../lib/supabase';
import type { MealCalculation, CreateMealCalculationDTO } from './types';

export const mealApi = {
  async getAll(region?: string): Promise<MealCalculation[]> {
    let query = supabase
      .from('meal_calculations')
      .select(`
        *,
        companies (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (region) {
      query = query.eq('region', region);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(item => ({
      ...item,
      company_name: item.companies?.name
    }));
  },

  async create(data: CreateMealCalculationDTO): Promise<MealCalculation> {
    const { data: result, error } = await supabase
      .from('meal_calculations')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    return result;
  },

  async update(id: string, data: Partial<MealCalculation>): Promise<MealCalculation> {
    const { data: result, error } = await supabase
      .from('meal_calculations')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('meal_calculations')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};

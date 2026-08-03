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

    if (region && region !== 'all') {
      query = query.eq('region', region);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(item => {
      let dailyPax = item.daily_pax;
      let isVarPax = item.is_variable_pax;
      let note = item.excursion_note;

      if (!dailyPax && note && note.includes('---DAILY_PAX:')) {
        try {
          const parts = note.split('---DAILY_PAX:');
          const meta = JSON.parse(parts[1]);
          dailyPax = meta.daily_pax;
          isVarPax = meta.is_variable_pax;
          note = parts[0].trim();
        } catch (e) {}
      }

      return {
        ...item,
        is_variable_pax: isVarPax,
        daily_pax: dailyPax,
        excursion_note: note,
        company_name: item.companies?.name
      };
    });
  },

  async create(data: CreateMealCalculationDTO): Promise<MealCalculation> {
    const payload: any = { ...data };
    
    if (!payload.is_variable_pax) {
      delete payload.is_variable_pax;
      delete payload.daily_pax;
    }

    const { data: result, error } = await supabase
      .from('meal_calculations')
      .insert([payload])
      .select()
      .single();
    
    if (error) {
      if (error.message?.includes('daily_pax') || error.message?.includes('is_variable_pax') || error.message?.includes('schema cache')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.daily_pax;
        delete fallbackPayload.is_variable_pax;
        
        if (payload.daily_pax && payload.is_variable_pax) {
          const meta = { daily_pax: payload.daily_pax, is_variable_pax: true };
          fallbackPayload.excursion_note = payload.excursion_note 
            ? `${payload.excursion_note}\n---DAILY_PAX:${JSON.stringify(meta)}`
            : `---DAILY_PAX:${JSON.stringify(meta)}`;
        }

        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('meal_calculations')
          .insert([fallbackPayload])
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        return fallbackResult;
      }
      throw error;
    }
    return result;
  },

  async update(id: string, data: Partial<MealCalculation>): Promise<MealCalculation> {
    const payload: any = { ...data };
    delete payload.company_name;

    if (payload.is_variable_pax === false) {
      delete payload.daily_pax;
    }

    const { data: result, error } = await supabase
      .from('meal_calculations')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('daily_pax') || error.message?.includes('is_variable_pax') || error.message?.includes('schema cache')) {
        const fallbackPayload = { ...payload };
        delete fallbackPayload.daily_pax;
        delete fallbackPayload.is_variable_pax;

        if (payload.daily_pax && payload.is_variable_pax) {
          const meta = { daily_pax: payload.daily_pax, is_variable_pax: true };
          let cleanNote = fallbackPayload.excursion_note || '';
          if (cleanNote.includes('---DAILY_PAX:')) {
            cleanNote = cleanNote.split('---DAILY_PAX:')[0].trim();
          }
          fallbackPayload.excursion_note = cleanNote 
            ? `${cleanNote}\n---DAILY_PAX:${JSON.stringify(meta)}`
            : `---DAILY_PAX:${JSON.stringify(meta)}`;
        }

        const { data: fallbackResult, error: fallbackError } = await supabase
          .from('meal_calculations')
          .update(fallbackPayload)
          .eq('id', id)
          .select()
          .single();

        if (fallbackError) throw fallbackError;
        return fallbackResult;
      }
      throw error;
    }
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

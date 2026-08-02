import { forwardRef } from 'react';
import type { MealCalculation } from '../types';
import type { MealExportTemplate } from '../../../core/utils/mealExcelExport';
import { MealTemplatePrintView } from './MealTemplatePrintView';

interface BatchMealPrintViewProps {
  meals: MealCalculation[];
  template?: MealExportTemplate;
}

export const BatchMealPrintView = forwardRef<HTMLDivElement, BatchMealPrintViewProps>(
  ({ meals, template = 'standard' }, ref) => {
    return (
      <div ref={ref} className="bg-white text-black p-4" style={{ width: '100%', minHeight: '100vh', color: '#000', backgroundColor: '#fff' }}>
        {meals.map((meal, index) => (
          <div key={meal.id || index} style={{ pageBreakAfter: index < meals.length - 1 ? 'always' : 'auto', marginBottom: '32px' }}>
            <MealTemplatePrintView meal={meal} template={template} />
          </div>
        ))}
      </div>
    );
  }
);

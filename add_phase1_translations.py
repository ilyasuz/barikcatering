import json
import os

locales = {
    'tr.json': {
        'common': {
            'select': 'Seçiniz...',
            'pagination': {
                'showing': 'Toplam',
                'recordsFrom': 'kayıttan',
                'previous': 'Önceki',
                'next': 'Sonraki'
            }
        }
    },
    'en.json': {
        'common': {
            'select': 'Select...',
            'pagination': {
                'showing': 'Showing',
                'recordsFrom': 'records from total',
                'previous': 'Previous',
                'next': 'Next'
            }
        }
    },
    'ar.json': {
        'common': {
            'select': 'اختر...',
            'pagination': {
                'showing': 'إجمالي',
                'recordsFrom': 'سجلات من',
                'previous': 'السابق',
                'next': 'التالي'
            }
        }
    }
}

base_path = "src/core/i18n/locales"

for file_name, updates in locales.items():
    file_path = os.path.join(base_path, file_name)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'common' not in data:
            data['common'] = {}
            
        # Recursive update for common
        for key, value in updates['common'].items():
            if isinstance(value, dict):
                if key not in data['common']:
                    data['common'][key] = {}
                data['common'][key].update(value)
            else:
                data['common'][key] = value
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("Phase 1 Common translations added successfully.")

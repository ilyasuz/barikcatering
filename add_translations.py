import json
import os

locales = {
    'tr.json': {
        'accounts': 'Kasalar & Bankalar',
        'meals': 'Yemek Hesabı',
        'companies_title': 'Cariler (Şirket/Müşteri)'
    },
    'en.json': {
        'accounts': 'Safes & Banks',
        'meals': 'Food Account',
        'companies_title': 'Current Accounts'
    },
    'ar.json': {
        'accounts': 'الخزائن والبنوك',
        'meals': 'حساب الطعام',
        'companies_title': 'الشركات / العملاء'
    }
}

base_path = "src/core/i18n/locales"

for file_name, translations in locales.items():
    file_path = os.path.join(base_path, file_name)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if 'sidebar' not in data:
            data['sidebar'] = {}
            
        data['sidebar'].update(translations)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

print("Translations added successfully.")

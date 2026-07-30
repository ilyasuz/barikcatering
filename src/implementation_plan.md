# Gelirler Modülü Gelişmiş Özellikler (Aşama 11)

Dayınızın catering firması (Arabistan & Türkiye operasyonları ve kira gelirleri) için özel olarak şekillendirilmiş, gerçek bir ERP hissiyatı verecek gelişmiş özelliklerin uygulanma planı.

## User Review Required

> [!IMPORTANT]
> Aşağıdaki kategoriler ve yeni alanlar sistemin veri tabanına eklenecektir. Bu plan, Gelir tablosunda köklü UI değişiklikleri ve yeni bileşenler içermektedir. Lütfen planı inceleyip onay verin.

## Kategorizasyon (Etiketleme)
Dayınızın iş modeline uygun olarak Gelir tablosuna **Kategori** (Category) alanı eklenecektir.
- Renkli etiketlerle (Badge) gösterilecektir.
- Varsayılan kategoriler: `Catering Hizmetleri`, `Organizasyon`, `Kira Geliri (Dükkan)`, `Kira Geliri (Ev)`, `Diğer`.

## Yeni Özellikler

### 1. Parçalı Tahsilat Takibi (Partial Payments)
- `IncomeRecord` tipine `paidAmount` (Ödenen Tutar) eklenecektir.
- Tabloda "Kalan Tutar" hesaplanacak ve görsel bir ilerleme çubuğu (Progress Bar) eklenecektir.
- Örn: 45.000 SAR tutarındaki catering faturasının 20.000 SAR'lık kısmı tahsil edildiğinde tablo bunu oranlayarak gösterecek.

### 2. Gelişmiş Tarih Filtresi
- `FilterBar` içerisine "Tarih Aralığı Seçici" eklenecektir.
- Kullanıcı başlangıç ve bitiş tarihi vererek filtreleme yapabilecektir.

### 3. Toplu İşlemler (Bulk Actions)
- `DataTable` bileşenine `selectable` (seçilebilir satırlar) özelliği kazandırılacaktır.
- Tablonun en soluna Onay Kutuları (Checkboxes) eklenecek.
- Birden fazla satır seçildiğinde üstte bir işlem çubuğu belirecek ve "Seçilenleri Tamamlandı Olarak İşaretle", "Seçilenleri Sil" gibi işlemler tek tıkla yapılabilecektir.

## Proposed Changes

### Ortak Bileşenler (Core Components)
#### [MODIFY] [DataTable.tsx](file:///d:/Barik%20Muhasebe/src/core/components/DataTable/DataTable.tsx)
- Satır seçimi için `selectable` prop'u eklenecek.
- `onSelectionChange` event'i eklenecek.
- En sol sütuna Checkbox eklenecek.

#### [MODIFY] [FilterBar.tsx](file:///d:/Barik%20Muhasebe/src/core/components/FilterBar/FilterBar.tsx)
- Tarih filtresi için altyapı güncellenecek.

### Gelir Modülü (Income Module)
#### [MODIFY] [types.ts](file:///d:/Barik%20Muhasebe/src/modules/income/types.ts)
- `category` alanı eklenecek (`Catering`, `Kira` vb.)
- `paidAmount` (number) eklenecek.
- `attachments` (string[]) eklenecek.

#### [MODIFY] [IncomeTable.tsx](file:///d:/Barik%20Muhasebe/src/modules/income/components/IncomeTable.tsx)
- Kategori ve Ödenen Tutar (Progress Bar) sütunları tabloya entegre edilecek.
- Toplu işlemler (Bulk Actions) çubuğu state ile kontrol edilecek.
- PDF ve Excel dışa aktarımlarına yeni alanlar dahil edilecek.

#### [MODIFY] [IncomeDrawer.tsx](file:///d:/Barik%20Muhasebe/src/modules/income/components/IncomeDrawer.tsx)
- Yeni gelir ekleme formuna Kategori seçimi eklenecek.
- Tahsil edilen peşin ödeme (paidAmount) için alan eklenecek.

## Verification Plan

### Manual Verification
- Yeni tablo yapısının mevcut arama, filtreleme, PDF ve Excel aktarımları ile uyumlu çalıştığı test edilecektir.
- Yeni eklenen kategorilerin düzgün render edildiği kontrol edilecektir.
- Toplu işlemler çubuğunun seçime göre açılıp kapandığı doğrulanacaktır.

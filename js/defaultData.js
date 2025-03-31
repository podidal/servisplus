// Данные материалов по умолчанию
const defaultMaterials = [
    // Бронепленки толщина 100 мкм (4 mil)
    {
        id: "proffilms-4mil-1524",
        name: "Proffilms Safety 4mil 100мкм 1,524мм",
        price: 130.20,
        widths: [1524]
    },
    {
        id: "armolan-4mil-1830",
        name: "Armolan Safety 4mil 100мкм 1,83м США",
        price: 181.02,
        widths: [1830]
    },
    
    // Бронепленки толщина 200 мкм (8 mil)
    {
        id: "proffilms-8mil-1524",
        name: "Proffilms Safety 8mil 200мкм 1,52м",
        price: 211.68,
        widths: [1524]
    },
    {
        id: "proffilms-8mil-1830",
        name: "Proffilms Safety 8mil 200мкм 1,83м",
        price: 298.20,
        widths: [1830]
    },
    
    // Бронепленки толщина 300 мкм (12 mil)
    {
        id: "proffilms-12mil-1524",
        name: "Proffilms Safety 12mil 300мкм 1,524м",
        price: 314.58,
        widths: [1524]
    },
    {
        id: "armolan-12mil-1830",
        name: "Armolan Safety 12mil 300мкм 1,83м",
        price: 469.56,
        widths: [1830]
    },
    
    // Матовые декоративные пленки
    {
        id: "proffilms-matt-white-1524",
        name: "Proffilms Matt White 1,524м Декоративна плівка матова біла",
        price: 119.28,
        widths: [1524]
    },
    {
        id: "proffilms-matt-white-1830",
        name: "Proffilms Matt White 1,83м Декоративна плівка матова біла",
        price: 156.24,
        widths: [1830]
    },
    
    // Зеркальные пленки
    {
        id: "proffilms-silver-20-50-5-1524",
        name: "Proffilms Silver 20 50 5 1,524м Сонцезахисна дзеркальна плівка",
        price: 119.28,
        widths: [1524]
    },
    {
        id: "proffilms-silver-20-1830",
        name: "Proffilms Silver 20 1,830м Сонцезахисна дзеркальна плівка",
        price: 171.36,
        widths: [1830]
    }
];

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { defaultMaterials };
} 
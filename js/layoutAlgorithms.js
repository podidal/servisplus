// Алгоритмы оптимального раскроя пленки
// Содержит различные алгоритмы размещения прямоугольников на рулоне

// Основная функция, которая вызывает конкретный алгоритм в зависимости от выбранного метода
function applyLayoutAlgorithm(layout, windows, rollWidth, method) {
    switch(method) {
        case 'guillotine':
            applyGuillotinePacking(layout, windows, rollWidth);
            break;
            
        case 'optimal':
            applyBottomLeftPacking(layout, windows, rollWidth);
            break;
            
        case 'advanced-guillotine':
            applyAdvancedGuillotinePacking(layout, windows, rollWidth);
            break;
            
        default:
            // По умолчанию используем гильотинный метод
            applyGuillotinePacking(layout, windows, rollWidth);
    }
}

// 1. ГИЛЬОТИННЫЙ АЛГОРИТМ (GUILLOTINE)
// Простой алгоритм с прямыми резами по всей ширине рулона
function applyGuillotinePacking(layout, windows, rollWidth) {
    // Сортировка окон по высоте (в порядке возрастания)
    windows.sort((a, b) => a.height - b.height);
    
    // Создание горизонтальных полос
    const strips = createHorizontalStrips(windows, rollWidth);
    
    // Позиционирование окон на основе полос
    let currentY = 0;
    strips.forEach(strip => {
        // Позиционирование каждого окна в полосе
        let currentX = 0;
        strip.windows.forEach(window => {
            // Добавление позиции в layout
            layout.positions.push({
                id: window.id,
                x: currentX,
                y: currentY,
                width: window.width,
                height: window.height,
                rotated: window.rotated
            });
            
            // Переход к следующей позиции
            currentX += window.width;
        });
        
        // Переход к следующей полосе
        currentY += strip.height;
    });
    
    // Установка общей длины
    layout.totalLength = currentY;
}

// Вспомогательная функция для создания горизонтальных полос в гильотинном алгоритме
function createHorizontalStrips(windows, rollWidth) {
    const strips = [];
    let remainingWindows = [...windows];
    
    while (remainingWindows.length > 0) {
        const strip = createSingleStrip(remainingWindows, rollWidth);
        strips.push(strip);
        
        // Удаление использованных окон
        strip.windows.forEach(usedWindow => {
            const index = remainingWindows.findIndex(w => 
                w.id === usedWindow.id && 
                w.width === usedWindow.width && 
                w.height === usedWindow.height
            );
            if (index !== -1) {
                remainingWindows.splice(index, 1);
            }
        });
    }
    
    return strips;
}

// Вспомогательная функция для создания одной полосы с алгоритмом Next-Fit-Decreasing-Width
function createSingleStrip(windows, rollWidth) {
    // Сортировка окон по ширине (по убыванию) для этой полосы
    const sortedWindows = [...windows].sort((a, b) => b.width - a.width);
    
    const strip = {
        windows: [],
        width: 0,
        height: 0
    };
    
    for (const window of sortedWindows) {
        // Если это окно помещается в текущую полосу
        if (strip.width + window.width <= rollWidth) {
            // Добавление окна в полосу
            strip.windows.push(window);
            strip.width += window.width;
            // Обновление высоты полосы (все окна в полосе имеют одинаковую высоту)
            strip.height = Math.max(strip.height, window.height);
        }
    }
    
    // Если мы не смогли добавить ни одного окна, берем самое маленькое
    if (strip.windows.length === 0 && sortedWindows.length > 0) {
        const smallestWindow = sortedWindows.reduce((prev, curr) => 
            (prev.width < curr.width) ? prev : curr
        );
        
        strip.windows.push(smallestWindow);
        strip.width = smallestWindow.width;
        strip.height = smallestWindow.height;
    }
    
    return strip;
}

// 2. ОПТИМАЛЬНЫЙ АЛГОРИТМ - BOTTOM-LEFT (OPTIMAL)
// Эффективный алгоритм размещения для минимизации отходов
function applyBottomLeftPacking(layout, windows, rollWidth) {
    // Сортировка по высоте (в порядке убывания) для лучшей упаковки
    windows.sort((a, b) => b.height - a.height);
    
    // Отслеживание размещенных прямоугольников
    const placed = [];
    
    // Отслеживание максимальной координаты Y (которая определяет общую длину)
    let maxYCoordinate = 0;
    
    // Для каждого окна находим лучшую позицию
    for (const window of windows) {
        // Поиск лучшей позиции для этого окна
        const position = findBestPosition(window, rollWidth, placed);
        
        // Обновление максимальной координаты Y
        maxYCoordinate = Math.max(maxYCoordinate, position.y + window.height);
        
        // Добавление размещенного окна
        placed.push({
            x: position.x,
            y: position.y,
            width: window.width,
            height: window.height
        });
        
        // Добавление в layout.positions
        layout.positions.push({
            id: window.id,
            x: position.x,
            y: position.y,
            width: window.width,
            height: window.height,
            rotated: window.rotated
        });
    }
    
    // Установка общей длины
    layout.totalLength = maxYCoordinate;
}

// Вспомогательная функция для поиска лучшей позиции с помощью подхода Bottom-Left с минимизацией пустот
function findBestPosition(window, rollWidth, placedWindows) {
    if (placedWindows.length === 0) {
        // Первое окно размещается в начале координат
        return { x: 0, y: 0 };
    }
    
    // Формирование списка потенциальных точек размещения
    const placementPoints = [];
    
    // Всегда рассматриваем начало координат, если оно свободно
    placementPoints.push({ x: 0, y: 0 });
    
    // Формирование точек размещения в верхнем правом и нижнем левом углах каждого размещенного окна
    placedWindows.forEach(placed => {
        // Верхний правый угол размещенного окна
        placementPoints.push({ 
            x: placed.x + placed.width, 
            y: placed.y 
        });
        
        // Нижний левый угол размещенного окна
        placementPoints.push({ 
            x: 0, 
            y: placed.y + placed.height 
        });
    });
    
    // Фильтрация недопустимых точек размещения (тех, которые привели бы к выходу окна за пределы рулона)
    const validPoints = placementPoints.filter(point => 
        point.x + window.width <= rollWidth
    );
    
    // Поиск лучшей позиции (наименьшая координата y, затем наименьшая координата x в случае совпадения)
    let bestPoint = { x: 0, y: Number.MAX_VALUE };
    
    for (const point of validPoints) {
        // Проверка, не перекрывается ли эта позиция с каким-либо размещенным окном
        let isValid = true;
        
        for (const placed of placedWindows) {
            if (overlaps(point.x, point.y, window.width, window.height, 
                         placed.x, placed.y, placed.width, placed.height)) {
                isValid = false;
                break;
            }
        }
        
        if (isValid) {
            // Поиск наименьшей допустимой позиции для этой координаты x
            let lowestY = point.y;
            
            // Попытка сдвинуть окно вниз как можно дальше
            while (lowestY > 0) {
                let canMoveDown = true;
                
                for (const placed of placedWindows) {
                    if (overlaps(point.x, lowestY - 1, window.width, window.height, 
                                 placed.x, placed.y, placed.width, placed.height)) {
                        canMoveDown = false;
                        break;
                    }
                }
                
                if (canMoveDown) {
                    lowestY--;
                } else {
                    break;
                }
            }
            
            // Проверка, лучше ли эта позиция, чем найденная ранее
            if (lowestY < bestPoint.y || (lowestY === bestPoint.y && point.x < bestPoint.x)) {
                bestPoint = { x: point.x, y: lowestY };
            }
        }
    }
    
    // Если допустимая точка не найдена, размещаем вверху раскладки
    if (bestPoint.y === Number.MAX_VALUE) {
        // Поиск наивысшей точки всех размещенных окон
        const highestY = placedWindows.reduce((max, placed) => 
            Math.max(max, placed.y + placed.height), 0);
        
        bestPoint = { x: 0, y: highestY };
    }
    
    return bestPoint;
}

// Вспомогательная функция для проверки перекрытия двух прямоугольников
function overlaps(x1, y1, w1, h1, x2, y2, w2, h2) {
    // Нет перекрытия, если один прямоугольник находится слева, справа, сверху или снизу от другого
    return !(x1 + w1 <= x2 || x1 >= x2 + w2 || y1 + h1 <= y2 || y1 >= y2 + h2);
}

// 3. РАСШИРЕННЫЙ ГИЛЬОТИННЫЙ АЛГОРИТМ С ПОВТОРНЫМ ИСПОЛЬЗОВАНИЕМ ОСТАТКОВ (ADVANCED GUILLOTINE)
// Алгоритм, который улучшает гильотинный раскрой с возможностью вращения деталей и повторного использования остатков
function applyAdvancedGuillotinePacking(layout, windows, rollWidth) {
    // Копируем окна для обработки
    let remainingWindows = [...windows];
    
    // 1. Сортировка деталей по площади (по убыванию)
    remainingWindows.sort((a, b) => {
        // Основная сортировка по площади
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        
        if (areaA !== areaB) {
            return areaB - areaA; // По убыванию площади
        }
        
        // Если площади равны, сортируем по наибольшей стороне
        const maxSideA = Math.max(a.width, a.height);
        const maxSideB = Math.max(b.width, b.height);
        return maxSideB - maxSideA;
    });
    
    // 2. Инициализация списка доступных остатков
    // Изначально только целый рулон доступен
    // wasteBin содержит остатки, которые можно использовать для размещения окон
    // Формат остатка: {x, y, width, height, origin}, где origin - координаты относительно начала рулона
    const wasteBin = [
        {
            x: 0,        // Локальные координаты внутри остатка
            y: 0,
            width: rollWidth,
            height: Number.MAX_SAFE_INTEGER, // Теоретически бесконечная длина рулона
            origin: {x: 0, y: 0}  // Координаты начала в глобальном пространстве рулона
        }
    ];
    
    // Максимальная используемая координата Y для определения длины рулона
    let maxYCoordinate = 0;
    
    // 3. Пока остались окна для размещения
    while (remainingWindows.length > 0) {
        const currentWindow = remainingWindows.shift(); // Берем самое большое окно
        
        // 4. Поиск лучшего остатка для размещения окна
        let bestFitWasteIndex = -1;
        let bestFitRotation = false;
        let bestFitScore = Number.MAX_SAFE_INTEGER; // Меньше значит лучше
        
        // Проверяем каждый остаток
        for (let i = 0; i < wasteBin.length; i++) {
            const waste = wasteBin[i];
            
            // Пробуем без поворота
            if (currentWindow.width <= waste.width && currentWindow.height <= waste.height) {
                const score = (waste.width - currentWindow.width) * (waste.height - currentWindow.height);
                if (score < bestFitScore) {
                    bestFitWasteIndex = i;
                    bestFitRotation = false;
                    bestFitScore = score;
                }
            }
            
            // Пробуем с поворотом
            if (currentWindow.height <= waste.width && currentWindow.width <= waste.height) {
                const score = (waste.width - currentWindow.height) * (waste.height - currentWindow.width);
                if (score < bestFitScore) {
                    bestFitWasteIndex = i;
                    bestFitRotation = true;
                    bestFitScore = score;
                }
            }
        }
        
        // 5. Размещение окна
        if (bestFitWasteIndex !== -1) {
            // Нашли подходящий остаток
            const waste = wasteBin[bestFitWasteIndex];
            
            // Определяем размеры с учетом возможного поворота
            const windowWidth = bestFitRotation ? currentWindow.height : currentWindow.width;
            const windowHeight = bestFitRotation ? currentWindow.width : currentWindow.height;
            
            // Добавление позиции в layout
            layout.positions.push({
                id: currentWindow.id,
                x: waste.origin.x + waste.x,
                y: waste.origin.y + waste.y,
                width: windowWidth,
                height: windowHeight,
                rotated: bestFitRotation
            });
            
            // Обновляем максимальную координату Y
            maxYCoordinate = Math.max(maxYCoordinate, waste.origin.y + waste.y + windowHeight);
            
            // 6. Генерация новых остатков (гильотинный раскрой)
            // После размещения окна остается максимум 2 новых остатка (по горизонтали и вертикали)
            
            // Удаляем использованный остаток
            wasteBin.splice(bestFitWasteIndex, 1);
            
            // Горизонтальный остаток (справа от окна)
            if (waste.width - windowWidth > 0) {
                const horizontalWaste = {
                    x: waste.x + windowWidth,
                    y: waste.y,
                    width: waste.width - windowWidth,
                    height: windowHeight,
                    origin: {
                        x: waste.origin.x,
                        y: waste.origin.y
                    }
                };
                
                // Добавляем только если остаток достаточно большой для использования
                if (horizontalWaste.width >= 10 && horizontalWaste.height >= 10) {
                    wasteBin.push(horizontalWaste);
                }
            }
            
            // Вертикальный остаток (под окном)
            if (waste.height - windowHeight > 0) {
                const verticalWaste = {
                    x: waste.x,
                    y: waste.y + windowHeight,
                    width: waste.width,
                    height: waste.height - windowHeight,
                    origin: {
                        x: waste.origin.x,
                        y: waste.origin.y
                    }
                };
                
                // Добавляем только если остаток достаточно большой для использования
                if (verticalWaste.width >= 10 && verticalWaste.height >= 10) {
                    wasteBin.push(verticalWaste);
                }
            }
            
            // 7. Оптимизация списка остатков
            optimizeWasteBin(wasteBin);
            
        } else {
            // Не нашли подходящий остаток, начинаем новый сегмент рулона
            
            // Определяем максимальную высоту, чтобы начать новый сегмент
            let newY = maxYCoordinate;
            
            // Выбираем лучшую ориентацию для окна
            let useRotation = false;
            
            // Если окно не помещается по ширине рулона
            if (currentWindow.width > rollWidth && currentWindow.height <= rollWidth) {
                useRotation = true; // Повернуть, если это поможет
            } 
            // Если обе ориентации подходят, выбираем ту, которая лучше использует ширину
            else if (currentWindow.width <= rollWidth && currentWindow.height <= rollWidth) {
                useRotation = (currentWindow.height / rollWidth) > (currentWindow.width / rollWidth);
            } 
            // Если окно не помещается даже при повороте
            else if (currentWindow.width > rollWidth && currentWindow.height > rollWidth) {
                // Окно слишком большое для рулона
                layout.errors.push(`Окно шириной ${currentWindow.width}мм и высотой ${currentWindow.height}мм не помещается на рулон шириной ${rollWidth}мм`);
                continue; // Пропускаем это окно и переходим к следующему
            }
            
            // Определяем размеры с учетом возможного поворота
            const windowWidth = useRotation ? currentWindow.height : currentWindow.width;
            const windowHeight = useRotation ? currentWindow.width : currentWindow.height;
            
            // Добавление позиции в layout
            layout.positions.push({
                id: currentWindow.id,
                x: 0,
                y: newY,
                width: windowWidth,
                height: windowHeight,
                rotated: useRotation
            });
            
            // Обновляем максимальную координату Y
            maxYCoordinate = newY + windowHeight;
            
            // Создаем новый остаток (справа от окна, если окно не занимает всю ширину)
            if (windowWidth < rollWidth) {
                const newWaste = {
                    x: windowWidth,
                    y: 0,
                    width: rollWidth - windowWidth,
                    height: windowHeight,
                    origin: {
                        x: 0,
                        y: newY
                    }
                };
                
                // Добавляем только если остаток достаточно большой
                if (newWaste.width >= 10 && newWaste.height >= 10) {
                    wasteBin.push(newWaste);
                    optimizeWasteBin(wasteBin);
                }
            }
        }
    }
    
    // Устанавливаем общую длину рулона
    layout.totalLength = maxYCoordinate;
}

// Вспомогательная функция для оптимизации списка остатков
function optimizeWasteBin(wasteBin) {
    // 1. Сортировка остатков по y-координате
    wasteBin.sort((a, b) => {
        // Сначала сортируем по y-координате (по возрастанию)
        const totalYA = a.origin.y + a.y;
        const totalYB = b.origin.y + b.y;
        
        if (totalYA !== totalYB) {
            return totalYA - totalYB;
        }
        
        // Если y-координаты равны, сортируем по x-координате
        const totalXA = a.origin.x + a.x;
        const totalXB = b.origin.x + b.x;
        return totalXA - totalXB;
    });
    
    // 2. Объединение смежных остатков с одинаковыми координатами по высоте
    for (let i = 0; i < wasteBin.length - 1; i++) {
        for (let j = i + 1; j < wasteBin.length; j++) {
            const wasteA = wasteBin[i];
            const wasteB = wasteBin[j];
            
            // Проверяем, находятся ли остатки на одной высоте
            const yA = wasteA.origin.y + wasteA.y;
            const yB = wasteB.origin.y + wasteB.y;
            
            if (Math.abs(yA - yB) < 5) { // Допуск 5 мм
                // Проверяем, смежные ли они по ширине
                const xA = wasteA.origin.x + wasteA.x;
                const xB = wasteB.origin.x + wasteB.x;
                
                // Правый край А смежен с левым краем B
                if (Math.abs((xA + wasteA.width) - xB) < 5) {
                    // Если высоты примерно одинаковы, объединяем
                    if (Math.abs(wasteA.height - wasteB.height) < 5) {
                        // Объединяем в A
                        wasteA.width += wasteB.width;
                        
                        // Удаляем B
                        wasteBin.splice(j, 1);
                        j--; // Корректируем индекс
                    }
                }
                // Правый край B смежен с левым краем A
                else if (Math.abs((xB + wasteB.width) - xA) < 5) {
                    // Если высоты примерно одинаковы, объединяем
                    if (Math.abs(wasteA.height - wasteB.height) < 5) {
                        // Объединяем в A
                        wasteA.x = wasteB.x + wasteB.origin.x - wasteA.origin.x;
                        wasteA.width += wasteB.width;
                        
                        // Удаляем B
                        wasteBin.splice(j, 1);
                        j--; // Корректируем индекс
                    }
                }
            }
        }
    }
    
    // 3. Удаление слишком маленьких остатков (меньше 50х50 мм)
    for (let i = wasteBin.length - 1; i >= 0; i--) {
        const waste = wasteBin[i];
        if (waste.width < 50 || waste.height < 50) {
            wasteBin.splice(i, 1);
        }
    }
}

// Экспорт функций для использования в основном коде
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyLayoutAlgorithm,
        applyGuillotinePacking,
        applyBottomLeftPacking,
        applyAdvancedGuillotinePacking
    };
} 
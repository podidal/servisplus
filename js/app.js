// Application state
const appState = {
    windows: [],
    materials: [],  // Будет заполнено из defaultMaterials
    selectedMaterial: null,
    workPrice: 250,
    deliveryPrice: 0,
    layouts: [],
    selectedLayout: null,
    editingMaterialId: null,
    editingWindowId: null, // Добавляем ID редактируемого окна
    layoutMethod: 'hybrid' // default layout method
};

// DOM Elements
const elements = {
    windowWidth: document.getElementById('window-width'),
    windowHeight: document.getElementById('window-height'),
    windowQuantity: document.getElementById('window-quantity'),
    swapDimensions: document.getElementById('swap-dimensions'),
    addWindow: document.getElementById('add-window'),
    updateWindow: document.getElementById('update-window'), // Новая кнопка для обновления окна
    cancelWindowEdit: document.getElementById('cancel-window-edit'), // Кнопка отмены редактирования
    importDimensions: document.getElementById('import-dimensions'),
    importButton: document.getElementById('import-button'),
    windowsList: document.getElementById('windows-list'),
    totalArea: document.getElementById('total-area'),
    layoutResults: document.getElementById('layout-results'),
    layoutVisualization: document.getElementById('layout-visualization'),
    layoutMethod: document.getElementById('layout-method'),
    compareMethods: document.getElementById('compare-methods'),
    materialSelector: document.getElementById('material-selector'),
    workPrice: document.getElementById('work-price'),
    deliveryPrice: document.getElementById('delivery-price'),
    estimateDisplay: document.getElementById('estimate-display'),
    
    // Project export/import
    exportProject: document.getElementById('export-project'),
    importProject: document.getElementById('import-project'),
    
    // Settings elements
    toggleSettings: document.getElementById('toggle-settings'),
    toggleSettingsText: document.getElementById('toggle-settings-text'),
    settingsPanel: document.getElementById('settings-panel'),
    materialsList: document.getElementById('materials-list'),
    materialName: document.getElementById('material-name'),
    materialPrice: document.getElementById('material-price'),
    materialWidths: document.getElementById('material-widths'),
    addMaterial: document.getElementById('add-material'),
    updateMaterial: document.getElementById('update-material'),
    cancelEdit: document.getElementById('cancel-edit')
};

// Helper function for common UI updates after windows change
function updateUIAfterWindowsChange() {
    renderWindowsList();
    calculateLayout();
    calculateEstimate();
}

// Initialize the application
function init() {
    // Load saved materials from localStorage if available
    loadSavedMaterials();
    
    // Populate material selector
    populateMaterialSelector();
    
    // Render materials list
    renderMaterialsList();
    
    // Set default material
    if (appState.materials.length > 0) {
        appState.selectedMaterial = appState.materials[0];
        elements.materialSelector.value = appState.selectedMaterial.id;
    }
    
    // Set default layout method
    elements.layoutMethod.value = appState.layoutMethod;
    
    // Update layout method dropdown with new method
    updateLayoutMethodOptions();
    
    // Add event listeners
    // Window management
    elements.swapDimensions.addEventListener('click', swapDimensions);
    elements.addWindow.addEventListener('click', addWindow);
    elements.importButton.addEventListener('click', importDimensions);
    
    // Добавляем обработчики для кнопок редактирования окон
    if (elements.updateWindow) {
        elements.updateWindow.addEventListener('click', updateWindow);
    }
    if (elements.cancelWindowEdit) {
        elements.cancelWindowEdit.addEventListener('click', cancelWindowEditing);
    }
    
    // Project management
    elements.exportProject.addEventListener('click', exportProject);
    elements.importProject.addEventListener('click', importProject);
    
    // Layout settings
    elements.layoutMethod.addEventListener('change', handleLayoutMethodChange);
    elements.compareMethods.addEventListener('click', compareAllMethods);
    
    // Cost calculation
    elements.materialSelector.addEventListener('change', handleMaterialChange);
    elements.workPrice.addEventListener('input', handleWorkPriceChange);
    elements.deliveryPrice.addEventListener('input', handleDeliveryPriceChange);
    
    // Settings
    elements.toggleSettings.addEventListener('click', toggleSettings);
    elements.addMaterial.addEventListener('click', addMaterial);
    elements.updateMaterial.addEventListener('click', updateMaterial);
    elements.cancelEdit.addEventListener('click', cancelMaterialEdit);
    
    // Add test data button for quick testing (can be removed in production)
    addTestDataButton();
}

// Toggle settings panel visibility
function toggleSettings() {
    const isVisible = elements.settingsPanel.classList.toggle('hidden');
    elements.toggleSettingsText.textContent = isVisible ? 'Показать настройки' : 'Скрыть настройки';
}

// Load saved materials from localStorage
function loadSavedMaterials() {
    const savedMaterials = localStorage.getItem('filmCalculatorMaterials');
    if (savedMaterials) {
        try {
            appState.materials = JSON.parse(savedMaterials);
        } catch (e) {
            console.error('Failed to load saved materials:', e);
            // Если загрузка не удалась, используем материалы по умолчанию
            useDefaultMaterials();
        }
    } else {
        // Если сохраненных материалов нет, используем материалы по умолчанию
        useDefaultMaterials();
    }
}

// Использовать материалы по умолчанию из defaultData.js
function useDefaultMaterials() {
    if (typeof defaultMaterials !== 'undefined') {
        // Копируем материалы из defaultMaterials и преобразуем их ID в числовые для совместимости
        appState.materials = defaultMaterials.map((material, index) => ({
            ...material,
            id: Date.now() + index  // Гарантирует уникальные числовые ID
        }));
    }
}

// Save materials to localStorage
function saveMaterials() {
    try {
        localStorage.setItem('filmCalculatorMaterials', JSON.stringify(appState.materials));
    } catch (e) {
        console.error('Failed to save materials:', e);
    }
}

// Render materials list in settings
function renderMaterialsList() {
    elements.materialsList.innerHTML = '';
    
    appState.materials.forEach(material => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${material.name}</td>
            <td class="px-4 py-2">${material.price}</td>
            <td class="px-4 py-2">${material.widths.join(', ')}</td>
            <td class="px-4 py-2">
                <button class="edit-material-btn px-2 py-1 bg-blue-500 text-white rounded text-sm mr-2" data-id="${material.id}">
                    ✏️ Изменить
                </button>
                <button class="delete-material-btn px-2 py-1 bg-red-500 text-white rounded text-sm" data-id="${material.id}">
                    🗑️ Удалить
                </button>
            </td>
        `;
        elements.materialsList.appendChild(row);
    });
    
    // Add event listeners to edit/delete buttons
    document.querySelectorAll('.edit-material-btn').forEach(btn => {
        btn.addEventListener('click', handleEditMaterial);
    });
    
    document.querySelectorAll('.delete-material-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteMaterial);
    });
}

// Handle edit material button click
function handleEditMaterial(event) {
    const materialId = parseInt(event.target.dataset.id);
    const material = appState.materials.find(m => m.id === materialId);
    
    if (material) {
        // Populate form with material data
        elements.materialName.value = material.name;
        elements.materialPrice.value = material.price;
        elements.materialWidths.value = material.widths.join(', ');
        
        // Show update buttons, hide add button
        elements.addMaterial.classList.add('hidden');
        elements.updateMaterial.classList.remove('hidden');
        elements.cancelEdit.classList.remove('hidden');
        
        // Store editing ID
        appState.editingMaterialId = materialId;
    }
}

// Cancel material editing
function cancelMaterialEdit() {
    // Reset form
    elements.materialName.value = '';
    elements.materialPrice.value = '';
    elements.materialWidths.value = '';
    
    // Hide update buttons, show add button
    elements.addMaterial.classList.remove('hidden');
    elements.updateMaterial.classList.add('hidden');
    elements.cancelEdit.classList.add('hidden');
    
    // Clear editing ID
    appState.editingMaterialId = null;
}

// Generic function to handle deletion with confirmation
function handleDelete(itemId, collection, filterPredicate, confirmMessage, afterDeleteCallback) {
    // Confirm deletion if message is provided
    if (confirmMessage && !confirm(confirmMessage)) {
        return; // User cancelled
    }
    
    // Remove item from collection
    appState[collection] = appState[collection].filter(filterPredicate);
    
    // Execute callback after deletion
    if (afterDeleteCallback) {
        afterDeleteCallback();
    }
}

// Handle delete material button click
function handleDeleteMaterial(event) {
    const materialId = parseInt(event.target.dataset.id);
    
    handleDelete(
        materialId,
        'materials',
        m => m.id !== materialId,
        'Вы уверены, что хотите удалить этот материал?',
        () => {
        // Update UI
        renderMaterialsList();
        populateMaterialSelector();
        
        // Check if deleted material was selected
        if (appState.selectedMaterial && appState.selectedMaterial.id === materialId) {
            // Select first available material or null
            appState.selectedMaterial = appState.materials.length > 0 ? appState.materials[0] : null;
            
            if (appState.selectedMaterial) {
                elements.materialSelector.value = appState.selectedMaterial.id;
            }
            
            // Update calculations
            calculateLayout();
            calculateEstimate();
        }
        
        // Save changes
        saveMaterials();
    }
    );
}

// Handle delete window button click
function handleDeleteWindow(event) {
    const windowId = parseInt(event.target.dataset.id);
    
    handleDelete(
        windowId,
        'windows',
        window => window.id !== windowId,
        null, // No confirmation needed for windows
        updateUIAfterWindowsChange
    );
}

// Helper function to validate and parse material input
function validateAndParseMaterialInput() {
    const name = elements.materialName.value.trim();
    const price = parseFloat(elements.materialPrice.value);
    const widthsText = elements.materialWidths.value.trim();
    
    // Validate inputs
    if (!name || !price || !widthsText) {
        alert('Пожалуйста, заполните все поля');
        return null;
    }
    
    // Parse widths from comma-separated list
    const widths = widthsText.split(',')
        .map(w => parseInt(w.trim()))
        .filter(w => !isNaN(w) && w > 0);
    
    if (widths.length === 0) {
        alert('Пожалуйста, введите хотя бы одну корректную ширину рулона');
        return null;
    }
    
    return { name, price, widths };
}

// Add new material
function addMaterial() {
    const materialData = validateAndParseMaterialInput();
    if (!materialData) return;
    
    const { name, price, widths } = materialData;
    
    // Create new material with unique ID
    const newMaterial = {
        id: Date.now(),
        name,
        price,
        widths
    };
    
    // Add to materials array
    appState.materials.push(newMaterial);
    
    // Reset form
    elements.materialName.value = '';
    elements.materialPrice.value = '';
    elements.materialWidths.value = '';
    
    // Update UI
    renderMaterialsList();
    populateMaterialSelector();
    
    // Save changes
    saveMaterials();
    
    // If this is the first material, select it
    if (appState.materials.length === 1) {
        appState.selectedMaterial = appState.materials[0];
        elements.materialSelector.value = appState.selectedMaterial.id;
        calculateLayout();
        calculateEstimate();
    }
}

// Update existing material
function updateMaterial() {
    if (!appState.editingMaterialId) {
        alert('Ошибка: материал для редактирования не выбран');
        return;
    }
    
    const materialData = validateAndParseMaterialInput();
    if (!materialData) return;
    
    const { name, price, widths } = materialData;
    
    // Find and update material
    const materialIndex = appState.materials.findIndex(m => m.id === appState.editingMaterialId);
    
    if (materialIndex !== -1) {
        appState.materials[materialIndex] = {
            ...appState.materials[materialIndex],
            name,
            price,
            widths
        };
        
        // Reset form and editing state
        cancelMaterialEdit();
        
        // Update UI
        renderMaterialsList();
        populateMaterialSelector();
        
        // If updated material was selected, update calculations
        if (appState.selectedMaterial && appState.selectedMaterial.id === appState.editingMaterialId) {
            appState.selectedMaterial = appState.materials[materialIndex];
            elements.materialSelector.value = appState.selectedMaterial.id;
            calculateLayout();
            calculateEstimate();
        }
        
        // Save changes
        saveMaterials();
    }
}

// Populate the material selector dropdown
function populateMaterialSelector() {
    elements.materialSelector.innerHTML = '';
    
    appState.materials.forEach(material => {
        const option = document.createElement('option');
        option.value = material.id;
        option.textContent = `${material.name} (${material.price} грн/м²)`;
        elements.materialSelector.appendChild(option);
    });
}

// Swap width and height values
function swapDimensions() {
    const temp = elements.windowWidth.value;
    elements.windowWidth.value = elements.windowHeight.value;
    elements.windowHeight.value = temp;
}

// Add a window to the list
function addWindow() {
    const width = parseInt(elements.windowWidth.value);
    const height = parseInt(elements.windowHeight.value);
    const quantity = parseInt(elements.windowQuantity.value);
    
    if (!width || !height || !quantity) {
        alert('Пожалуйста, заполните все поля корректно');
        return;
    }
    
    const window = {
        id: Date.now(), // unique id for each window
        width,
        height,
        quantity,
        area: calculateWindowArea(width, height, quantity)
    };
    
    appState.windows.push(window);
    
    // Reset inputs
    elements.windowWidth.value = '';
    elements.windowHeight.value = '';
    elements.windowQuantity.value = '1';
    
    // Update UI
    updateUIAfterWindowsChange();
    
    // Если кнопки редактирования видны, скрываем их и показываем кнопку добавления
    showAddWindowMode();
}

// Import dimensions from textarea
function importDimensions() {
    const text = elements.importDimensions.value.trim();
    if (!text) {
        alert('Пожалуйста, введите данные для импорта');
        return;
    }
    
    const lines = text.split('\n');
    let importedCount = 0;
    
    lines.forEach(line => {
        const parts = line.split(';');
        
        if (parts.length >= 3) {
            const width = parseInt(parts[0]);
            const height = parseInt(parts[1]);
            const quantity = parseInt(parts[2]);
            
            if (width && height && quantity) {
                const window = {
                    id: Date.now() + importedCount, // unique id for each window
                    width,
                    height,
                    quantity,
                    area: calculateWindowArea(width, height, quantity)
                };
                
                appState.windows.push(window);
                importedCount++;
            }
        }
    });
    
    if (importedCount > 0) {
        elements.importDimensions.value = '';
        updateUIAfterWindowsChange();
        alert(`Импортировано ${importedCount} окон`);
    } else {
        alert('Не удалось импортировать данные. Пожалуйста, проверьте формат (ширина;высота;количество)');
    }
}

// Calculate area of a window in square meters
function calculateWindowArea(width, height, quantity) {
    return (width * height * quantity) / 1000000; // convert from mm² to m²
}

// Render the windows list table
function renderWindowsList() {
    elements.windowsList.innerHTML = '';
    
    appState.windows.forEach((window, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2">${index + 1}</td>
            <td class="px-4 py-2">${window.width}</td>
            <td class="px-4 py-2">${window.height}</td>
            <td class="px-4 py-2">${window.quantity}</td>
            <td class="px-4 py-2">${window.area.toFixed(2)}</td>
            <td class="px-4 py-2">
                <span class="edit-window-btn cursor-pointer mr-2 text-blue-500" data-id="${window.id}">✏️</span>
                <span class="delete-btn cursor-pointer text-red-500" data-id="${window.id}">🗑️</span>
            </td>
        `;
        elements.windowsList.appendChild(row);
    });
    
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-window-btn').forEach(btn => {
        btn.addEventListener('click', handleEditWindow);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDeleteWindow);
    });
    
    // Update total area
    const totalArea = appState.windows.reduce((sum, window) => sum + window.area, 0);
    elements.totalArea.textContent = `${totalArea.toFixed(2)} м²`;
}

// Handle material change
function handleMaterialChange() {
    const materialId = parseInt(elements.materialSelector.value);
    appState.selectedMaterial = appState.materials.find(m => m.id === materialId);
    
    calculateEstimate();
}

// Handle work price change
function handleWorkPriceChange() {
    appState.workPrice = parseFloat(elements.workPrice.value) || 0;
    calculateEstimate();
}

// Handle delivery price change
function handleDeliveryPriceChange() {
    appState.deliveryPrice = parseFloat(elements.deliveryPrice.value) || 0;
    calculateEstimate();
}

// Handle layout method change
function handleLayoutMethodChange(event) {
    appState.layoutMethod = event.target.value;
    calculateLayout();
}

// Helper function to create layouts and select the first one
function createLayoutsAndSelectFirst(rollWidths, methods, windows) {
    // If methods is a string, convert it to array with that single method
    if (typeof methods === 'string') {
        methods = [methods];
    }
    
    // Create layouts for each combination of roll width and method
    const layouts = [];
    
    rollWidths.forEach(rollWidth => {
        methods.forEach(method => {
            layouts.push(calculateSingleLayout(rollWidth, windows, method));
        });
    });
    
    // Sort layouts by efficiency (lowest total length first)
    layouts.sort((a, b) => a.totalLength - b.totalLength);
    
    // Update application state
    appState.layouts = layouts;
    
    // Set first layout as selected by default
    if (layouts.length > 0) {
        appState.selectedLayout = layouts[0];
    }
    
    // Render the layouts
    renderLayoutResults();
    
    // Render visualization for the selected layout
    renderLayoutVisualization(appState.selectedLayout);
}

// Calculate the optimal layout
function calculateLayout() {
    if (appState.windows.length === 0) {
        elements.layoutResults.innerHTML = '<p class="text-gray-500 italic">Добавьте окна для расчета раскроя</p>';
        elements.layoutVisualization.innerHTML = '';
        appState.layouts = [];
        return;
    }
    
    // Get available roll widths from materials
    const rollWidths = [...new Set(appState.materials.flatMap(m => m.widths))];
    
    // Get selected layout method
    const selectedMethod = appState.layoutMethod;
    
    // Create layout calculations for each roll width using the selected method
    createLayoutsAndSelectFirst(rollWidths, selectedMethod, appState.windows);
    
    // Update estimate calculation
    calculateEstimate();
}

// Calculate layout for a single roll width
function calculateSingleLayout(rollWidth, windows, layoutMethod) {
    // Convert roll width from mm to internal units
    const rollWidthMm = rollWidth;
    
    // Calculate total window area (in m²) once - непосредственно из исходных окон
    const totalWindowArea = windows.reduce((sum, window) => 
        sum + (window.width * window.height * window.quantity) / 1000000, 0);
    
    // Create an array of all window instances (expanding quantities)
    let allWindowInstances = [];
    windows.forEach(window => {
        for (let i = 0; i < window.quantity; i++) {
            // Try both orientations and choose the one that fits better
            const normalOrientation = { 
                id: window.id,
                width: window.width,
                height: window.height,
                rotated: false,
                area: (window.width * window.height) / 1000000 // area in m²
            };
            
            const rotatedOrientation = { 
                id: window.id,
                width: window.height,
                height: window.width,
                rotated: true,
                area: (window.width * window.height) / 1000000 // area in m²
            };
            
            const useEfficient = layoutMethod === 'optimal' || layoutMethod === 'hybrid';
            const preferHeight = layoutMethod === 'guillotine';
            
            // Add the orientation that fits best (or can fit at all)
            if (normalOrientation.width <= rollWidthMm && rotatedOrientation.width <= rollWidthMm) {
                // Both orientations fit, choose based on selected method
                if (preferHeight) {
                    // For guillotine cutting, shorter height is better
                    if (normalOrientation.height < rotatedOrientation.height) {
                        allWindowInstances.push(normalOrientation);
                    } else {
                        allWindowInstances.push(rotatedOrientation);
                    }
                } else {
                    // For optimal packing, we prioritize area utilization
                    // Use the orientation that has better width utilization
                    if (normalOrientation.width / rollWidthMm > rotatedOrientation.width / rollWidthMm) {
                        allWindowInstances.push(normalOrientation);
                    } else {
                        allWindowInstances.push(rotatedOrientation);
                    }
                }
            } else if (normalOrientation.width <= rollWidthMm) {
                allWindowInstances.push(normalOrientation);
            } else if (rotatedOrientation.width <= rollWidthMm) {
                allWindowInstances.push(rotatedOrientation);
            } else {
                // Window doesn't fit even when rotated!
                // We'll handle this situation by adding it anyway and marking it as an error
                allWindowInstances.push({
                    ...normalOrientation,
                    error: `Окно шириной ${normalOrientation.width}мм и высотой ${normalOrientation.height}мм не помещается на рулон шириной ${rollWidthMm}мм`
                });
            }
        }
    });
    
    // Check for windows that don't fit
    const errorWindows = allWindowInstances.filter(w => w.error);
    let validWindows = allWindowInstances.filter(w => !w.error);
    
    // Initialize layout data
    const layout = {
        rollWidth: rollWidthMm,
        totalLength: 0,
        positions: [],
        errors: [],
        method: layoutMethod
    };
    
    // Add errors if any
    if (errorWindows.length > 0) {
        errorWindows.forEach(window => {
            layout.errors.push(window.error);
        });
    }
    
    // If there are no valid windows, return early
    if (validWindows.length === 0) {
        layout.totalLength = 0;
        return layout;
    }
    
    // Apply the selected layout algorithm
    applyLayoutAlgorithm(layout, validWindows, rollWidthMm, layoutMethod);
    
    // totalLength в мм
    
    // Округление до ближайших 10 см (0.1 м), преобразование в метры
    // Math.ceil(totalLength / 100) получает число десятков сантиметров
    // Умножаем на 0.1, чтобы получить длину в метрах
    layout.purchaseLength = Math.ceil(layout.totalLength / 100) * 0.1; // в метрах
    
    // Ширина рулона в метрах
    const rollWidthMeters = rollWidthMm / 1000;
    
    // Расчет площади закупки: длина (м) * ширина (м) = площадь (м²)
    layout.purchaseArea = layout.purchaseLength * rollWidthMeters;
    
    // Устанавливаем правильную площадь окон из исходных данных
    layout.windowsArea = totalWindowArea;
    
    // Расчет площади отходов в м²
    layout.wasteArea = Math.max(0, layout.purchaseArea - layout.windowsArea);
    
    // Расчет процента отходов
    layout.wastePercentage = (layout.wasteArea / layout.purchaseArea) * 100;
    
    return layout;
}

// Render layout results comparison
function renderLayoutResults() {
    if (appState.layouts.length === 0) {
        elements.layoutResults.innerHTML = '<p class="text-gray-500 italic">Добавьте окна для расчета раскроя</p>';
        return;
    }
    
    let html = `
        <div class="overflow-x-auto">
            <table class="min-w-full table-auto">
                <thead>
                    <tr class="bg-gray-200">
                        <th class="px-4 py-2">Ширина рулона</th>
                        <th class="px-4 py-2">Метод</th>
                        <th class="px-4 py-2">Необходимая длина</th>
                        <th class="px-4 py-2">Длина для закупки</th>
                        <th class="px-4 py-2">Площадь закупки</th>
                        <th class="px-4 py-2">Отходы</th>
                        <th class="px-4 py-2"></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    appState.layouts.forEach((layout, index) => {
        // Display any error messages
        let errorMessage = '';
        if (layout.errors && layout.errors.length > 0) {
            errorMessage = `<div class="text-red-500 text-sm mt-1">${layout.errors.join('<br>')}</div>`;
        }
        
        const isSelected = appState.selectedLayout === layout;
        const rowClass = isSelected ? 'bg-blue-100' : '';

        // Get method description
        const methodDesc = {
            'guillotine': 'Гильотинный',
            'optimal': 'Максимально эффективный',
            'advanced-guillotine': 'Расширенный гильотинный'
        }[layout.method] || layout.method;
        
        html += `
            <tr class="${rowClass}">
                <td class="px-4 py-2">${layout.rollWidth} мм</td>
                <td class="px-4 py-2">${methodDesc}</td>
                <td class="px-4 py-2">${(layout.totalLength / 1000).toFixed(2)} м</td>
                <td class="px-4 py-2">${layout.purchaseLength.toFixed(1)} м</td>
                <td class="px-4 py-2">${layout.purchaseArea.toFixed(2)} м²</td>
                <td class="px-4 py-2">${layout.wasteArea.toFixed(2)} м² (${layout.wastePercentage.toFixed(1)}%)</td>
                <td class="px-4 py-2">
                    <button class="select-layout-btn px-2 py-1 bg-blue-500 text-white rounded text-sm" data-index="${index}">
                        ${isSelected ? 'Выбрано' : 'Выбрать'}
                    </button>
                </td>
            </tr>
            ${errorMessage ? `<tr><td colspan="7">${errorMessage}</td></tr>` : ''}
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    elements.layoutResults.innerHTML = html;
    
    // Add event listeners to layout select buttons
    document.querySelectorAll('.select-layout-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            const index = parseInt(event.target.dataset.index);
            appState.selectedLayout = appState.layouts[index];
            renderLayoutResults();
            renderLayoutVisualization(appState.selectedLayout);
            calculateEstimate();
        });
    });
}

// Helper function to create edge distance indicators
function createEdgeIndicator(rollContainer, position, layout, scale, edge) {
    // Define properties based on edge type
    let properties;
    
    switch(edge) {
        case 'top':
            const distanceToTop = position.x;
            if (distanceToTop <= 0) return; // Skip if no distance
            
            properties = {
                className: 'edge-distance-indicator top-indicator',
                style: {
                    left: `${position.y * scale}px`,
                    top: `${(layout.rollWidth - position.x) * scale}px`,
                    width: `${position.height * scale}px`,
                    height: `${distanceToTop * scale}px`
                },
                labelText: `↕ ${distanceToTop}мм`
            };
            break;
            
        case 'bottom':
            const distanceToBottom = layout.rollWidth - position.x - position.width;
            if (distanceToBottom <= 0) return; // Skip if no distance
            
            properties = {
                className: 'edge-distance-indicator bottom-indicator',
                style: {
                    left: `${position.y * scale}px`,
                    top: `${(layout.rollWidth - position.x - position.width - distanceToBottom) * scale}px`,
                    width: `${position.height * scale}px`,
                    height: `${distanceToBottom * scale}px`
                },
                labelText: `↕ ${distanceToBottom}мм`
            };
            break;
            
        case 'right':
        case 'left':
            // Эти индикаторы больше не используются, но оставляем код для совместимости
            return;
            
        default:
            return; // Invalid edge type
    }
    
    // Skip very small indicators (less than 10px)
    const width = parseFloat(properties.style.width);
    const height = parseFloat(properties.style.height);
    if (width < 10 || height < 10) return;
    
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.className = properties.className;
    
    // Apply styles
    Object.entries(properties.style).forEach(([property, value]) => {
        indicator.style[property] = value;
    });
    
    // Add label with distance value
    const label = document.createElement('div');
    label.className = 'edge-distance-label';
    
    // Enhance label visibility based on size
    const minDimension = Math.min(width, height);
    if (minDimension < 25) {
        label.style.fontSize = '9px';
        label.style.padding = '1px';
        // For very small indicators, simplify the text
        label.textContent = properties.labelText.replace('мм', '');
    } else if (minDimension > 80) {
        label.style.fontSize = '13px';
        label.style.padding = '3px';
        label.style.fontWeight = 'bold';
        label.textContent = properties.labelText;
    } else {
        label.textContent = properties.labelText;
    }
    
    indicator.appendChild(label);
    
    // Add to container
    rollContainer.appendChild(indicator);
    
    return indicator;
}

// Render layout visualization
function renderLayoutVisualization(layout) {
    if (!layout || !layout.positions || layout.positions.length === 0) {
        elements.layoutVisualization.innerHTML = '<p class="text-gray-500 italic">Нет данных для визуализации</p>';
        return;
    }
    
    // Clear visualization area
    elements.layoutVisualization.innerHTML = '';
    
    // Create main container
    const visualizationContainer = document.createElement('div');
    visualizationContainer.className = 'visualization-container';
    
    // Create a wrapper to allow panning
    const visualizationWrapper = document.createElement('div');
    visualizationWrapper.className = 'visualization-wrapper';
    
    // Create a canvas container for the film roll
    const rollContainer = document.createElement('div');
    rollContainer.className = 'film-roll';
    
    // Create zoom controls
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.innerHTML = `
        <button class="zoom-in-btn" title="Увеличить">+</button>
        <button class="zoom-out-btn" title="Уменьшить">-</button>
        <button class="zoom-reset-btn" title="Сбросить масштаб">↺</button>
        <button class="zoom-fit-btn" title="Показать весь лист">⤢</button>
    `;
    
    // Set fixed dimensions for wrapper
    const wrapperWidth = 1000;
    const wrapperHeight = 450;
    
    visualizationWrapper.style.width = `${wrapperWidth}px`;
    visualizationWrapper.style.height = `${wrapperHeight}px`;
    
    // Устанавливаем film-roll того же размера, что и wrapper
    rollContainer.style.width = `${wrapperWidth}px`;
    rollContainer.style.height = `${wrapperHeight}px`;
    
    // Длина рулона для расчетов масштаба
    const displayLength = layout.totalLength;
    
    // Вычисляем базовый масштаб, чтобы весь раскрой помещался в контейнер
    const fitScaleX = wrapperWidth / displayLength;
    const fitScaleY = wrapperHeight / layout.rollWidth;
    const fitScale = Math.min(fitScaleX, fitScaleY * 0.95);
    
    // Начальный масштаб - подгонка под контейнер
    let scale = fitScale;
    
    // Ограничения масштаба
    const minScale = Math.min(fitScale, 400 / displayLength);
    const maxScale = Math.max(fitScale * 5, 0.5);
    
    // Переменные для перемещения внутри контейнера
    let isPanning = false;
    let startX, startY;
    let contentOffsetX = 0;
    let contentOffsetY = 0;
    
    // Функция для обновления позиций элементов при изменении масштаба
    function updateVisualization(newScale, center = false) {
        // Применяем ограничения масштаба
        newScale = Math.max(minScale, Math.min(newScale, maxScale));
        
        // Если масштаб фактически не изменился, выходим
        if (Math.abs(scale - newScale) < 0.001) return;
        
        scale = newScale;
        
        // Обновляем все прямоугольники окон
        const windowRects = rollContainer.querySelectorAll('.window-rect');
        windowRects.forEach((rect, index) => {
            const pos = layout.positions[index];
            rect.style.left = `${pos.y * scale}px`;
            rect.style.top = `${(layout.rollWidth - pos.width - pos.x) * scale}px`;
            rect.style.width = `${pos.height * scale}px`;
            rect.style.height = `${pos.width * scale}px`;
            
            // Обновляем размер шрифта метки
            const label = rect.querySelector('.window-rect-label');
            const minDimension = Math.min(pos.width, pos.height);
            if (minDimension * scale < 50) {
                label.style.fontSize = '10px';
            } else if (minDimension * scale > 120) {
                label.style.fontSize = '16px';
            } else {
                label.style.fontSize = '14px';
            }
        });
        
        // Очищаем и пересоздаем индикаторы расстояния
        const indicators = rollContainer.querySelectorAll('.edge-distance-indicator');
        indicators.forEach(indicator => indicator.remove());
        
        layout.positions.forEach(pos => {
            createEdgeIndicator(rollContainer, pos, layout, scale, 'top');
            createEdgeIndicator(rollContainer, pos, layout, scale, 'bottom');
        });
        
        // Центрируем содержимое если требуется
        if (center) {
            contentOffsetX = 0;
            contentOffsetY = 0;
            updateContentTransform();
        }
    }
    
    // Функция для обновления трансформации содержимого
    function updateContentTransform() {
        // Получаем все элементы содержимого
        const elements = rollContainer.querySelectorAll('.window-rect, .edge-distance-indicator');
        
        // Применяем трансформацию к каждому элементу
        elements.forEach(el => {
            el.style.transform = `translate(${contentOffsetX}px, ${contentOffsetY}px) scale(1)`;
        });
    }
    
    // Обработчик для кнопки "Показать весь лист"
    function fitToContainer() {
        // Сбрасываем смещение
        contentOffsetX = 0;
        contentOffsetY = 0;
        
        // Обновляем масштаб чтобы все поместилось
        const currentFitScaleX = visualizationWrapper.clientWidth / displayLength;
        const currentFitScaleY = visualizationWrapper.clientHeight / layout.rollWidth;
        const newScale = Math.min(currentFitScaleX, currentFitScaleY * 0.95);
        
        updateVisualization(newScale, true);
    }
    
    // Добавляем прямоугольники окон
    layout.positions.forEach((pos, index) => {
        const rect = document.createElement('div');
        rect.className = 'window-rect';
        
        // Поворачиваем координаты для горизонтальной визуализации
        rect.style.left = `${pos.y * scale}px`;
        rect.style.top = `${(layout.rollWidth - pos.width - pos.x) * scale}px`;
        
        // Меняем местами ширину и высоту для повернутой визуализации
        rect.style.width = `${pos.height * scale}px`;
        rect.style.height = `${pos.width * scale}px`;
        
        // Добавляем метку с размерами
        const label = document.createElement('div');
        label.className = 'window-rect-label';
        label.textContent = `${pos.width}×${pos.height}`;
        
        // Регулируем размер шрифта в зависимости от размера прямоугольника
        const minDimension = Math.min(pos.width, pos.height);
        if (minDimension * scale < 50) {
            label.style.fontSize = '10px';
        } else if (minDimension * scale > 120) {
            label.style.fontSize = '16px';
        } else {
            label.style.fontSize = '14px';
        }
        
        rect.appendChild(label);
        rollContainer.appendChild(rect);
        
        // Показываем индикаторы расстояния до верхнего и нижнего края
        createEdgeIndicator(rollContainer, pos, layout, scale, 'top');
        createEdgeIndicator(rollContainer, pos, layout, scale, 'bottom');
    });
    
    // Добавляем инструкции по перемещению
    const panInstructions = document.createElement('div');
    panInstructions.className = 'pan-instructions';
    panInstructions.textContent = 'Перемещение: зажмите и двигайте мышью';
    
    visualizationWrapper.appendChild(rollContainer);
    visualizationContainer.appendChild(visualizationWrapper);
    visualizationWrapper.appendChild(zoomControls);
    visualizationWrapper.appendChild(panInstructions);
    
    // Добавляем секцию с информацией о визуализации
    const visualizationInfo = document.createElement('div');
    visualizationInfo.className = 'visualization-info';
    visualizationInfo.innerHTML = `
        <div><strong>Ширина рулона:</strong> ${layout.rollWidth} мм</div>
        <div><strong>Длина раскроя:</strong> ${layout.totalLength} мм (${(layout.totalLength / 1000).toFixed(2)} м)</div>
        <div><strong>Длина для закупки:</strong> ${layout.purchaseLength.toFixed(1)} м</div>
        <div>* Оранжевые индикаторы показывают расстояние до края рулона</div>
    `;
    
    // Добавляем к контейнеру
    visualizationContainer.appendChild(visualizationInfo);
    
    // Добавляем к области визуализации
    elements.layoutVisualization.appendChild(visualizationContainer);
    
    // Настраиваем функциональность перемещения
    visualizationWrapper.addEventListener('mousedown', function(e) {
        // Игнорируем, если клик на кнопке
        if (e.target.tagName === 'BUTTON') return;
        
        isPanning = true;
        startX = e.clientX - contentOffsetX;
        startY = e.clientY - contentOffsetY;
        visualizationWrapper.style.cursor = 'grabbing';
        e.preventDefault();
    });
    
    visualizationWrapper.addEventListener('mousemove', function(e) {
        if (!isPanning) return;
        
        // Вычисляем новое смещение
        const newOffsetX = e.clientX - startX;
        const newOffsetY = e.clientY - startY;
        
        // Применяем новое смещение с учетом ограничений
        contentOffsetX = newOffsetX;
        contentOffsetY = newOffsetY;
        
        // Обновляем позицию всех элементов
        updateContentTransform();
    });
    
    function endPanning() {
        isPanning = false;
        visualizationWrapper.style.cursor = 'grab';
    }
    
    visualizationWrapper.addEventListener('mouseup', endPanning);
    visualizationWrapper.addEventListener('mouseleave', endPanning);
    
    // Настройка зума
    const zoomInBtn = visualizationWrapper.querySelector('.zoom-in-btn');
    const zoomOutBtn = visualizationWrapper.querySelector('.zoom-out-btn');
    const zoomResetBtn = visualizationWrapper.querySelector('.zoom-reset-btn');
    const zoomFitBtn = visualizationWrapper.querySelector('.zoom-fit-btn');
    
    zoomInBtn.addEventListener('click', () => {
        updateVisualization(scale * 1.3);
    });
    
    zoomOutBtn.addEventListener('click', () => {
        updateVisualization(scale / 1.3);
    });
    
    zoomResetBtn.addEventListener('click', () => {
        // Сбрасываем масштаб и позицию
        contentOffsetX = 0;
        contentOffsetY = 0;
        updateVisualization(fitScale, true);
    });
    
    zoomFitBtn.addEventListener('click', fitToContainer);
    
    // Добавляем поддержку масштабирования колесиком мыши
    visualizationWrapper.addEventListener('wheel', (e) => {
        e.preventDefault();
        
        // Вычисляем новый масштаб
        const delta = e.deltaY;
        const factor = delta > 0 ? 0.9 : 1.1;
        const newScale = scale * factor;
        
        updateVisualization(newScale);
    }, { passive: false });
    
    // Начальная подгонка содержимого
    fitToContainer();
    
    // Добавляем анимацию с anime.js если доступно
    if (typeof anime !== 'undefined') {
        // Анимируем появление окон
        const windowElements = rollContainer.querySelectorAll('.window-rect');
        anime({
            targets: windowElements,
            opacity: [0, 1],
            scale: [0.8, 1],
            delay: anime.stagger(50),
            duration: 500,
            easing: 'easeOutCubic'
        });
        
        // Анимируем индикаторы расстояния
        const indicatorElements = rollContainer.querySelectorAll('.edge-distance-indicator');
        anime({
            targets: indicatorElements,
            opacity: [0, 0.7],
            scale: [0.9, 1],
            delay: anime.stagger(30, {start: 300}),
            duration: 400,
            easing: 'easeOutCubic'
        });
    }
}

// Calculate and display the estimate
function calculateEstimate() {
    if (appState.windows.length === 0 || !appState.selectedMaterial) {
        elements.estimateDisplay.innerHTML = '<p class="text-gray-500 italic">Добавьте окна для расчета стоимости</p>';
        return;
    }
    
    const totalWindowsArea = appState.windows.reduce((sum, window) => sum + window.area, 0);
    
    let materialCost = 0;
    let materialInfo = '';
    
    // Use the selected layout for material cost calculation
    if (appState.selectedLayout) {
        materialCost = appState.selectedLayout.purchaseArea * appState.selectedMaterial.price;
        materialInfo = `${appState.selectedMaterial.name} (${appState.selectedLayout.purchaseArea.toFixed(2)} м² × ${appState.selectedMaterial.price} грн/м²)`;
    } else {
        // Fallback if no layout is calculated
        const estimatedMaterialArea = totalWindowsArea * 1.2; // Adding 20% for waste as a simple estimation
        materialCost = estimatedMaterialArea * appState.selectedMaterial.price;
        materialInfo = `${appState.selectedMaterial.name} (оценка: ${estimatedMaterialArea.toFixed(2)} м² × ${appState.selectedMaterial.price} грн/м²)`;
    }
    
    const workCost = totalWindowsArea * appState.workPrice;
    const totalCost = materialCost + workCost + appState.deliveryPrice;
    
    elements.estimateDisplay.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full table-auto">
                <thead>
                    <tr class="bg-gray-200">
                        <th class="px-4 py-2">Позиция</th>
                        <th class="px-4 py-2">Стоимость</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td class="px-4 py-2">Материал (${materialInfo})</td>
                        <td class="px-4 py-2">${materialCost.toFixed(2)} грн</td>
                    </tr>
                    <tr>
                        <td class="px-4 py-2">Работы (${appState.workPrice} грн/м² × ${totalWindowsArea.toFixed(2)} м²)</td>
                        <td class="px-4 py-2">${workCost.toFixed(2)} грн</td>
                    </tr>
                    <tr>
                        <td class="px-4 py-2">Доставка</td>
                        <td class="px-4 py-2">${appState.deliveryPrice.toFixed(2)} грн</td>
                    </tr>
                    <tr class="bg-gray-100 font-bold">
                        <td class="px-4 py-2">ИТОГО:</td>
                        <td class="px-4 py-2">${totalCost.toFixed(2)} грн</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// Add a test button for quick demo/testing
function addTestDataButton() {
    // Create a test button
    const testButton = document.createElement('button');
    testButton.textContent = '🧪 Добавить тестовые данные';
    testButton.className = 'fixed bottom-4 right-4 bg-purple-600 text-white p-2 rounded hover:bg-purple-700 shadow-lg';
    testButton.addEventListener('click', loadTestData);
    
    // Add to body
    document.body.appendChild(testButton);
}

// Load test data for quick demonstration
function loadTestData() {
    // Clear existing windows
    appState.windows = [];
    
    // Generate random windows
    const windowCount = Math.floor(Math.random() * 6) + 5; // 5-10 разных типов окон
    
    for (let i = 0; i < windowCount; i++) {
        // Генерация случайных размеров окон в реалистичных пределах
        const width = Math.floor(Math.random() * 1000) + 400; // 400-1400мм
        const height = Math.floor(Math.random() * 1500) + 500; // 500-2000мм
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 штук
        
        appState.windows.push({
            id: Date.now() + Math.random() * 1000,
            width,
            height,
            quantity,
            area: calculateWindowArea(width, height, quantity)
        });
    }
    
    // Update UI
    updateUIAfterWindowsChange();
    
    // Show alert
    alert(`Добавлено ${windowCount} типов окон со случайными размерами`);
}

// Validate the layout algorithm
function validateLayout() {
    // This function is for development purposes to test the layout algorithm
    console.log('Validating layout algorithm...');
    
    // Create a test case
    const testWindows = [
        { id: 1, width: 500, height: 800, quantity: 5, area: calculateWindowArea(500, 800, 5) },
        { id: 2, width: 600, height: 1200, quantity: 3, area: calculateWindowArea(600, 1200, 3) },
        { id: 3, width: 400, height: 400, quantity: 4, area: calculateWindowArea(400, 400, 4) }
    ];
    
    // Test with different roll widths
    const testWidths = [1524, 1830];
    
    testWidths.forEach(width => {
        console.log(`Testing roll width: ${width}mm`);
        const layout = calculateSingleLayout(width, testWindows, 'hybrid');
        console.log('Result:', layout);
        
        // Validate that all windows are included
        const totalWindows = testWindows.reduce((sum, w) => sum + w.quantity, 0);
        console.log(`Total windows: ${totalWindows}, Positions: ${layout.positions.length}`);
        
        // Check if any errors occurred
        if (layout.errors && layout.errors.length > 0) {
            console.warn('Errors:', layout.errors);
        }
    });
}

// Export project to a JSON file
function exportProject() {
    if (appState.windows.length === 0) {
        alert('Добавьте окна в проект перед экспортом');
        return;
    }
    
    // Create project object
    const project = {
        windows: appState.windows,
        selectedMaterialId: appState.selectedMaterial ? appState.selectedMaterial.id : null,
        workPrice: appState.workPrice,
        deliveryPrice: appState.deliveryPrice,
        version: '1.0'
    };
    
    // Convert to JSON
    const jsonString = JSON.stringify(project, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and click it
    const a = document.createElement('a');
    a.href = url;
    a.download = `film-calculator-project-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
}

// Import project from a JSON file
function importProject() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const project = JSON.parse(event.target.result);
                
                // Validate project structure
                if (!project.windows || !Array.isArray(project.windows)) {
                    throw new Error('Неверный формат проекта');
                }
                
                // Load windows
                appState.windows = project.windows;
                
                // Load other settings
                if (typeof project.workPrice === 'number') {
                    appState.workPrice = project.workPrice;
                    elements.workPrice.value = project.workPrice;
                }
                
                if (typeof project.deliveryPrice === 'number') {
                    appState.deliveryPrice = project.deliveryPrice;
                    elements.deliveryPrice.value = project.deliveryPrice;
                }
                
                // Select material if it exists
                if (project.selectedMaterialId) {
                    const material = appState.materials.find(m => m.id === project.selectedMaterialId);
                    if (material) {
                        appState.selectedMaterial = material;
                        elements.materialSelector.value = material.id;
                    }
                }
                
                // Update UI
                updateUIAfterWindowsChange();
                
                alert('Проект успешно импортирован');
                
            } catch (error) {
                console.error('Import error:', error);
                alert(`Ошибка импорта: ${error.message}`);
            }
        };
        
        reader.readAsText(file);
    });
    
    // Trigger file selection
    fileInput.click();
}

// Compare all packing methods
function compareAllMethods() {
    if (appState.windows.length === 0) {
        alert('Добавьте окна для сравнения методов раскроя');
        return;
    }
    
    // Get available roll widths from materials
    const rollWidths = [...new Set(appState.materials.flatMap(m => m.widths))];
    
    // If no roll widths defined, alert the user
    if (rollWidths.length === 0) {
        alert('Добавьте материалы с указанными ширинами рулонов');
        return;
    }
    
    // Используем все доступные ширины рулонов для сравнения
    // Раньше было только: const singleRollWidth = [rollWidths[0]];
    
    // List of available methods
    const availableMethods = [
        'guillotine', 
        'optimal', 
        'advanced-guillotine'
    ];
    
    // Create layout calculations for each method and each roll width
    createLayoutsAndSelectFirst(rollWidths, availableMethods, appState.windows);
    
    // Update estimate calculation
    calculateEstimate();
}

// Функция для обновления выпадающего списка методов раскроя
function updateLayoutMethodOptions() {
    const layoutMethodSelect = elements.layoutMethod;
    
    // Очищаем текущие опции
    layoutMethodSelect.innerHTML = '';
    
    // Добавляем только нужные методы
    const methods = [
        { value: 'guillotine', text: 'Гильотинный' },
        { value: 'optimal', text: 'Максимально эффективный' },
        { value: 'advanced-guillotine', text: 'Расширенный гильотинный' }
    ];
    
    methods.forEach(method => {
        const option = document.createElement('option');
        option.value = method.value;
        option.textContent = method.text;
        layoutMethodSelect.appendChild(option);
    });
    
    // Устанавливаем значение по умолчанию
    if (appState.layoutMethod === 'hybrid' || 
        appState.layoutMethod === 'first-fit' || 
        appState.layoutMethod === 'best-fit' ||
        appState.layoutMethod === 'skyline' ||
        appState.layoutMethod === 'strip-packing') {
        appState.layoutMethod = 'guillotine';
    }
    
    layoutMethodSelect.value = appState.layoutMethod;
}

// Обработчик нажатия на кнопку редактирования окна
function handleEditWindow(event) {
    const windowId = parseInt(event.target.dataset.id);
    const window = appState.windows.find(w => w.id === windowId);
    
    if (window) {
        // Заполняем форму данными окна
        elements.windowWidth.value = window.width;
        elements.windowHeight.value = window.height;
        elements.windowQuantity.value = window.quantity;
        
        // Показываем кнопки редактирования и скрываем кнопку добавления
        showEditWindowMode();
        
        // Запоминаем ID редактируемого окна
        appState.editingWindowId = windowId;
    }
}

// Функция обновления существующего окна
function updateWindow() {
    if (!appState.editingWindowId) {
        alert('Ошибка: окно для редактирования не выбрано');
        return;
    }
    
    const width = parseInt(elements.windowWidth.value);
    const height = parseInt(elements.windowHeight.value);
    const quantity = parseInt(elements.windowQuantity.value);
    
    if (!width || !height || !quantity) {
        alert('Пожалуйста, заполните все поля корректно');
        return;
    }
    
    // Находим индекс окна в массиве
    const windowIndex = appState.windows.findIndex(w => w.id === appState.editingWindowId);
    
    if (windowIndex !== -1) {
        // Обновляем данные окна
        appState.windows[windowIndex] = {
            ...appState.windows[windowIndex],
            width,
            height,
            quantity,
            area: calculateWindowArea(width, height, quantity)
        };
        
        // Сбрасываем форму и режим редактирования
        cancelWindowEditing();
        
        // Обновляем интерфейс
        updateUIAfterWindowsChange();
    }
}

// Отменить редактирование окна
function cancelWindowEditing() {
    // Сбрасываем форму
    elements.windowWidth.value = '';
    elements.windowHeight.value = '';
    elements.windowQuantity.value = '1';
    
    // Показываем режим добавления
    showAddWindowMode();
    
    // Очищаем ID редактируемого окна
    appState.editingWindowId = null;
}

// Переключиться в режим добавления окна
function showAddWindowMode() {
    if (elements.updateWindow) {
        elements.updateWindow.classList.add('hidden');
    }
    if (elements.cancelWindowEdit) {
        elements.cancelWindowEdit.classList.add('hidden');
    }
    elements.addWindow.classList.remove('hidden');
}

// Переключиться в режим редактирования окна
function showEditWindowMode() {
    elements.addWindow.classList.add('hidden');
    if (elements.updateWindow) {
        elements.updateWindow.classList.remove('hidden');
    }
    if (elements.cancelWindowEdit) {
        elements.cancelWindowEdit.classList.remove('hidden');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', init); 
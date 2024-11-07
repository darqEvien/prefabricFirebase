import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
let selectedPrices = [];
let selectedItemsPerCategory = {};
let tagFilters = {}; // To hold tags for all categories
let categoryNames = [];
let selectedTagsPerCategory = {}; // Seçilen etiketleri saklamak için eklenen nesne
let categoriesData = {};
let dimensionsPerCategory = {};
let categoryTotals = {};

// Initialize categories
async function initializeCategories() {
  try {
    categoriesData = await fetchCategoriesData();
    Object.entries(categoriesData).forEach(([categoryName, category]) => {
      if (!category.parentCategory) { // Ana kategori ise
        categoryTotals[categoryName] = {
          price: 0,
          width: 0,
          height: 0,
          items: []
        };
      }
    });
    renderCategories(categoriesData);
    addEventListeners(categoriesData);
    
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}


// Render categories and products on the page
function renderCategories(categoriesData) {
  
  // Önce tüm kategorileri order'a göre sıralayalım
  const sortedCategories = Object.entries(categoriesData)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  // Ana kategorileri render edelim
  for (const [categoryName, category] of sortedCategories) {
    if (!category.parentCategory || category.parentCategory === "") {
      categoryNames.push(categoryName);
      tagFilters[categoryName] = [];

      renderCategory(categoryName, category);
    }
  }
}
// Tek bir kategoriyi render eden yardımcı fonksiyon
function renderCategory(categoryName, category) {
  const categoryHTML = `
    <div class="category-container" id="${categoryName}_container">
      <h3 id="${categoryName}__title">${category.title || "Select"} Seçiniz</h3>
      <div id="${categoryName}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>
    </div>
  `;

  categoriesDiv.insertAdjacentHTML('beforeend', categoryHTML);

  // Sidebar menü butonu
  sideMenu.insertAdjacentHTML(
    "beforebegin",
    `<div class="sidebar-item">
      <button class="button-6" onclick="window.location='#${categoryName}_container'" id="${categoryName}__menu">
        ${category.title}
      </button>
    </div>`
  );

  const container = document.getElementById(categoryName);
  const sortedItems = category.documents.sort((a, b) => a.order - b.order);

  // Ürünleri toplu şekilde ekleyelim
  const itemsHTML = sortedItems.map((item, index) => 
    createItemHtml(categoryName, item, index)
  ).join('');
  
  container.innerHTML = itemsHTML;
}

function renderSubcategoriesRecursively(parentCategoryName, categoriesData) {
  const subcategories = Object.entries(categoriesData)
    .filter(([_, category]) => category.parentCategory === parentCategoryName)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0));

  if (subcategories.length === 0) return;

  const parentContainer = document.getElementById(`${parentCategoryName}_container`);
  if (!parentContainer) return;

  // Mevcut alt kategorileri temizle
  const existingSubcategories = document.querySelectorAll(`[data-parent="${parentCategoryName}"]`);
  existingSubcategories.forEach(el => el.remove());

  // Alt kategorileri render et
  subcategories.forEach(([subCategoryName, subCategory]) => {
    const subCategoryHTML = `
      <div class="subcategory-container" id="${subCategoryName}_container" data-parent="${parentCategoryName}">
        <h3 id="${subCategoryName}__title">${subCategory.title || "Select"} Seçiniz</h3>
        <div id="${subCategoryName}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>
      </div>
    `;
    
    parentContainer.insertAdjacentHTML('beforeend', subCategoryHTML);

    const container = document.getElementById(subCategoryName);
    if (!container) return;

    let sortedItems = subCategory.documents.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Tag filtrelemesi
    const selectedParentItem = selectedItemsPerCategory[parentCategoryName];
    if (selectedParentItem) {
      const parentDiv = selectedParentItem.closest('.focus-item');
      const selectedParentTags = parentDiv.getAttribute("data-tag").split(',').map(t => t.trim());
      
      if (selectedParentTags.length > 0) {
        sortedItems = sortedItems.filter(item => 
          item.tag && selectedParentTags.some(tag => item.tag.includes(tag))
        );
      }
    }

    const itemsHTML = sortedItems.map((item, index) => 
      createItemHtml(subCategoryName, item, index)
    ).join('');
    
    container.innerHTML = itemsHTML;
  });

  addEventListeners(categoriesData);
}
function hideSubcategories(parentCategoryName, categoriesData) {
  const subcategories = document.querySelectorAll(`[data-parent="${parentCategoryName}"]`);
  subcategories.forEach(subcategory => {
    subcategory.remove();
  });
}
function hideSubcategoriesRecursively(categoryName, categoriesData) {
  const subcategories = Object.entries(categoriesData)
    .filter(([_, category]) => category.parentCategory === categoryName);

  subcategories.forEach(([subCategoryName, _]) => {
    const subContainer = document.getElementById(`${subCategoryName}_container`);
    if (subContainer) {
      subContainer.remove();
    }

    if (selectedItemsPerCategory[subCategoryName]) {
      const selectedButton = selectedItemsPerCategory[subCategoryName];
      const mainCategory = getMainCategory(subCategoryName, categoriesData);
      
      if (mainCategory) {
        deselectItem(selectedButton, subCategoryName, mainCategory);
      } else {
        // Ana kategori bulunamadıysa sadece seçimi kaldır
        selectedButton.classList.remove("selected");
        selectedButton.closest(".focus-item")?.classList.remove("selected");
        delete selectedItemsPerCategory[subCategoryName];
        delete selectedTagsPerCategory[subCategoryName];
      }
    }

    hideSubcategoriesRecursively(subCategoryName, categoriesData);
  });
}
// Create product HTML
function createItemHtml(categoryName, item, index) {

  const formattedPrice = (item.price / 1).toLocaleString("tr-TR");
  const tags = Array.isArray(item.tag) ? item.tag.join(',') : item.tag; // Convert tags to string if it's an array

  return `
    <div class="focus-item" id="${categoryName}Div" data-tag="${tags || ''}">
      <div class="ero__ort">
        <div class="title__ort">
          <h2 class="sizes__title">${item.name}</h2>
        </div>
        <img class="product__img content__ort" src="${item.imageUrl}" alt="${item.name}">
      </div>
     <details>
  <summary style="margin: 0 auto;cursor:pointer;display: flex;justify-content: center; font-weight:bold;">Daha Fazla Bilgi</summary>
  <p>${item.description}</p>
</details>
<hr>
      <div class="sizes__desc">
        <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${item.size}m²</span></i>
        <p class="sizes__paragh">Fiyat: ${formattedPrice}₺</p>
        
      </div>
      
      <button data-category="${categoryName}" data-index="${index}" data-price="${item.price}" data-width="${item.width || 0}"
      data-height="${item.height || 0}" class="button-6 proButs">Seç</button>
    </div>`;
}

// Add event listeners to buttons
function addEventListeners(categoriesData) {
  document.querySelectorAll(".proButs").forEach(button => {
    button.addEventListener("click", () => handleItemClick(button, categoriesData));
  });
}
function handleItemClick(button, categoriesData) {
  const categoryName = button.getAttribute("data-category");
  const mainCategory = getMainCategory(categoryName, categoriesData);
  
  if (!mainCategory || button.dataset.processing) return;
  button.dataset.processing = true;

  requestAnimationFrame(() => {
    if (button.classList.contains("selected")) {
      deselectItem(button, categoryName, mainCategory);
      hideSubcategoriesRecursively(categoryName, categoriesData);
    } else {
      const currentSelected = selectedItemsPerCategory[categoryName];
      if (currentSelected) {
        deselectItem(currentSelected, categoryName, mainCategory);
        hideSubcategoriesRecursively(categoryName, categoriesData);
      }

      selectItem(button, categoryName, mainCategory);
      renderSubcategoriesRecursively(categoryName, categoriesData);
    }

    updateAffectedCategories(getAffectedCategories(categoryName, categoriesData), categoriesData);
    updateTotalPrice();
    logCategoryTotals();
    delete button.dataset.processing;
  });
}


function clearSubcategorySelections(parentCategoryName) {
  Object.keys(categoriesData).forEach(categoryName => {
    if (categoriesData[categoryName].parentCategory === parentCategoryName) {
      const selectedButton = selectedItemsPerCategory[categoryName];
      if (selectedButton) {
        const price = parseFloat(selectedButton.getAttribute("data-price"));
        // Sadece görsel ve seçim durumunu güncelle, fiyatı düşür
        selectedButton.classList.remove("selected");
        selectedButton.closest(".focus-item").classList.remove("selected");
        removeSelectedPrice(price);
        delete selectedItemsPerCategory[categoryName];
        delete selectedTagsPerCategory[categoryName];
      }
    }
  });
}
// Select item

function getAffectedCategories(categoryName, categoriesData) {
  const affected = new Set();
  const category = categoriesData[categoryName];

  if (category.parentCategory) {
    // Alt kategori ise, kendisini ve kardeş kategorilerini ekle
    Object.keys(categoriesData).forEach(cat => {
      if (categoriesData[cat].parentCategory === category.parentCategory) {
        affected.add(cat);
      }
    });
  } else {
    // Ana kategori ise, kendisini ve alt kategorilerini ekle
    affected.add(categoryName);
    Object.keys(categoriesData).forEach(cat => {
      if (categoriesData[cat].parentCategory === categoryName) {
        affected.add(cat);
      }
    });
  }

  return Array.from(affected);
}

function updateAffectedCategories(categories, categoriesData) {
  categories.forEach(categoryName => {
    const container = document.getElementById(categoryName);
    if (!container) return;

    const items = container.querySelectorAll('.focus-item');
    const selectedParentCategory = Object.keys(selectedTagsPerCategory).find(cat => 
      !categoriesData[cat].parentCategory && categoriesData[categoryName].parentCategory === cat
    );

    items.forEach(item => {
      if (selectedParentCategory) {
        const itemTags = item.getAttribute("data-tag").split(',').map(t => t.trim());
        const parentTags = selectedTagsPerCategory[selectedParentCategory] || [];
        const hasMatchingTag = parentTags.length === 0 || 
                               itemTags.some(tag => parentTags.includes(tag));
        
        item.style.display = hasMatchingTag ? "grid" : "none";
      } else {
        // Eğer ana kategoride seçim yoksa, tüm ürünleri göster
        item.style.display = "grid";
      }
    });
  });
}
function selectItem(button, categoryName, mainCategory) {
  if (!button.classList.contains("selected")) {
    const price = parseFloat(button.getAttribute("data-price")) || 0;
    const width = parseFloat(button.getAttribute("data-width")) || 0;
    const height = parseFloat(button.getAttribute("data-height")) || 0;
    const parentDiv = button.closest(".focus-item");

    button.classList.add("selected");
    parentDiv.classList.add("selected");
    
    categoryTotals[mainCategory].price += price;
    categoryTotals[mainCategory].width += width;
    categoryTotals[mainCategory].height += height;
    categoryTotals[mainCategory].items.push({
      categoryName,
      price,
      width,
      height,
      button
    });

    selectedItemsPerCategory[categoryName] = button;
    const tags = parentDiv.getAttribute("data-tag").split(',').map(t => t.trim());
    selectedTagsPerCategory[categoryName] = tags;
  }
}
// Deselect item
function deselectItem(button, categoryName, mainCategory) {
  // mainCategory kontrolü ekleyelim
  if (!mainCategory || !categoryTotals[mainCategory]) {
    console.warn(`Ana kategori bulunamadı: ${mainCategory}`);
    return;
  }

  if (button.classList.contains("selected")) {
    const price = parseFloat(button.getAttribute("data-price")) || 0;
    const width = parseFloat(button.getAttribute("data-width")) || 0;
    const height = parseFloat(button.getAttribute("data-height")) || 0;
    const parentDiv = button.closest(".focus-item");

    button.classList.remove("selected");
    parentDiv.classList.remove("selected");

    // Güvenli erişim için kontrol ekleyelim
    if (categoryTotals[mainCategory]) {
      categoryTotals[mainCategory].price -= price;
      categoryTotals[mainCategory].width -= width;
      categoryTotals[mainCategory].height -= height;
      categoryTotals[mainCategory].items = categoryTotals[mainCategory].items
        .filter(item => item.categoryName !== categoryName);
    }

    delete selectedItemsPerCategory[categoryName];
    delete selectedTagsPerCategory[categoryName];
  }
}
function getMainCategory(categoryName, categoriesData) {
  if (!categoryName || !categoriesData[categoryName]) {
    console.warn(`Geçersiz kategori: ${categoryName}`);
    return null;
  }

  const category = categoriesData[categoryName];
  
  if (!category.parentCategory) {
    return categoryName;
  }
  
  // Sonsuz döngü kontrolü ekleyelim
  let maxDepth = 10; // Maksimum derinlik kontrolü
  let currentCategory = category;
  let currentName = categoryName;
  
  while (currentCategory.parentCategory && maxDepth > 0) {
    currentName = currentCategory.parentCategory;
    currentCategory = categoriesData[currentName];
    if (!currentCategory) break;
    maxDepth--;
  }

  return !currentCategory?.parentCategory ? currentName : null;
}

// Toplamları güncelle ve görüntüle
function updateCategoryTotals() {
  Object.entries(categoryTotals).forEach(([mainCategory, totals]) => {
    // Her ana kategori için toplam değerleri güncelle
    const totalDiv = document.getElementById(`${mainCategory}-totals`);
    if (totalDiv) {
      totalDiv.innerHTML = `
        <h3>${categoriesData[mainCategory].title} Toplamları:</h3>
        <p>Fiyat: ${totals.price.toLocaleString()}₺</p>
        <p>Genişlik: ${totals.width.toFixed(2)}m</p>
        <p>Yükseklik: ${totals.height.toFixed(2)}m</p>
      `;
    }
  });

  // Genel toplamı da gösterebiliriz
  const grandTotal = Object.values(categoryTotals).reduce(
    (acc, curr) => acc + curr.price,
    0
  );
  document.getElementById("total").textContent = `${grandTotal.toLocaleString()}₺`;
}
// Toggle item selection
function toggleItemSelection(button, parentDiv, isSelected) {
  button.classList.toggle("selected", isSelected);
  parentDiv.classList.toggle("selected", isSelected);
}

// Remove selected price
function removeSelectedPrice(price) {
  const index = selectedPrices.indexOf(price);
  if (index > -1) {
    selectedPrices.splice(index, 1);
  }
}
// Update total price
function updateTotalPrice() {
  const grandTotal = Object.values(categoryTotals).reduce(
    (acc, curr) => acc + curr.price,
    0
  );
  document.getElementById("total").textContent = `${grandTotal.toLocaleString()}₺`;
}
function logCategoryTotals() {
  console.log("Category Totals:", categoryTotals);
}

// Update tag filters
function updateTagFilters(categoryName, tag, isRemoving = false) {
  if (!tagFilters[categoryName]) {
    tagFilters[categoryName] = [];
  }

  if (isRemoving) {
    tagFilters[categoryName] = tagFilters[categoryName].filter(t => t !== tag);
  } else {
    if (tag && !tagFilters[categoryName].includes(tag)) {
      tagFilters[categoryName].push(tag);
    }
  }

  // Apply tags to next categories
  applyTagsToNextCategories(categoryName);
}

// Apply tags to next categories
function applyTagsToNextCategories(currentCategory) {
  const currentIndex = categoryNames.indexOf(currentCategory);
  const tagsToApply = tagFilters[currentCategory];

  for (let i = currentIndex + 1; i < categoryNames.length; i++) {
    updateFilteredItems(categoryNames[i], tagsToApply);
  }

  // Check and deselect invalid items
  checkAndDeselectInvalidItems();
}

// Filter items based on selected tags
function updateFilteredItems(categoryName, selectedTags) {
  const allItems = document.querySelectorAll(`#${categoryName} .focus-item`);
  const initialCategoryName = Object.keys(selectedTagsPerCategory)[0]; // İlk seçilen kategori

  allItems.forEach(item => {
      const itemTags = item.getAttribute("data-tag").split(',').map(t => t.trim());

      // Eğer ilk kategoriye göre filtreleme yapılıyorsa
      if (initialCategoryName) {
          const initialTags = selectedTagsPerCategory[initialCategoryName] || [];
          const hasMatchingTag = initialTags.some(tag => itemTags.includes(tag));

          // İlk kategoriye göre filtrele
          item.style.display = hasMatchingTag ? "block" : "none";
      } else {
          // Eğer hiçbir kategori seçilmemişse, tüm ürünleri göster
          item.style.display = "block";
      }
  });
}
// Check and deselect invalid items
function checkAndDeselectInvalidItems() {
  const initialCategoryName = Object.keys(selectedTagsPerCategory)[0]; // İlk seçilen kategori
  const initialTags = selectedTagsPerCategory[initialCategoryName] || [];

  for (const categoryName in selectedItemsPerCategory) {
      const selectedItem = selectedItemsPerCategory[categoryName];
      if (selectedItem) {
          const selectedTags = selectedItem.closest('.focus-item').getAttribute('data-tag').split(',').map(t => t.trim());

          // Eğer ilk kategoriye göre geçersizse, iptal et
          const hasValidTag = initialTags.length === 0 || selectedTags.some(tag => initialTags.includes(tag));

          if (!hasValidTag) {
              deselectItem(selectedItem, categoryName, parseFloat(selectedItem.getAttribute("data-price")), selectedItem.closest(`#${categoryName}Div`));
          }
      }
  }

  updateTotalPrice(); // Toplam fiyatı güncelle
}
function updateSelectedDimensions(categoryName, isSelected, width, height) {
  if (isSelected) {
    dimensionsPerCategory[categoryName] = { width, height };
  } else {
    delete dimensionsPerCategory[categoryName];
  }

  // Toplam boyutları hesapla
  let totalWidth = 0;
  let totalHeight = 0;

  Object.values(dimensionsPerCategory).forEach(dim => {
    totalWidth += dim.width;
    totalHeight += dim.height;
  });

  // Global değişkenlere ata veya başka işlemler için kullan
  window.totalWidth = totalWidth;
  window.totalHeight = totalHeight;
}


// Initialize categories on page load
document.addEventListener("DOMContentLoaded", initializeCategories);
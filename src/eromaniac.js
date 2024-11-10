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
          area: 0,
          items: []
        };
      }
    });
    renderCategories(categoriesData);
    addEventListeners(categoriesData);
    updateSelectedProductsDisplay(); // Burada çağırarak güncellemeyi yapabilirsiniz
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
  const category = categoriesData[categoryName];
  let priceDisplay;
  
  if (category.priceFormat === 'metrekare') {
    const formattedBasePrice = (item.price / 1).toLocaleString("tr-TR");
    priceDisplay = `${formattedBasePrice}₺/m²`;
  } 
  else if(category.priceFormat === 'artis'){
    const formattedBasePrice = (item.price / 1).toLocaleString("tr-TR");
    priceDisplay = `${formattedBasePrice}₺/m²`;
  }
  else {
    const formattedPrice = (item.price / 1).toLocaleString("tr-TR");
    priceDisplay = `${formattedPrice}₺`;
  }

  return `
    <div class="focus-item" id="${categoryName}Div" data-tag="${item.tag || ''}">
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
        <p class="sizes__paragh">Fiyat: ${priceDisplay}</p>
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
    
    // Seçilen ürünleri güncelle
    updateSelectedProductsDisplay();

    delete button.dataset.processing;
  });
}
function updateSelectedProductsDisplay() {
  const sonucContainer = document.getElementById("sonuc__container");
  sonucContainer.innerHTML = ""; // Önce içeriği temizle

  // Seçilen ürünleri görüntüle
  Object.entries(categoryTotals).forEach(([mainCategory, totals]) => {
    if (totals.items.length > 0) {
      const categoryDiv = document.createElement("div");
      categoryDiv.innerHTML = `<h3>${mainCategory} Ürünleri:</h3>`;
      
      totals.items.forEach(item => {
        const productDiv = document.createElement("div");
        productDiv.innerHTML = `
          <p>Ürün: ${item.categoryName}</p>
          <p>Fiyat: ${item.price.toLocaleString("tr-TR")}₺</p>
          <p>Boyut: ${item.width} x ${item.height} m</p>
        `;
        categoryDiv.appendChild(productDiv);
      });

      sonucContainer.appendChild(categoryDiv);
    }
  });

  // Form ekleme
  const formHTML = `
    <details>
      <summary style="cursor: pointer; font-weight: bold;">İletişim Bilgileri</summary>
      <form id="contact-form">
        <label for="name">Ad:</label>
        <input type="text" id="name" name="name" required>
        <label for="surname">Soyad:</label>
        <input type="text" id="surname" name="surname" required>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        <label for="phone">Telefon Numarası:</label>
        <input type="tel" id="phone" name="phone" required>
        <button type="submit">Gönder</button>
      </form>
    </details>
  `;
  
  sonucContainer.insertAdjacentHTML('beforeend', formHTML);

  // Sayfayı en alta kaydır
  // sonucContainer.scrollIntoView({ behavior: 'smooth' });
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
function updateAllPrices(mainCategory) {
  const totalArea = categoryTotals[mainCategory].area;
  const currentPerimeter = (categoryTotals[mainCategory].width + categoryTotals[mainCategory].height) * 2;

  // Ana kategorinin toplam fiyatını sıfırla
  categoryTotals[mainCategory].price = 0;

  // Her bir öğe için fiyat hesapla
  categoryTotals[mainCategory].items.forEach(item => {
    const category = categoriesData[item.categoryName];
    let calculatedPrice;

    // Fiyat formatına göre hesaplama yap
    switch (category.priceFormat) {
      case 'metrekare':
        calculatedPrice = item.basePrice * totalArea;
        break;
      case 'cevre':
        calculatedPrice = item.basePrice * currentPerimeter;
        break;
      case 'artis':
        // Artış fiyat hesaplama
        if(item.basePrice > 0 ){
          calculatedPrice = (item.basePrice * totalArea) - (categoryTotals[mainCategory].items.length > 0 ? categoryTotals[mainCategory].items[0].price : 0);
        }
        else{
          calculatedPrice = 0;
        }
        break;
      default:
        calculatedPrice = item.basePrice; // Diğer türler için basePrice kullan
        break;
    }
    

    // Toplam fiyatı güncelle
    categoryTotals[mainCategory].price += calculatedPrice; // Burada calculatedPrice kullanmalıyız
  });

  // Alt kategorilerdeki tüm ürünlerin fiyat gösterimini güncelle
  Object.keys(categoriesData).forEach(categoryName => {
    const category = categoriesData[categoryName];
    if (category.parentCategory === mainCategory) {
      const container = document.getElementById(categoryName);
      if (container) {
        const items = container.querySelectorAll('.focus-item');
        items.forEach(item => {
          const priceElement = item.querySelector('.sizes__paragh');
          const button = item.querySelector('.proButs');
          const basePrice = parseFloat(button.getAttribute("data-price")) || 0;

          // Fiyat formatına göre gösterim yap
          if (category.priceFormat === 'artis') {
            
            const calculatedPrice = (basePrice * totalArea) - (categoryTotals[mainCategory].items.length > 0 ? categoryTotals[mainCategory].items[0].price : 0);
            if (calculatedPrice <= 0) {
              priceElement.textContent = `Fiyat: 0₺`;
            }
            else {
              
              priceElement.textContent = `Fiyat: ${calculatedPrice.toLocaleString("tr-TR")}₺`;
            }
            
          } else if (category.priceFormat === 'metrekare') {
            const calculatedPrice = basePrice * totalArea;
            priceElement.textContent = `Fiyat: ${calculatedPrice.toLocaleString("tr-TR")}₺ (${basePrice.toLocaleString("tr-TR")}₺/m²)`;
          } else {
            priceElement.textContent = `Fiyat: ${basePrice.toLocaleString("tr-TR")}₺`;
          }
        });
      }
    }
  });

  // Toplam fiyatı güncelle
  updateTotalPrice();
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
function calculatePrice(item, category, mainCategory) {
  const width = category.parentCategory 
    ? categoryTotals[mainCategory]?.width || 1 
    : (parseFloat(item.width) || 0) === 0 ? 1 : parseFloat(item.width);
    
  const height = category.parentCategory 
    ? categoryTotals[mainCategory]?.height || 1 
    : (parseFloat(item.height) || 0) === 0 ? 1 : parseFloat(item.height);

  let calculatedPrice;

  switch (category.priceFormat) {
    case 'tekil':
      return 0; // Tekil fiyat görünmeyecek
    case 'metrekare':
      calculatedPrice = item.price * (width * height);
      break;
    case 'cevre':
      calculatedPrice = item.price * ((width + height) * 2);
      break;
    case 'artis':
      calculatedPrice = item.price * (width * height);
      if (item.price < 0){
        return 0;
      }
      else {
        const firstItemPrice = categoryTotals[mainCategory].items.length > 0 
        ? categoryTotals[mainCategory].items[0].price 
        : 0;
        if(calculatePrice > 0 ){
          calculatedPrice -= firstItemPrice; // İlk öğenin fiyatını çıkart
          break;
        }
      }
     
        
    default:
      return 0; // Diğer durumlarda 0 döndür
  }

  // Eğer hesaplanan fiyat 0 veya daha küçükse, fiyatı 0 olarak ayarla
  return calculatedPrice <= 0 ? 0 : calculatedPrice;

 
}
function selectItem(button, categoryName, mainCategory) {
  if (!button.classList.contains("selected")) {
    const basePrice = parseFloat(button.getAttribute("data-price")) || 0;
    const width = parseFloat(button.getAttribute("data-width")) || 0;
    const height = parseFloat(button.getAttribute("data-height")) || 0;
    const parentDiv = button.closest(".focus-item");
    const category = categoriesData[categoryName];

    // Önce boyutları güncelle
    categoryTotals[mainCategory].width += width;
    categoryTotals[mainCategory].height += height;

    // Toplam alanı hesapla
    const totalArea = categoryTotals[mainCategory].width * categoryTotals[mainCategory].height;
    categoryTotals[mainCategory].area = totalArea;

    // Fiyat hesaplama
    let calculatedPrice;
    if (category.priceFormat === 'metrekare') {
      calculatedPrice = basePrice * totalArea;
      const priceElement = parentDiv.querySelector('.sizes__paragh');
      const formattedBasePrice = basePrice.toLocaleString("tr-TR");
      const formattedCalculatedPrice = calculatedPrice.toLocaleString("tr-TR");
      priceElement.textContent = `Fiyat: ${formattedCalculatedPrice}₺ (${formattedBasePrice}₺/m²)`;
    } else if (category.priceFormat === 'cevre') {
      calculatedPrice = basePrice * (2 * (width + height));
    } else {
      calculatedPrice = basePrice;
    }
    button.classList.add("selected");
    parentDiv.classList.add("selected");

    // Hesaplanmış fiyatı ekle
    categoryTotals[mainCategory].price += calculatedPrice;
    categoryTotals[mainCategory].items.push({
      categoryName,
      price: calculatedPrice, // basePrice yerine calculatedPrice kullan
      basePrice, // referans için basePrice'ı da sakla
      width,
      height,
      button
    });

    selectedItemsPerCategory[categoryName] = button;
    const tags = parentDiv.getAttribute("data-tag").split(',').map(t => t.trim());
    selectedTagsPerCategory[categoryName] = tags;

    // Alt kategorilerin fiyatlarını güncelle
    updateAllPrices(mainCategory);
  }
}

function deselectItem(button, categoryName, mainCategory) {
  if (!mainCategory || !categoryTotals[mainCategory]) {
    console.warn(`Ana kategori bulunamadı: ${mainCategory}`);
    return;
  }

  if (button.classList.contains("selected")) {
    const category = categoriesData[categoryName];
    const basePrice = parseFloat(button.getAttribute("data-price")) || 0;
    const width = parseFloat(button.getAttribute("data-width")) || 0;
    const height = parseFloat(button.getAttribute("data-height")) || 0;

    // Önce boyutları güncelle
    categoryTotals[mainCategory].width -= width;
    categoryTotals[mainCategory].height -= height;

    // Yeni toplam alanı hesapla
    const totalArea = categoryTotals[mainCategory].width * categoryTotals[mainCategory].height;
    categoryTotals[mainCategory].area = totalArea;

    // Fiyat hesaplama
    let calculatedPrice;
    if (category.priceFormat === 'metrekare') {
      calculatedPrice = basePrice * totalArea;
    } 
    else if (category.priceFormat === 'artis') {
      // 'artis' fiyat formatı için hesaplama
      calculatedPrice = basePrice * (width * height);}
      else if (category.priceFormat === 'cevre') {
      const currentPerimeter = (categoryTotals[mainCategory].width + categoryTotals[mainCategory].height) * 2;
      calculatedPrice = basePrice * currentPerimeter;
    } else {
      calculatedPrice = basePrice;
    }

    button.classList.remove("selected");
    button.closest(".focus-item").classList.remove("selected");

    // Hesaplanmış fiyatı çıkar
    categoryTotals[mainCategory].price -= calculatedPrice;
    categoryTotals[mainCategory].items = categoryTotals[mainCategory].items
      .filter(item => item.categoryName !== categoryName);

    delete selectedItemsPerCategory[categoryName];
    delete selectedTagsPerCategory[categoryName];

    // Fiyat gösterimini güncelle
    const priceElement = button.closest('.focus-item').querySelector('.sizes__paragh');
    const formattedBasePrice = basePrice.toLocaleString("tr-TR");

    // Fiyat formatına göre farklı gösterim
    switch(category.priceFormat) {
      case 'metrekare':
        priceElement.textContent = `Fiyat: ${formattedBasePrice}₺/m²`;
        break;
      case 'cevre':
        priceElement.textContent = `Fiyat: ${formattedBasePrice}₺`;
        break;
        case 'artis':
        priceElement.textContent = `Fiyat: ${formattedBasePrice}₺/m²`;
        break;
      default: // 'tekil' veya diğer formatlar
        priceElement.textContent = `Fiyat: ${formattedBasePrice}₺`;
    }

    // Tüm fiyatları güncelle
    updateAllPrices(mainCategory);
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
  console.log("Category Totals:", {
    ...categoryTotals,
    details: Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      items: data.items.map(item => ({
        name: item.categoryName,
        basePrice: item.basePrice,
        calculatedPrice: item.calculatedPrice,
        dimensions: `${item.width}x${item.height}`,
        priceFormat: item.priceFormat,
        total: item.calculatedPrice
      }))
    }))
  });
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

function updateSubcategoryPrices(parentCategoryName) {
  const mainCategory = getMainCategory(parentCategoryName, categoriesData);
  const currentTotalArea = categoryTotals[mainCategory].area;
  const currentPerimeter = (categoryTotals[mainCategory].width + categoryTotals[mainCategory].height) * 2;

  Object.keys(categoriesData).forEach(categoryName => {
    if (categoriesData[categoryName].parentCategory === parentCategoryName) {
      const container = document.getElementById(categoryName);
      if (container) {
        const items = container.querySelectorAll('.focus-item');
        items.forEach(item => {
          const priceElement = item.querySelector('.sizes__paragh');
          const button = item.querySelector('.proButs');
          const itemData = categoriesData[categoryName].documents[button.dataset.index];
          const basePrice = parseFloat(itemData.price) || 0;
          
          let calculatedPrice;
          if (categoriesData[categoryName].priceFormat === 'metrekare') {
            calculatedPrice = basePrice * currentTotalArea;
          } else if (categoriesData[categoryName].priceFormat === 'cevre') {
            calculatedPrice = basePrice * currentPerimeter;
          } else {
            calculatedPrice = basePrice;
          }

          const formattedPrice = calculatedPrice.toLocaleString("tr-TR");
          priceElement.textContent = `Fiyat: ${formattedPrice}₺`;
          button.dataset.price = calculatedPrice;
        });
      }
    }
  });
}

// Initialize categories on page load
document.addEventListener("DOMContentLoaded", initializeCategories);
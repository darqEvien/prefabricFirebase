import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
let selectedPrices = [];
let selectedItemsPerCategory = {};
let tagFilters = {}; // To hold tags for all categories
let categoryNames = [];

// Initialize categories
async function initializeCategories() {
  try {
    const categoriesData = await fetchCategoriesData();
    renderCategories(categoriesData);
    addEventListeners(categoriesData);
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}


// Render categories and products on the page
function renderCategories(categoriesData) {
  for (const categoryName in categoriesData) {
    const category = categoriesData[categoryName];
    
    // Sadece parentCategory'si boş veya olmayan kategorileri işle
    if (!category.parentCategory || category.parentCategory === "") {
      categoryNames.push(categoryName);
      tagFilters[categoryName] = [];

      // Kategori başlığı ve konteyner
      categoriesDiv.innerHTML += `
        <h3 id="${categoryName}__title">${category.title || "Select"} Seçiniz</h3>
        <div id="${categoryName}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>`;

      // Sidebar butonu
      sideMenu.insertAdjacentHTML(
        "beforebegin",
        `<div class="sidebar-item">
          <button class="button-6" onclick="window.location='#${categoryName}Div'" id="${categoryName}__menu">${category.title}</button>
        </div>`
      );

      const container = document.getElementById(categoryName);
      const sortedItems = category.documents.sort((a, b) => a.order - b.order);

      // Ürünleri oluştur
      sortedItems.forEach((item, index) => {
        container.innerHTML += createItemHtml(categoryName, item, index);
      });

      // Filtreleri uygula
      updateFilteredItems(categoryName, null);
    }
  }
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
      
      <button data-category="${categoryName}" data-index="${index}" data-price="${item.price}" class="button-6 proButs">Seç</button>
    </div>`;
}

// Add event listeners to buttons
function addEventListeners(categoriesData) {
  document.querySelectorAll(".proButs").forEach(button => {
    button.addEventListener("click", () => handleItemClick(button, categoriesData));
  });
}

// Handle item selection or deselection
function handleItemClick(button, categoriesData) {
  const categoryName = button.getAttribute("data-category");
  const price = parseFloat(button.getAttribute("data-price"));
  const parentDiv = button.closest(".focus-item");
  const isSingleSelect = categoriesData[categoryName].select === "singleSelect";

  if (button.classList.contains("selected")) {
    deselectItem(button, categoryName, price, parentDiv);
    checkAndDeselectInvalidItems(); 
  } else {
   
    if (isSingleSelect && selectedItemsPerCategory[categoryName]) {
      deselectItem(selectedItemsPerCategory[categoryName], categoryName, parseFloat(selectedItemsPerCategory[categoryName].getAttribute("data-price")), selectedItemsPerCategory[ categoryName].closest(`#${categoryName}Div`));
    }

    selectItem(button, categoryName, price, parentDiv);
    checkAndDeselectInvalidItems(); 
  }

  updateTotalPrice();
}

// Select item
let selectedTagsPerCategory = {}; // Seçilen etiketleri saklamak için eklenen nesne

function selectItem(button, categoryName, price, parentDiv) {
    toggleItemSelection(button, parentDiv, true);
    selectedPrices.push(price);
    selectedItemsPerCategory[categoryName] = button;

    const tags = parentDiv.getAttribute("data-tag").split(',').map(t => t.trim());
    
    // Seçilen etiketleri sakla
    selectedTagsPerCategory[categoryName] = tags;

    // Diğer kategorilerdeki tag filtrelerini güncelle
    updateTagFilters(categoryName, tags);
}
// Deselect item
function deselectItem(button, categoryName, price, parentDiv) {
  toggleItemSelection(button, parentDiv, false);
  removeSelectedPrice(price);
  selectedItemsPerCategory[categoryName] = null;

  const tags = parentDiv.getAttribute("data-tag").split(',').map(t => t.trim());
  tags.forEach(tag => updateTagFilters(categoryName, tag, true));
}

// Toggle item selection
function toggleItemSelection(button, parentDiv, isSelected) {
  button.classList.toggle("selected", isSelected);
  parentDiv.classList.toggle("selected", isSelected);
}

// Remove selected price
function removeSelectedPrice(price) {
  const index = selectedPrices.indexOf(price);
  if (index > -1) selectedPrices.splice(index, 1);
}

// Update total price
function updateTotalPrice() {
  const total = selectedPrices.reduce((acc, curr) => acc + curr, 0);
  document.getElementById("total").textContent = `${total.toLocaleString()}₺`;
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

  // Diğer kategorilerdeki görünür ürünleri kontrol et
  checkAndDeselectInvalidItems();
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

// Initialize categories on page load
document.addEventListener("DOMContentLoaded", initializeCategories);
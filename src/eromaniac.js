import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
let selectedPrices = [];
let selectedItemsPerCategory = {};
let tagFilters = {}; // Tüm kategoriler için tag'leri tutacak
let categoryNames = [];

// Kategorileri başlatma
async function initializeCategories() {
  try {
    const categoriesData = await fetchCategoriesData();
    renderCategories(categoriesData);
    addEventListeners(categoriesData);
  } catch (error) {
    console.error("Kategorileri yüklerken hata oluştu:", error);
  }
}

// Kategorileri ve ürünleri sayfaya yerleştirme
function renderCategories(categoriesData) {
  for (const categoryName in categoriesData) {
    const category = categoriesData[categoryName];
    categoryNames.push(categoryName);
    tagFilters[categoryName] = [];

    // Kategori başlığı ve konteyner
    categoriesDiv.innerHTML += `
      <h3 id="${categoryName}__title">${category.title || "Seçiniz"} Seçiniz.</h3>
      <div id="${categoryName}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>`;

    // Sidebar butonu
    sideMenu.insertAdjacentHTML(
      "beforebegin",
      `<div class="sidebar-item">
        <button class="button-6" onclick="window.location='#${categoryName}Div'" id="${categoryName}__menu">${category.title}</button>
      </div>`
    );

    const container = document.getElementById(categoryName);

    // Ürünleri oluşturma
    category.documents.forEach((item, index) => {
      container.innerHTML += createItemHtml(categoryName, item, index);
    });

    // Filtreleri uygula
    updateFilteredItems(categoryName, null);
  }
}

// Ürün HTML'ini oluşturma
function createItemHtml(categoryName, item, index) {
  const formattedPrice = (item.price / 1).toLocaleString("tr-TR");
  return `
    <div class="focus-item" id="${categoryName}Div" data-tag="${item.tag || ''}">
      <div class="ero__ort">
        <div class="title__ort">
          <h2 class="sizes__title">${item.name}</h2>
        </div>
        <img class="product__img content__ort" src="${item.imageUrl}" alt="${item.name}">
      </div>
      <div class="sizes__desc">
        <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${item.size}m²</span></i>
        <p class="sizes__paragh">Fiyat: ${formattedPrice}₺</p>
      </div>
      <button data-category="${categoryName}" data-index="${index}" data-price="${item.price}" class="button-6 proButs">Seç</button>
    </div>`;
}

// Butonlara tıklama olaylarını ekleme
function addEventListeners(categoriesData) {
  document.querySelectorAll(".proButs").forEach(button => {
    button.addEventListener("click", () => handleItemClick(button, categoriesData));
  });
}

// Ürün seçimi veya seçimin kaldırılması
function handleItemClick(button, categoriesData) {
  const categoryName = button.getAttribute("data-category");
  const price = parseFloat(button.getAttribute("data-price"));
  const parentDiv = button.closest(`#${categoryName}Div`);
  const isSingleSelect = categoriesData[categoryName].select === "singleSelect";

  // Eğer ürün görünür durumdaysa veya tag filtrelenmiş olsa bile seçime izin ver
  if (button.classList.contains("selected")) {
    deselectItem(button, categoryName, price, parentDiv);
  } else {
    // SingleSelect ise, başka bir ürün seçiliyse onu kaldır
    if (isSingleSelect && selectedItemsPerCategory[categoryName]) {
      deselectItem(selectedItemsPerCategory[categoryName], categoryName, parseFloat(selectedItemsPerCategory[categoryName].getAttribute("data-price")), selectedItemsPerCategory[categoryName].closest(`#${categoryName}Div`));
    }
    // Ürünü seç
    selectItem(button, categoryName, price, parentDiv);
  }

  updateTotalPrice();
}

// Ürün seçimi
function selectItem(button, categoryName, price, parentDiv) {
  toggleItemSelection(button, parentDiv, true);
  selectedPrices.push(price);
  selectedItemsPerCategory[categoryName] = button;

  const tag = parentDiv.getAttribute("data-tag");
  // Eğer tag yoksa veya ürün tag'e uygun değilse yine de ekleyebiliriz
  if (!tagFilters[categoryName] || !tagFilters[categoryName].length || tagFilters[categoryName].includes(tag)) {
    updateTagFilters(categoryName, tag);
  }
}

// Ürün seçimini kaldırma
function deselectItem(button, categoryName, price, parentDiv) {
  toggleItemSelection(button, parentDiv, false);
  removeSelectedPrice(price);
  selectedItemsPerCategory[categoryName] = null;

  const tag = parentDiv.getAttribute("data-tag");
  updateTagFilters(categoryName, tag, true);
}

// Ürün seçim görselliğini değiştirme
function toggleItemSelection(button, parentDiv, isSelected) {
  button.classList.toggle("selected", isSelected);
  parentDiv.classList.toggle("selected", isSelected);
}

// Fiyat güncelleme
function removeSelectedPrice(price) {
  const index = selectedPrices.indexOf(price);
  if (index > -1) selectedPrices.splice(index, 1);
}

// Toplam fiyat güncelleme
function updateTotalPrice() {
  const total = selectedPrices.reduce((acc, curr) => acc + curr, 0);
  document.getElementById("total").textContent = `${total.toLocaleString()}₺`;
}

// Tag filtreleme güncellemesi
function updateTagFilters(categoryName, tag, isRemoving = false) {
  if (!tagFilters[categoryName]) {
    tagFilters[categoryName] = [];
  }

  if (isRemoving) {
    tagFilters[categoryName] = tagFilters[categoryName].filter(t => t !== tag);
  } else {
    // Eğer tag yoksa bile ekleme işlemi yapılabilir
    if (tag && !tagFilters[categoryName].includes(tag)) {
      tagFilters[categoryName].push(tag);
    }
  }
  console.log(tagFilters)
  applyTagsToNextCategories(categoryName);
  checkAndDeselectInvalidItems();
}

// Sonraki kategorilere tag'leri uygulama
function applyTagsToNextCategories(currentCategory) {
  const currentIndex = categoryNames.indexOf(currentCategory);
  const tagsToApply = tagFilters[currentCategory];

  for (let i = currentIndex + 1; i < categoryNames.length; i++) {
    updateFilteredItems(categoryNames[i], tagsToApply);
  }
}

// Seçilen taglere göre ürünleri filtreleme
function updateFilteredItems(categoryName, selectedTags) {
  const allItems = document.querySelectorAll(`#${categoryName} .focus-item`);
  let hasMatchingTag = false;

  allItems.forEach(item => {
    const itemTag = item.getAttribute("data-tag");

    if (selectedTags && !selectedTags.includes(itemTag)) {
      item.style.display = "none"; // Uygun olmayan tag'ler gizlenir
    } else {
      item.style.display = "block"; // Uygun ürünler veya tag yoksa tümü gösterilir
      hasMatchingTag = true;
    }
  });

  // Eğer seçilen tag ile eşleşen ürün yoksa tüm ürünleri göster
  if (!hasMatchingTag) {
    allItems.forEach(item => item.style.display = "block");
  }
}

// Seçilen taglere uymayan ürünlerin seçimini kaldırma ve fiyatı güncelleme
function checkAndDeselectInvalidItems() {
  for (const categoryName in selectedItemsPerCategory) {
    const selectedItem = selectedItemsPerCategory[categoryName];
    if (selectedItem) {
      const selectedTag = selectedItem.closest('.focus-item').getAttribute('data-tag');
      const applicableTags = tagFilters[categoryNames[0]]; // İlk kategorideki seçilen tag'ler

      // Eğer tag yoksa veya uygun değilse seçimi kaldır, ama burada "null" ise de seçime izin veriyoruz
      if (applicableTags && applicableTags.length && !applicableTags.includes(selectedTag)) {
        // Tag yoksa seçimi kaldırma
        if (selectedTag) {
          deselectItem(selectedItem, categoryName, parseFloat(selectedItem.getAttribute("data-price")), selectedItem.closest(`#${categoryName}Div`));
        }
      }
    }
  }

  updateTotalPrice(); // Fiyat güncellemesi
}

// Sayfa yüklendiğinde kategorileri başlat
initializeCategories();

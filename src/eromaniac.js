import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
let selectedPrices = [];
let selectedItemsPerCategory = {};
let tagFilters = {}; // To hold tags for all categories
let categoryNames = [];
let selectedCategories = [];
let selectedTagsPerCategory = {}; // Seçilen etiketleri saklamak için eklenen nesne
let categoriesData = {};
let dimensionsPerCategory = {};
let categoryTotals = {};
let currentWidth;
let currentHeight;

// Initialize categories
async function initializeCategories() {
  try {
    categoriesData = await fetchCategoriesData();
    Object.entries(categoriesData).forEach(([categoryName, category]) => {
      if (!category.parentCategory) {
        categoryTotals[categoryName] = {
          title: category.title,
          img: category.imageUrl || "",
          price: 0,
          width: 0,
          height: 0,
          previousArea: 0,
          area: 0,
          items: [],
          parentCategory: category.parentCategory,
          catTag: category.tags,
        };
      }
    });

    // Initialize with the 'konti' tag
    selectedCategories.push("genel");

    console.log(selectedCategories); // Debugging to see if 'konti' is added

    renderCategories(categoriesData);
    filterCategoriesByTags(); // Ensure this is called after rendering categories
    addEventListeners(categoriesData);
    updateSelectedProductsDisplay();
  } catch (error) {
    console.error("Error loading categories:", error);
  }
}

// Render categories and products on the page
function renderCategories(categoriesData) {
  // Önce tüm kategorileri order'a göre sıralayalım
  const sortedCategories = Object.entries(categoriesData).sort(
    (a, b) => (a[1].order || 0) - (b[1].order || 0)
  );

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
      <div id="${categoryName}" class="focus-grid"></div>
    </div>
  `;

  categoriesDiv.insertAdjacentHTML("beforeend", categoryHTML);

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
  const itemsHTML = sortedItems
    .map((item, index) => createItemHtml(categoryName, item, index))
    .join("");

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
  existingSubcategories.forEach((el) => el.remove()); 

  // Alt kategorileri render et 
  subcategories.forEach(([subCategoryName, subCategory]) => { 
      const subCategoryHTML = ` 
          <div class="subcategory-container" id="${subCategoryName}_container" data-parent="${parentCategoryName}"> 
              <h3 id="${subCategoryName}__title">${subCategory.title || "Select"} Seçiniz</h3> 
              <div id="${subCategoryName}" class="focus-grid"></div> 
          </div>`; 

      parentContainer.insertAdjacentHTML("beforeend", subCategoryHTML); 

      const container = document.getElementById(subCategoryName); 
      if (!container) return; 

      let sortedItems = subCategory.documents.sort( 
          (a, b) => (a.order || 0) - (b.order || 0) 
      ); 

      // Tag filtrelemesi 
      const selectedParentItem = selectedItemsPerCategory[parentCategoryName]; 
      if (selectedParentItem) { 
          const parentDiv = selectedParentItem.closest(".focus-item"); 
          const selectedParentTags = parentDiv 
              .getAttribute("data-tag") 
              .split(",") 
              .map((t) => t.trim()); 

          if (selectedParentTags.length > 0) { 
              sortedItems = sortedItems.filter( 
                  (item) => 
                      item.tag && selectedParentTags.some((tag) => item.tag.includes(tag)) 
              ); 
          } 
      } 

      // Ürünleri toplu şekilde ekleyelim 
      sortedItems.forEach((item, index) => {
          const itemHTML = createItemHtml(subCategoryName, item, index);
          container.insertAdjacentHTML("beforeend", itemHTML); // Her bir focus-item'ı focus-grid içine ekleyin
      });
  }); 

  addEventListeners(categoriesData); 
}

function hideSubcategoriesRecursively(categoryName, categoriesData) {
  const subcategories = Object.entries(categoriesData).filter(
    ([_, category]) => category.parentCategory === categoryName
  );

  subcategories.forEach(([subCategoryName, _]) => {
    const subContainer = document.getElementById(
      `${subCategoryName}_container`
    );
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
  const mainCategory = getMainCategory(categoryName, categoriesData); // Ana kategoriyi al
  const mainCategoryTotals = categoryTotals[mainCategory] || {}; // Ana kategorinin toplamlarını al

  let priceDisplay;
  let itemHTML = "";
  let dynamicSize = 0;
  const first = Array.isArray(item.imageUrl) ? item.imageUrl[0] : item.imageUrl; 

  if (category.priceFormat === "metrekare") {
    const formattedBasePrice = (item.price / 1).toLocaleString("tr-TR");
    priceDisplay = `${formattedBasePrice}₺/m²`;
  } else if (category.priceFormat === "artis") {
    const currentWidth = parseFloat(mainCategoryTotals.width) || 0;
    const currentHeight = parseFloat(mainCategoryTotals.height) || 0;
    const itemWidth = parseFloat(item.width) || 0;
    const itemHeight = parseFloat(item.height) || 0;

    // Dinamik alan hesaplama
    dynamicSize = (currentWidth + itemWidth) * (currentHeight + itemHeight);

    // Dinamik boyut güncellemesi
    item.size = dynamicSize; // Öğenin boyutunu güncelle
    const formattedBasePrice = (item.price / 1).toLocaleString("tr-TR");
    priceDisplay = `${formattedBasePrice}₺/m²`;
  } else {
    const formattedPrice = (item.price / 1).toLocaleString("tr-TR");
    priceDisplay = `${formattedPrice}₺`;
  }

  switch (category.priceFormat) {
    case "metrekare":
      itemHTML = `
        <div class="focus-item" id="${categoryName}Div" data-tag="${
        item.tag || ""
      }">
          <div class="ero__ort">
            <div class="title__ort">
              <h2 class="sizes__title">${item.name}</h2>
            </div>
            <div  class="itemImg" style="background: url(${
              item.images[0]
            }); background-size:contain; background-repeat:no-repeat; background-position:center;"></div>
          </div>
          <details>
            <summary style="margin: 0 auto; cursor:pointer; display: flex; justify-content: center; font-weight:bold;">Daha Fazla Bilgi</summary>
            <p>${item.description}</p>
          </details>
          <hr>
          <div class="sizes__desc">
            <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${
              item.size
            }m²</span></i>
            <p class="sizes__paragh">Fiyat: 0tl</p>
          </div>
          <button data-category="${categoryName}" data-img="${
        item.imageUrl
      }" data-index="${index}" data-price="${item.price}" data-width="${
        item.width || 0
      }" data-height="${item.height || 0}" data-tag="${
        item.tag
      }"  class="button-6 proButs">Seç</button>
        </div>`;
      break;

    case "artis":
      const currentWidth = parseFloat(mainCategoryTotals.width) || 0;
      const currentHeight = parseFloat(mainCategoryTotals.height) || 0;
      const itemWidth = parseFloat(item.width) || 0;
      const itemHeight = parseFloat(item.height) || 0;

      const newWidth = currentWidth + itemWidth;
      const newHeight = currentHeight + itemHeight;
      item.size = newWidth * newHeight; // Öğenin boyutunu güncelle

      itemHTML = `
        <div class="focus-item" id="${categoryName}Div" data-tag="${
        item.tag || ""
      }">
          <div class="ero__ort">
            <div class="title__ort">
              <h2 class="sizes__title">${item.name}</h2>
            </div>
        <div  class="itemImg" style="background: url(${
              item.images[0]
            }); background-size:contain; background-repeat:no-repeat; background-position:center;"></div>
          <details>
            <summary style="margin: 0 auto; cursor:pointer; display: flex; justify-content: center; font-weight:bold;">Daha Fazla Bilgi</summary>
            <p>${item.description}</p>
          </details>
          <hr>
          <div class="sizes__desc"><div class="alanText" style="font-weight:bold;">Alan: <br>
            <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${dynamicSize}m²</span></i></div>
            <p class="sizes__paragh">Fiyat: ${item.price.toLocaleString(
              "tr-TR"
            )}₺/m²</p>
          </div>
          <button data-category="${categoryName}" data-img="${
        item.imageUrl
      }" data-index="${index}" data-price="${item.price}" data-width="${
        item.width || 0
      }" data-height="${item.height || 0}" data-tag="${item.tag}" data-name="${
        item.name
      }" class="button-6 proButs">Seç</button>
        </div>`;
      break;

    case "cevre":
      itemHTML = `
        <div class="focus-item" id="${categoryName}Div" data-tag="${
        item.tag || ""
      }">
          <div class="ero__ort">
            <div class="title__ort">
              <h2 class="sizes__title">${item.name}</h2>
            </div>
           <div  class="itemImg" style="background: url(${
              item.images[0]
            })background-size:contain; background-repeat:no-repeat; background-position:center;"></div>
          <details>
            <summary style="margin: 0 auto; cursor:pointer; display: flex; justify-content: center; font-weight:bold;">Daha Fazla Bilgi</summary>
            <p>${item.description}</p>
          </details>
          <hr>
          <div class="sizes__desc">
            <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${
              item.size
            }m²</span></i>
            <p class="sizes__paragh">Fiyat: ${item.price.toLocaleString(
              "tr-TR"
            )}₺/m</p>
          </div>
          <button data-category="${categoryName}" data-img="${
        item.imageUrl
      }" data-index ="${index}" data-price="${item.price}" data-width="${
        item.width || 0
      }" data-height="${item.height || 0}" data-tag="${
        item.tag
      }" class="button-6 proButs">Seç</button>
        </div>`;
      break;

    case "tekil":
      itemHTML = `
        <div class="focus-item" id="${categoryName}Div" data-tag="${
        item.tag || ""
      }">
          <div class="ero__ort">
            <div class="title__ort">
              <h2 class="sizes__title">${item.name}</h2>
            </div>
            <div class="details-btn" data-item='${JSON.stringify(item)}'style="background: url(${item.images[0]}); 
            height:30vh; background-size:contain; background-repeat:no-repeat; background-position:center; cursor:pointer; text-align:center; "></div>
          </div>
          <div id="details">
          
           <button class="details-btn" data-item='${JSON.stringify(item)}' id="details-btn"  >Daha Fazla Bilgi</button>
           </div>
           

          <hr>
          <div class="sizes__desc">
            <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${
              item.size
            }m²</span></i>
            <p class="sizes__paragh">Fiyat: ${item.price.toLocaleString(
              "tr-TR"
            )}₺</p>
          </div>
          <button data-category="${categoryName}" data-img="${
        item.images[0]
      }" data-index="${index}" data-price="${item.price}" data-width="${
        item.width || 0
      }" data-height="${item.height || 0}" data-tag="${
        item.tag
      }" class="button-6 proButs">Seç</button>
        </div>`;

      break;

    case "tasDuvar":
      itemHTML = `
        <div class="focus-item" id="${categoryName}Div" data-tag="${
        item.tag || ""
      }">
          <div class="ero__ort">
            <div class="title__ort">
              <h2 class="sizes__title">${item.name}</h2>
            </div>
            <div  class="itemImg" style="background: url(${
              item.images[0]
            }); background-size:contain; background-repeat:no-repeat; background-position:center;"></div>
          <details>
            <summary style="margin: 0 auto; cursor:pointer; display: flex; justify-content: center; font-weight:bold;">Daha Fazla Bilgi</summary>
            <p>${item.description}</p>
          </details>
          <hr>
          <div class="sizes__desc">
            <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${
              item.size
            }m²</span></i>
            <p class="sizes__paragh">Fiyat: ${item.price.toLocaleString(
              "tr-TR"
            )}₺</p>
          </div>
          <button data-category="${categoryName}" data-img="${
        item.imageUrl
      }" data-index="${index}" data-price="${item.price}" data-alan-price="${
        item.alanPrice
      }" data-width="${item.width || 0}" data-height="${
        item.height || 0
      }" data-tag="${item.tag}" class="button-6 proButs">Seç</button>
        </div>`;
      break;

    default:
      itemHTML = `
        <div class="focus-item" id="${categoryName}Div" data-tag="${
        item.tag || ""
      }">
          <div class="ero__ort">
            <div class="title__ort">
              <h2 class="sizes__title">${item.name}</h2>
            </div>
            <div  class="itemImg" style="background: url(${
              item.images[0]
            }); background-size:contain; background-repeat:no-repeat; background-position:center;"></div>
          <details>
            <summary style="margin: 0 auto; cursor:pointer; display: flex; justify-content: center; font-weight:bold;">Daha Fazla Bilgi</summary>
            <p>${item.description}</p>
          </details>
          <hr>
          <div class="sizes__desc">
            <i class="fa-solid fa-ruler-combined"><span class="sizes__size">${
              item.size
            }m²</span></i>
            <p class="sizes__paragh">Fiyat: ${item.price.toLocaleString(
              "tr-TR"
            )}₺</p>
          </div>
          <button data-category="${categoryName}" data-img="${
        item.imageUrl
      }" data-index="${index}" data-price="${item.price}" data-width="${
        item.width || 0
      }" data-height="${item.height || 0}" data-tag="${
        item.tag
      }" class="button-6 proButs">Seç</button>
        </div>`;
      break;
  }

  return itemHTML;
}

//ARTIS GÖSTERİMİ İÇİN
function updateItemSizesOnSelection() {
  Object.keys(categoriesData).forEach((categoryName) => {
    const mainCategory = getMainCategory(categoryName, categoriesData);
    const mainCategoryTotals = categoryTotals[mainCategory] || {};
    const category = categoriesData[categoryName]; // Kategori bilgilerini al

    // Sadece priceFormat 'artis' olduğunda çalış
    if (category.priceFormat !== "artis") {
      return; // Eğer priceFormat 'artis' değilse fonksiyonu sonlandır
    }

    const mainWidth = mainCategoryTotals.width || 0;
    const mainHeight = mainCategoryTotals.height || 0;
    const mainArea = mainWidth * mainHeight;
    // const totalAreaDifference = alanFarkiArray[alanFarkiArray.length - 1]
    const items = document.querySelectorAll(`#${categoryName} .focus-item`);

    let anySelected = false; // Seçilen öğe olup olmadığını kontrol etmek için bir bayrak

    items.forEach((item) => {
      const itemButton = item.querySelector(".proButs");
      const width = parseFloat(itemButton.getAttribute("data-width")) || 0;
      const height = parseFloat(itemButton.getAttribute("data-height")) || 0;
      const price = parseFloat(itemButton.getAttribute("data-price")) || 0;
      const isSelected = itemButton.classList.contains("selected");
      // Öğenin seçili olup olmadığını kontrol et

      if (isSelected) {
        anySelected = true; // Eğer bir öğe seçiliyse bayrağı güncelle
      }

      // Kategori başına isSelected false olduğunda
      if (!isSelected) {
        // const totalAreaDifference = alanFarkiArray[alanFarkiArray.length - 1]
        if ((isNaN(width) || width === 0) && (isNaN(height) || height === 0)) {
          // Hem width hem de height değeri NaN veya 0 olan öğeler
          const newArea = (mainWidth + width) * (mainHeight + height);
          item.querySelector(".sizes__title").textContent = `${
            mainWidth + width
          }x${mainHeight + height}`;
          item.querySelector(".sizes__size").textContent = ` ${
            (mainWidth + width) * (mainHeight + height)
          }m²`;
          item.querySelector(
            ".sizes__paragh"
          ).innerHTML = `Fark:<br><span style="color: green;">+${(
            ((mainWidth + width) * (mainHeight + height) - mainArea) *
            price
          ).toLocaleString("tr-TR")}₺</span>`;
        } else {
          // Hem width hem de height geçerli
          const newArea = (mainWidth + width) * (mainHeight + height); // Alanı hesapla
          item.querySelector(".sizes__title").textContent = `${
            mainWidth + width
          }x${mainHeight + height}`;
          item.querySelector(".sizes__size").textContent = ` ${
            (mainWidth + width) * (mainHeight + height)
          }m²`;
          item.querySelector(
            ".sizes__paragh"
          ).innerHTML = `Fark:<br><span style="color:green;">+${(
            ((mainWidth + width) * (mainHeight + height) - mainArea) *
            price
          ).toLocaleString("tr-TR")}₺</span>`;
        }
      } else {
        // Kategori başına isSelected true olduğunda
        // alanFarkiArray içindeki değerlerin toplamı

        if ((isNaN(width) || width === 0) && (isNaN(height) || height === 0)) {
          // Seçilen öğenin width veya height değeri NaN veya 0 ise
          items.forEach((innerItem) => {
            const innerButton = innerItem.querySelector(".proButs");
            const innerWidth =
              parseFloat(innerButton.getAttribute("data-width")) || 0;
            const innerHeight =
              parseFloat(innerButton.getAttribute("data-height")) || 0;
            const innerPrice =
              parseFloat(innerButton.getAttribute("data-price")) || 0;
            if (
              (isNaN(innerWidth) || innerWidth === 0) &&
              (isNaN(innerHeight) || innerHeight === 0)
            ) {
              // Width veya height değeri NaN veya 0 olan diğer öğeler
              const newArea = (mainWidth + width) * (mainHeight + height);
              innerItem.querySelector(".sizes__title").textContent = `${
                mainWidth + width
              }x${mainHeight + height}`;
              innerItem.querySelector(".sizes__size").textContent = ` ${
                (mainWidth + width) * (mainHeight + height)
              }m²`;
              innerItem.querySelector(
                ".sizes__paragh"
              ).innerHTML = `Fark:<br><span style="color:green;">+${(
                ((mainWidth + width) * (mainHeight + height) - mainArea) *
                price
              ).toLocaleString("tr-TR")}₺</span>`;
            } else {
              // Width veya height değeri tanımlı (geçerli) olan diğer öğeler
              const newArea = (mainWidth + width) * (mainHeight + height);
              innerItem.querySelector(".sizes__title").textContent = `${
                mainWidth + width
              }x${mainHeight + height}`;
              innerItem.querySelector(".sizes__size").textContent = ` ${
                (mainWidth + width) * (mainHeight + height)
              }m²`;
              innerItem.querySelector(
                ".sizes__paragh"
              ).textContent = `Fark:<br><span style="color:green;">+${(
                ((mainWidth + width) * (mainHeight + height) - mainArea) *
                price
              ).toLocaleString("tr-TR")}₺</span>`;
            }
          });
        } else {
          // Seçilen öğenin width veya height değeri tanımlı (geçerli) ise
          items.forEach((innerItem) => {
            // const totalAreaDifference = alanFarkiArray[alanFarkiArray.length - 1]
            const innerButton = innerItem.querySelector(".proButs");
            const innerWidth =
              parseFloat(innerButton.getAttribute("data-width")) || 0;
            const innerHeight =
              parseFloat(innerButton.getAttribute("data-height")) || 0;
            const newArea =
              (mainWidth + innerWidth) * (mainHeight + innerHeight);
            const innerPrice = parseFloat(
              innerButton.getAttribute("data-price")
            );
            // Alanı hesapla

            if (
              (isNaN(innerWidth) || innerWidth === 0) &&
              (isNaN(innerHeight) || innerHeight === 0)
            ) {
              innerItem.querySelector(".sizes__title").textContent = `${
                mainWidth - width
              }x${mainHeight - height}`;
              innerItem.querySelector(".sizes__size").textContent = ` ${
                (mainWidth - width) * (mainHeight - height)
              }m²`;
              innerItem.querySelector(
                ".sizes__paragh"
              ).innerHTML = `Fark:<br><span style="color:red;">-${(
                ((mainWidth + width) * (mainHeight + height) - mainArea) *
                price
              ).toLocaleString("tr-TR")}₺</span>`;
            } else {
              innerItem.querySelector(
                ".sizes__title"
              ).textContent = `${mainWidth}x${mainHeight}`;
              innerItem.querySelector(
                ".sizes__size"
              ).textContent = ` ${mainArea}m²`;
              innerItem.querySelector(
                ".sizes__paragh"
              ).innerHTML = `Fark:<br><span style="color:green;">+0₺</span>`;
              //  ${(((mainWidth + width)*(mainHeight +height) - mainArea)*price).toLocaleString("tr-TR")}
            }
          });
        }
      }
    });
  });
}
document.addEventListener("click", updateItemSizesOnSelection);
// Add event listeners to buttons
function addEventListeners(categoriesData) {
  document.querySelectorAll(".proButs").forEach((button) => {
    button.addEventListener("click", () => {
      handleItemClick(button, categoriesData);
      updateItemSizesOnSelection();
    });
  });
}
function handleItemClick(button, categoriesData) {
  const categoryName = button.getAttribute("data-category");
  const mainCategory = getMainCategory(categoryName, categoriesData);
  const category = categoriesData[categoryName];
  const tags = button
    .getAttribute("data-tag")
    .split(",")
    .map((t) => t.trim());
  if (!mainCategory || button.dataset.processing) return;
  button.dataset.processing = true;

  requestAnimationFrame(() => {
    if (category.select === "singleSelect") {
      const currentSelected = selectedItemsPerCategory[categoryName];
      if (currentSelected && currentSelected !== button) {
        deselectItem(currentSelected, categoryName, mainCategory);
      }
    }

    if (button.classList.contains("selected")) {
      deselectItem(button, categoryName, mainCategory);
      hideSubcategoriesRecursively(categoryName, categoriesData);
    } else {
      // Eğer kategori multiSelect ise, sadece seçimi yap
      if (category.select === "multiSelect") {
        selectItem(button, categoryName, mainCategory);
      } else {
        // Eğer buton seçili değilse, select işlemi yap
        const currentSelected = selectedItemsPerCategory[categoryName];
        if (currentSelected) {
          deselectItem(currentSelected, categoryName, mainCategory);
          hideSubcategoriesRecursively(categoryName, categoriesData);
        }
        selectItem(button, categoryName, mainCategory);
      }
      renderSubcategoriesRecursively(categoryName, categoriesData);
    }

    updateAffectedCategories(
      getAffectedCategories(categoryName, categoriesData),
      categoriesData
    );
    updateTotalPrice();
    logCategoryTotals();
    updateAllPrices(mainCategory);
    // Seçilen ürünleri güncelle
    updateItemSizesOnSelection();
    updateSelectedProductsDisplay();
    
    filterCategoriesByTags();
    delete button.dataset.processing;
  });
}

function clearSubcategorySelections(parentCategoryName) {
  Object.keys(categoriesData).forEach((categoryName) => {
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
    Object.keys(categoriesData).forEach((cat) => {
      if (categoriesData[cat].parentCategory === category.parentCategory) {
        affected.add(cat);
      }
    });
  } else {
    // Ana kategori ise, kendisini ve alt kategorilerini ekle
    affected.add(categoryName);
    Object.keys(categoriesData).forEach((cat) => {
      if (categoriesData[cat].parentCategory === categoryName) {
        affected.add(cat);
      }
    });
  }

  return Array.from(affected);
}
function updateAllPrices(mainCategory) {
  const totalArea = categoryTotals[mainCategory].area;
  const currentPerimeter =
    (categoryTotals[mainCategory].width + categoryTotals[mainCategory].height) *
    2;

  // Ana kategorinin toplam fiyatını sıfırla
  categoryTotals[mainCategory].price = 0;

  // Her bir öğe için fiyat hesapla
  categoryTotals[mainCategory].items.forEach((item) => {
    const category = categoriesData[item.categoryName]; // Kategori bilgilerini al
    let calculatedPrice;

    // Fiyat formatına göre hesaplama yap
    switch (category.priceFormat) {
      case "tekil":
        calculatedPrice = item.basePrice; // Sadece basePrice kullanılır
        break;
      case "metrekare":
        calculatedPrice = item.basePrice * totalArea;
        break;
      case "cevre":
        calculatedPrice = item.basePrice * currentPerimeter;
        break;
      case "artis":
        const newWidth = currentWidth + (item.width || 0);
        const newHeight = currentHeight + (item.height || 0);
        const newArea = newWidth * newHeight;
        const previousArea = currentHeight * currentWidth;
        const alanFarki = newArea - previousArea;

        calculatedPrice = item.basePrice * (alanFarki > 0 ? alanFarki : 0);
        // const priceElement = document.querySelector(
        //   `#${item.categoryName} .sizes__paragh`
        // );
        // if (priceElement) {
        //   priceElement.textContent = `Fiyat: ${calculatedPrice.toLocaleString(
        //     "tr-TR"
        //   )}₺`;
        // }
        break;
      case "tasDuvar":
        const tasWidth = categoryTotals[mainCategory].width; // Bu değerlerin doğru alındığını kontrol edin
        const tasHeight = categoryTotals[mainCategory].height;
        const alanFiyat =
          parseFloat(item.button.getAttribute("data-alan-price")) || 0;
        const cevreFiyat =
          parseFloat(item.button.getAttribute("data-price")) || 0;
        const cevre = (tasHeight + tasWidth) * 2;
        const alan = tasHeight * tasWidth;

        // Yeni fiyat hesaplama yöntemi
        calculatedPrice = alan * alanFiyat + cevre * cevreFiyat;
        console.log("Hesaplama Süreci:");
        console.log(
          `Mevcut Genişlik: ${currentWidth}, Mevcut Yükseklik: ${currentHeight}, Çevre = ${cevre} , Alan = ${alanFiyat} Hesaplanan Fiyat = ${calculatedPrice}`
        );
      default:
        // calculatedPrice = item.basePrice; // Diğer durumlarda basePrice kullanılır
        break;
    }

    // Toplam   fiyatı güncelle
    categoryTotals[mainCategory].price += calculatedPrice;
  });
}

function updateAffectedCategories(categories, categoriesData) {
  categories.forEach((categoryName) => {
    const container = document.getElementById(categoryName);
    if (!container) return;

    const items = container.querySelectorAll(".focus-item");
    const selectedParentCategory = Object.keys(selectedTagsPerCategory).find(
      (cat) =>
        !categoriesData[cat].parentCategory &&
        categoriesData[categoryName].parentCategory === cat
    );

    items.forEach((item) => {
      if (selectedParentCategory) {
        const itemTags = item
          .getAttribute("data-tag")
          .split(",")
          .map((t) => t.trim());
        const parentTags =
          selectedTagsPerCategory[selectedParentCategory] || [];
        const hasMatchingTag =
          parentTags.length === 0 ||
          itemTags.some((tag) => parentTags.includes(tag));

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
    : (parseFloat(item.width) || 0) === 0
    ? 1
    : parseFloat(item.width);

  const height = category.parentCategory
    ? categoryTotals[mainCategory]?.height || 1
    : (parseFloat(item.height) || 0) === 0
    ? 1
    : parseFloat(item.height);

  let calculatedPrice;

  switch (category.priceFormat) {
    case "tekil":
      calculatePrice = item.price; // Tekil fiyat görünmeyecek
    case "metrekare":
      calculatedPrice = item.price * (width * height);
      break;
    case "cevre":
      calculatedPrice = item.price * ((width + height) * 2);
      break;
    case "artis":
      calculatedPrice = item.price * item.area;
      if (item.price < 0) {
        return 0;
      } else {
        const firstItemPrice =
          categoryTotals[mainCategory].items.length > 0
            ? categoryTotals[mainCategory].items[0].price
            : 0;

        calculatePrice -= firstItemPrice;
        // if (calculatePrice > 0) {
        //   calculatedPrice -= firstItemPrice; // İlk öğenin fiyatını çıkart
        //   break;
        // }
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
    const tag = button.getAttribute("data-tag");
    const parentDiv = button.closest(".focus-item");

    currentWidth = categoryTotals[mainCategory].width; // 2.5
    currentHeight = categoryTotals[mainCategory].height;
    // Update dimensions and area
    categoryTotals[mainCategory].previousArea =
      categoryTotals[mainCategory].width * categoryTotals[mainCategory].height;
    categoryTotals[mainCategory].width += width;
    categoryTotals[mainCategory].height += height;
    categoryTotals[mainCategory].area =
      categoryTotals[mainCategory].width * categoryTotals[mainCategory].height;
    // Calculate price
    let calculatedPrice = basePrice * categoryTotals[mainCategory].area; // Adjust based on your pricing logic

    button.classList.add("selected");
    parentDiv.classList.add("selected");

    // Add item to totals
    categoryTotals[mainCategory].price += calculatedPrice;
    categoryTotals[mainCategory].items.push({
      categoryName,
      price: calculatedPrice,
      basePrice,
      width,
      height,
      button,
      imageUrl: button.getAttribute("data-img"),
      title: parentDiv.querySelector(".sizes__title").textContent,
    });

    const tags = parentDiv
      .getAttribute("data-tag")
      .split(",")
      .map((t) => t.trim());

    selectedTagsPerCategory[categoryName] = tags;
    const eroTags = button.getAttribute("data-tag").split(/\s*,\s*(?:,\s*)*/);

    for (let i = 0; i < eroTags.length; i++) {
      let item = eroTags[i];
      console.log(item)
      selectedCategories.push(item);
    }
    console.log(selectedCategories);
    selectedItemsPerCategory[categoryName] = button;
    updateAllPrices(mainCategory);
    updateSelectedProductsDisplay();
    filterCategoriesByTags();
    updateItemSizesOnSelection();
  }
}

function deselectItem(button, categoryName, mainCategory) {
  if (!mainCategory || !categoryTotals[mainCategory]) {
    console.warn(`Main category not found: ${mainCategory}`);
    return;
  }

  if (button.classList.contains("selected")) {
    const category = categoriesData[categoryName];
    const basePrice = parseFloat(button.getAttribute("data-price")) || 0;
    const width = parseFloat(button.getAttribute("data-width")) || 0;
    const height = parseFloat(button.getAttribute("data-height")) || 0;
    const tag = button.getAttribute("data-tag");
    const newWidth = currentWidth + width; // yeni genişlik
    const newHeight = currentHeight + height; // yeni yükseklik
    const newArea = newWidth * newHeight; // yeni toplam alan
    const previousArea = currentHeight * currentWidth;
    const alanFarki = newArea - previousArea;
    // Update dimensions and area
    categoryTotals[mainCategory].width -= width;
    categoryTotals[mainCategory].height -= height;
    categoryTotals[mainCategory].area =
      categoryTotals[mainCategory].width * categoryTotals[mainCategory].height;

    // Calculate price

    let calculatedPrice = basePrice * categoryTotals[mainCategory].area; // Adjust based on your pricing logic

    button.classList.remove("selected");
    button.closest(".focus-item").classList.remove("selected");

    // Subtract price from totals
    categoryTotals[mainCategory].price -= calculatedPrice;
    categoryTotals[mainCategory].items = categoryTotals[
      mainCategory
    ].items.filter((item) => item.button !== button);
    const eroTags = button.getAttribute("data-tag").split(/\s*,\s*(?:,\s*)*/);
   eroTags.forEach(tags =>{
    const index = selectedCategories.indexOf(tags);
    if(index > -1){
      selectedCategories.splice(index, 1);
    }
   })
    
    console.log(selectedCategories);
    // Update prices for subcategories
    updateAllPrices(mainCategory);
    updateItemSizesOnSelection();
    filterCategoriesByTags();
   
  }
}

function filterCategoriesByTags() {
  const hasSelectedTags = selectedCategories.length > 0;

  // Her bir kategoriyi döngüye al ve seçilen etiketlere göre göster/gizle
  Object.entries(categoriesData).forEach(([categoryName, category]) => {
    const categoryElement = document.getElementById(
      `${categoryName}_container`
    );
    if (categoryElement) {
      const categoryTags = category.catTag || [];
      const matchesTags = categoryTags.some((tag) =>
        selectedCategories.includes(tag)
      );
      categoryElement.style.display =
        hasSelectedTags && !matchesTags ? "none" : "block";
    }
    filterCategoryItemsByTags(categoryName,categoriesData);
  });
  filterSidebarItemsByTags();
}
function filterCategoryItemsByTags(categoryName, categoriesData) {
  // selectedCategories dizisinden seçilen etiketleri al
  const selectedTags = selectedCategories; // Bu diziyi doğrudan kullanıyoruz
  const container = document.getElementById(categoryName);
  
  if (!container) return;

  const items = container.querySelectorAll(".focus-item");

  items.forEach((item) => {
    const itemTags = item.getAttribute("data-tag").split(",").map(t => t.trim());
    const hasMatchingTag = selectedTags.length === 0 || itemTags.some(tag => selectedTags.includes(tag));
    
    // Eşleşen etiket varsa öğeyi göster, aksi takdirde gizle
    item.style.display = hasMatchingTag ? "grid" : "none";
  });
}

function filterSidebarItemsByTags() {
  const hasSelectedTags = selectedCategories.length > 0;

  // Her bir sidebar butonunu döngüye al ve seçilen etiketlere göre göster/gizle
  const sidebarItems = document.querySelectorAll(".sidebar-item");
  sidebarItems.forEach((item) => {
    const button = item.querySelector("button");
    const categoryName = button.id.replace("__menu", ""); // Butonun ID'sinden kategori adını al
    const category = categoriesData[categoryName];

    if (category) {
      const categoryTags = category.catTag || [];
      const matchesTags = categoryTags.some((tag) =>
        selectedCategories.includes(tag)
      );

      // Eğer seçilen etiket yoksa veya etiket eşleşmiyorsa butonu gizle
      item.style.display = hasSelectedTags && !matchesTags ? "none" : "block";
    }
  });
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
  document.getElementById(
    "total"
  ).textContent = `${grandTotal.toLocaleString()}₺`;
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
  const totalSection = document.querySelector("#total__section");
  if (totalSection.style.display === "none") {
    totalSection.style.display = "block";
  }

  const grandTotal = Object.values(categoryTotals).reduce(
    (acc, curr) => acc + curr.price,
    0
  );
  const firstCategory = Object.values(categoryTotals)[0]; // İlk öğeyi al
  const grandTotalWidth = firstCategory?.width || 0; // İlk öğenin genişliği
  const grandTotalHeight = firstCategory?.height || 0;

  document.getElementById(
    "total"
  ).textContent = ` ${grandTotal.toLocaleString()}₺`;
  document.getElementById(
    "total-cevre"
  ).textContent = `${grandTotalWidth}x${grandTotalHeight} (${
    grandTotalHeight * grandTotalWidth
  }m²)`;
  if (document.getElementById("total").textContent === ` 0₺`) {
    totalSection.style.display = "none";
  }
}

function logCategoryTotals() {
  console.log("Category Totals:", {
    ...categoryTotals,
    details: Object.entries(categoryTotals).map(([category, data]) => ({
      category,
      items: data.items.map((item) => ({
        name: item.categoryName,
        basePrice: item.basePrice,
        calculatedPrice: item.calculatedPrice,
        dimensions: `${item.width}x${item.height}`,
        priceFormat: item.priceFormat,
        total: item.calculatedPrice,
      })),
    })),
  });
}

// Apply tags to next categories

// Filter items based on selected tags

// Check and deselect invalid items

function updateSubcategoryPrices(parentCategoryName) {
  const mainCategory = getMainCategory(parentCategoryName, categoriesData);
  const currentTotalArea = categoryTotals[mainCategory].area;
  const currentPerimeter =
    (categoryTotals[mainCategory].width + categoryTotals[mainCategory].height) *
    2;

  Object.keys(categoriesData).forEach((categoryName) => {
    if (categoriesData[categoryName].parentCategory === parentCategoryName) {
      const container = document.getElementById(categoryName);
      if (container) {
        const items = container.querySelectorAll(".focus-item");
        items.forEach((item) => {
          const priceElement = item.querySelector(".sizes__paragh");
          const button = item.querySelector(".proButs");
          const itemData =
            categoriesData[categoryName].documents[button.dataset.index];
          const basePrice = parseFloat(itemData.price) || 0;

          let calculatedPrice;
          if (categoriesData[categoryName].priceFormat === "metrekare") {
            calculatedPrice = basePrice * currentTotalArea;
          } else if (categoriesData[categoryName].priceFormat === "cevre") {
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



function updateSelectedProductsDisplay() {
  const sonucContainer = document.getElementById("sonuc__container");
  sonucContainer.innerHTML = ""; // Önce içeriği temizle

  const leftSide = document.createElement("div");
  leftSide.classList.add("left-part"); // Sol bölüm için sınıf ekleyin

  // Sol taraftaki ana kategorileri görüntüle
  const anaKategoriler = Object.entries(categoryTotals).filter(
    ([_, totals]) => {
      return !totals.parentCategory; // Ana kategorileri filtrele
    }
  );

  anaKategoriler.forEach(([mainCategory, totals]) => {
    if (totals.items.length > 0) {
      // Ana kategoriye ait ürünlerin görsellerini ekleyin
      totals.items.forEach((item) => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product-item");
        if (!totals.parentCategory) {
          const image = document.createElement("img");
          image.src = item.imageUrl; // Ürün görseli
          image.alt = item.title; // Ürün başlığı
          image.classList.add("product-image");

          productDiv.appendChild(image);
          leftSide.appendChild(productDiv);
        }
      });
    }
  });

  sonucContainer.appendChild(leftSide); // Sol bölümü sonuç konteynerine ekle

  const rightSide = document.createElement("div");
  rightSide.classList.add("right-side");

  // Alt kategorilerin isimlerini ve detaylarını gösteren bir bölüm oluşturun
  anaKategoriler.forEach(([mainCategory, totals]) => {
    totals.items.forEach((item) => {
      const detailsDiv = document.createElement("details");
      const summary = document.createElement("summary");
      const categoryTitle =
        categoriesData[item.categoryName]?.title || "Bilinmiyor"; // Kategori başlığını al
      summary.textContent = `${categoryTitle} - Fiyat: ${item.price.toLocaleString(
        "tr-TR"
      )} ₺`; // Fiyatı ekledik
      detailsDiv.appendChild(summary);

      const detailContent = document.createElement("div");
      detailContent.innerHTML = `
        <img src="${item.imageUrl}" alt="${item.title}" class="detail-image">
        <p>Boyut: ${item.width} x ${item.height} m</p>
        <p>Alan: ${item.area} m²</p>
      `;
      detailsDiv.appendChild(detailContent);
      rightSide.appendChild(detailsDiv);
      detailsDiv.classList.add("sonuc__details");
    });
  });

  sonucContainer.appendChild(rightSide); // Sağ bölümü sonuç konteynerine ekle

  // İletişim formunu ekleyin
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

  sonucContainer.insertAdjacentHTML("beforeend", formHTML);
}
// Detayları gösteren modal fonksiyonu
// Ana içerik alanına olay dinleyicisi ekleyin
document.querySelector('.main-content').addEventListener('click', function(event) {
  if (event.target.classList.contains('details-btn')) {
      const itemData = event.target.getAttribute('data-item');

      try {
          if (itemData) {
              const parsedItemData = JSON.parse(itemData);
              showDetails(parsedItemData);
          } else {
              console.error("Item data is null or undefined");
          }
      } catch (error) {
          console.error("Error parsing item data:", error);
      }
  }
});
// Modal gösterim işlevi
function showDetails(item) {
  if (!item) {
      console.error("Item is null or undefined");
      return;
  }

  // Modal içeriğini güncelle
  document.getElementById("modal-title").textContent = item.name;
  document.getElementById("modal-description").textContent = item.description;
  document.getElementById("modal-dimensions").textContent = `Boyut: ${item.width} x ${item.height} m`;
  document.getElementById("modal-area").textContent = `Alan: ${item.size} m²`;

  const carousel = document.getElementById("modal-carousel");
    carousel.innerHTML = ""; // Önceki içerikleri temizle

    item.images.forEach(imageUrl => {
        const imgElement = document.createElement("div");
        imgElement.classList.add("item"); // OwlCarousel için gerekli sınıf
        imgElement.innerHTML = `<img src="${imageUrl}" alt="${item.name}" class="modal-image">`;
        carousel.appendChild(imgElement);
    });

    // OwlCarousel'ı başlat
    $(carousel).owlCarousel({
      items: 1, // Her seferinde bir resim göster
      loop: true, // Dönme özelliği
      nav: true, // Önceki ve sonraki butonları göster
      dots: true, // Dots göstermek için
      autoplay: true, // Otomatik geçiş
      autoplayTimeout: 2000, // 2 saniyede bir geçiş
      autoplayHoverPause: true, // Fareyle üzerine gelindiğinde durdur
  });

  // Modal'ı göster
  const modal = document.getElementById("modal");
  modal.style.display = "block";

  // Kapatma butonuna tıklama olayını ekle
  const closeButton = modal.querySelector(".close-button");
  closeButton.onclick = function() {
    $(carousel).owlCarousel('destroy')
      modal.style.display = "none";
  };

  // Modal dışına tıklanıldığında kapatma
  window.onclick = function(event) {
      if (event.target === modal) {
          modal.style.display = "none";
      }
  };
}
// Initialize categories on page load
document.addEventListener("DOMContentLoaded", initializeCategories);

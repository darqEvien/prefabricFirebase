import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
const totalPriceSpan = document.querySelector("#total");
let selectedPrices = [];
let selectedItemsPerCategory = {}; // Kategori bazında seçilen öğeler
let categoryNames = []

async function initializeCategories() {
  try {
    const categoriesData = await fetchCategoriesData();

    for (const categoryName in categoriesData) {
      const category = categoriesData[categoryName]; // Category title ve documents al
      const items = category.documents; // Dokümanlar (ürünler)
      const resultButton = document.getElementById("sonucBtn");
      // Her kategori için title bilgisini ekleyelim
      categoriesDiv.innerHTML += `
        <h3 id="${categoryName}__title">${
        category.title || "Seçiniz"
      } Seçiniz.</h3>
        <div id="${categoryName}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>`;

      const container = document.getElementById(`${categoryName}`);
      const titles = category.title;

      categoryNames.push(categoryName)
    

      // Sidebar menüsüne butonu en üste ekleyelim
      sideMenu.insertAdjacentHTML(
        "beforebegin", // En üste ekler
        `<div class="sidebar-item">
      <button class="button-6" onclick="window.location='#${categoryName}Div'" id="${categoryName}__menu">${titles}</button>
    </div>`
      );

      items.forEach((item, index) => {
        const itemFiyat = JSON.stringify(item.price)
          .replace('"', "")
          .replace('"', "");
        const noktaliFiyat = itemFiyat.slice(0, -3) + "." + itemFiyat.slice(-3);
        
        // Butona data-category ve data-index attribute ekle
        container.innerHTML += `
          <div class="focus-item" id="${categoryName}Div">
            <div class="ero__ort">
              <div class="title__ort">
                <h2 class="sizes__title">${item.name}</h2>
              </div>
              <img class="product__img content__ort" src="${item.imageUrl}" alt="${item.name}">
            </div>
            <div class="sizes__desc">
              <i class="fa-solid fa-ruler-combined"><span class="sizes__size"> ${item.size}m²</span></i>
              <p class="sizes__paragh">Fiyat: ${noktaliFiyat}₺</p>
            </div>
            <button data-category="${categoryName}" data-index="${index}" data-price="${item.price}" class="button-6 proButs">Seç</button>
          </div>`;
      });
    }

    // Event listener ekle
    addButtonEventListeners(categoriesData); // categoriesData'yı da event listenerlara yolluyoruz
  } catch (error) {
    console.error("Kategorileri yüklerken hata oluştu:", error);
  }
}

function addButtonEventListeners(categoriesData) {
  // Dinamik olarak eklenen butonları seçiyoruz
  const secButs = document.querySelectorAll(".proButs");

  // Her butona click event dinleyicisi ekle
  secButs.forEach((button) => {
    button.addEventListener("click", () => {
      // data-category ve data-index attribute'larını al
      const categoryName = button.getAttribute("data-category");
      const index = button.getAttribute("data-index");
      const price = parseFloat(button.getAttribute("data-price"));

     
      const isSingleSelect = categoriesData[categoryName].select === "singleSelect"; // Kategorinin singleSelect olup olmadığını kontrol et

      // categoryName ile doğru div'i seç
      const parentDiv = button.closest(`#${categoryName}Div`);

      // Eğer buton zaten seçiliyse, seçimi kaldır
      if (button.classList.contains("selected")) {
        button.classList.remove("selected");
        parentDiv.classList.remove("selected"); // Parent'dan selected class'ını kaldır
        const priceIndex = selectedPrices.indexOf(price);
        if (priceIndex > -1) {
          selectedPrices.splice(priceIndex, 1); // Fiyatı listeden çıkar
        }
      } else {
        // Eğer singleSelect ise önceki seçimi iptal et
        if (isSingleSelect) {
          const previouslySelectedButton = selectedItemsPerCategory[categoryName];
          if (previouslySelectedButton && previouslySelectedButton !== button) {
            previouslySelectedButton.classList.remove("selected");
            const previousParentDiv = previouslySelectedButton.closest(`#${categoryName}Div`);
            previousParentDiv.classList.remove("selected"); // Önceki seçimi kaldır
            const previousPrice = parseFloat(previouslySelectedButton.getAttribute("data-price"));
            const priceIndex = selectedPrices.indexOf(previousPrice);
            if (priceIndex > -1) {
              selectedPrices.splice(priceIndex, 1); // Önceki fiyatı çıkar
            }
          }
          selectedItemsPerCategory[categoryName] = button; // Yeni seçimi kaydet
        }

        // Tıklanan butona ve parent div'ine "selected" class'ı ekle
        button.classList.add("selected");
        parentDiv.classList.add("selected");
        selectedPrices.push(price); // Fiyatı listeye ekle
      }
      updateTotalPrice();
      const currentIndex = categoryNames.indexOf(categoryName);
      const nextIndex = currentIndex + 1;

      if (nextIndex < categoryNames.length) {
        const nextCategoryName = categoryNames[nextIndex];
        // Bir sonraki kategoriye yönlendir
        window.location = `#${nextCategoryName}Div`;
      } else {
        console.log("Son kategoriye ulaştınız.");
      }
      console.log(
        `Kategori: ${categoryName}, Ürün indexi: ${index}, Fiyatı = ${price}`
      );
    });
  });
}

function updateTotalPrice() {
  // Seçilen tüm ürünlerin toplam fiyatını hesapla
  const totalPrice = selectedPrices.reduce((acc, curr) => acc + curr, 0);

  // Toplam fiyatı ekrana yazdır (örneğin bir div içinde gösterebilirsin)
  const totalPriceElement = document.getElementById("total");
  if (totalPriceElement) {
    totalPriceElement.textContent = `${totalPrice.toLocaleString()}₺`;
  }
}

// Sayfa yüklendiğinde kategorileri başlat
initializeCategories();

import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
const totalPriceSpan = document.querySelector("#total");
let selectedPrices = [];

async function initializeCategories() {
  try {
    const categoriesData = await fetchCategoriesData();

    for (const categoryName in categoriesData) {
      const category = categoriesData[categoryName]; // Category title ve documents al
      const items = category.documents; // Dokümanlar (ürünler)

      // Her kategori için title bilgisini ekleyelim
      categoriesDiv.innerHTML += `
        <h3 id="${categoryName}__title">${
        category.title || "Seçiniz"
      } Seçiniz.</h3>
        <div id="${categoryName}" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;"></div>`;

      const container = document.getElementById(`${categoryName}`);
      const titles = category.title;

      // Sidebar menüsüne buton ekleyelim
      sideMenu.innerHTML += `
      <div class="sidebar-item">
        <button class="button-6" onclick="window.location='#${categoryName}Div'" id="${categoryName}__menu">${titles}</button>
      </div>`;

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
    addButtonEventListeners();
  } catch (error) {
    console.error("Kategorileri yüklerken hata oluştu:", error);
  }
}

function addButtonEventListeners() {
  // Dinamik olarak eklenen butonları seçiyoruz
  const secButs = document.querySelectorAll(".proButs");

  // Her butona click event dinleyicisi ekle
  secButs.forEach((button) => {
    button.addEventListener("click", () => {
      // data-category ve data-index attribute'larını al
      const categoryName = button.getAttribute("data-category");
      const index = button.getAttribute("data-index");
      const price = parseFloat(button.getAttribute("data-price"));

      // categoryName ile doğru div'i seç
      const allFocusItems = document.querySelectorAll(`#${categoryName}Div`);
      allFocusItems.forEach((div) => div.classList.remove("selected"));

      // Tıklanan butonun parent div'ini seç ve "selected" class'ını ekle
      const parentDiv = button.closest(`#${categoryName}Div`);
      
      if (parentDiv) {
        parentDiv.classList.add("selected");
        
      }
      if (!button.classList.contains("selected")) {
        button.classList.add("selected");
        selectedPrices.push(price); // Fiyatı listeye ekle
      } else {
        // Eğer buton zaten seçiliyse seçimi kaldır, fiyatı çıkar
        button.classList.remove("selected");
        const priceIndex = selectedPrices.indexOf(price);
        if (priceIndex > -1) {
          selectedPrices.splice(priceIndex, 1); // Fiyatı listeden çıkar
        }
      }
      updateTotalPrice();
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

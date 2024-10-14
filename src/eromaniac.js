import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector(".main-content");
const sideMenu = document.querySelector("#sidebarMenu");
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
        <div id="${categoryName}" style="display: grid;grid-template-columns: repeat(3,1fr);gap: 10px;flex-direction: column;flex-wrap: wrap;align-items: center;"></div>`;
      const container = document.getElementById(`${categoryName}`);
      const titles = category.title;
      sideMenu.innerHTML += `
      <div class="sidebar-item">
      <button class="button-6 id="${categoryName}" onclick="window.location='${categoryName}Div'">${titles}</button>
  </div>
      `;
      items.forEach((item) => {
        const itemFiyat = JSON.stringify(item.price)
          .replace('"', "")
          .replace('"', "");
        const noktaliFiyat =
          itemFiyat.toString().slice(0, -3) +
          "." +
          itemFiyat.toString().slice(-3);

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
            <button onclick="verandaSayfasi()" class="button-6 proButs">Seç</button>
          </div>`;
      });
    }
  } catch (error) {
    console.error("Kategorileri yüklerken hata oluştu:", error);
  }
}

// Sayfa yüklendiğinde kategorileri başlat
initializeCategories();

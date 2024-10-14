import { doc } from "firebase/firestore";
import { fetchCategoriesData } from "../src/createCategoriesObjects";

const categoriesDiv = document.querySelector('.main-content')

async function initializeCategories() {
    try {
      const categoriesData = await fetchCategoriesData();
      for (const categoryName in categoriesData) {
        const items = categoriesData[categoryName];
        categoriesDiv.innerHTML += `
        <h3 id="${categoryName}__title">Seçiniz</h3>
        <div id="${categoryName}" style="display: grid;grid-template-columns: repeat(3,1fr);gap: 10px;flex-direction: column;flex-wrap: wrap;align-items: center;"></div>`
        
        console.log(`Kategori: ${categoryName}`, items);
  
        const container = document.getElementById(`${categoryName}`); 
       
        items.forEach((item) => {
          const itemFiyat = JSON.stringify(item.price).replace('"','').replace('"',''); 
          const noktaliFiyat = itemFiyat.toString().slice(0, -3) + "." + itemFiyat.toString().slice(-3);          
          
          container.innerHTML += `
              <div class="focus-item" id="${categoryName}Div">
              <div class="title__ort">
                <h2 class="sizes__title">${item.name}</h2>
                </div>
                <img class="product__img content__ort" src="${item.imageUrl}" alt="${item.name}">
                <div class="sizes__desc">
                <i class="fa-solid fa-ruler-combined"><span class="sizes__size"> ${item.size}m²</span></i>
                <p class="sizes__paragh">Fiyat: ${noktaliFiyat}₺</p>
                </div>
                <button id="" onclick="verandaSayfasi()" class="button-6 proButs">Seç</button>
              </div>
              
            `;
        });
      }
    } catch (error) {
      console.error("Kategorileri yüklerken hata oluştu:", error);
    }
  }
  
  // Sayfa yüklendiğinde kategorileri başlat
  
  initializeCategories();
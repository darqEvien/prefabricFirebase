import { doc } from "firebase/firestore";
import { fetchCategoriesData } from "../src/createCategoriesObjects";

const mainContent = document.querySelector(".main__content__html");
const categoriesDiv = document.querySelector('.main-content')
const productsContainer = document.getElementById("products__container");
const verandaContainer = document.getElementById("veranda__container");
const mutfakContainer = document.getElementById("mutfak__container");
const banyoContainer = document.getElementById("banyo__container");
const boyutBtn = document.getElementById("boyutBtn");
const verandaBtn = document.getElementById("verandaBtn");
const mutfakBtn = document.getElementById("mutfakBtn");
const banyoBtn = document.getElementById("banyoBtn");
const gunes_paneliBtn = document.getElementById("gunes_paneliBtn");
const sonucBtn = document.getElementById("sonucBtn");
const toplamFiyat = document.getElementById("total");
const mainBanner = document.getElementById("content__banner");
const verandaTitle = document.getElementById("varenda__title");
const mutfakTitle = document.getElementById("mutfak__title");
const banyoTitle = document.getElementById("banyo__title");
let mutfakFiyat = 10000;
let mutfakSecici = false;
let banyoFiyat = 15000;
let banyoSecici = false;
let jakuziFiyat = 50000;
let jakuziSecici = false;
let buzFiyat = 2500;
let buzSecici = false;
let totalPrice = 0;
let varPrice = 0;
let evPrice = 0;

// async function initializeCategories() {
//   try {
//     const categoriesData = await fetchCategoriesData();
//     for (const categoryName in categoriesData) {
//       const items = categoriesData[categoryName];
//       categoriesDiv.innerHTML += `
//       <div id="${categoryName}" style="display: grid;grid-template-columns: repeat(3,1fr);gap: 10px;flex-direction: column;flex-wrap: wrap;align-items: center;"></div>`
      
//       console.log(`Kategori: ${categoryName}`, items);

//       const container = document.getElementById(`${categoryName}`); 
//       items.forEach((item) => {
//         container.innerHTML += `
//             <div class="focus-item" id="${categoryName}Div">
//               <h2 class="sizes__title">${item.name}</h2>
//               <img class="product__img" src="${item.imageUrl}" alt="${item.name}">
//               <div class="sizes__desc">
//               <i class="fa-solid fa-ruler-combined"><span class="sizes__size"> ${item.size}</span></i>
//               <p class="sizes__paragh">Fiyat: ${item.price}₺</p>
//               </div>
//               <button id="" onclick="verandaSayfasi()" class="button-6 proButs">Seç</button>
//             </div>
//           `;
//       });
//     }
//   } catch (error) {
//     console.error("Kategorileri yüklerken hata oluştu:", error);
//   }
// }

// // Sayfa yüklendiğinde kategorileri başlat

// initializeCategories();

const prefabrikEvler = [
  {
    id: 1,
    name: "Veranda İstemiyorum",
    img: "./img/nocontent.png",
    price: "0",
    size: "0m²",
  },
  {
    id: 2,
    name: "2.5x4.6 Veranda Tek Katlı Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "48.000",
    size: "11.5m²",
  },
  {
    id: 3,
    name: "2.5x4.6 Veranda Sandviç Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "65.000",
    size: "11.5m²",
  },
  {
    id: 4,
    name: "2.5x7 Veranda Tek Katlı Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "70.000",
    size: "17.5m²",
  },
  {
    id: 5,
    name: "2.5x7 Veranda Sandviç Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "82.000",
    size: "17.5m²",
  },
];
const verandalar = [
  {
    id: 1,
    name: "Veranda İstemiyorum",
    img: "./img/nocontent.png",
    price: "0",
    size: "0m²",
  },
  {
    id: 2,
    name: "2.5x4.6 Veranda Tek Katlı Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "48.000",
    size: "11.5m²",
  },
  {
    id: 3,
    name: "2.5x4.6 Veranda Sandviç Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "65.000",
    size: "11.5m²",
  },
  {
    id: 4,
    name: "2.5x7 Veranda Tek Katlı Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "70.000",
    size: "17.5m²",
  },
  {
    id: 5,
    name: "2.5x7 Veranda Sandviç Panel Çatılı",
    img: "./Söz Çelik/veranda foto/veranda 1.png",
    price: "82.000",
    size: "17.5m²",
  },
];

window.onload = () => {
  urunSayfasi();
  prefabrikEvleriGetir();
  verandaContainer.style.display = "none";
  verandalariGetir();
  verandaTitle.style.display = "none";
  boyutBtn.click();
  mutfakTitle.style.display = "none";
  mutfakContainer.style.display = "none";
  mutfakGetir();
  banyoTitle.style.display = "none";
  banyoContainer.style.display = "none";
  banyoGetir();
};

const butonSifirla = () => {
  boyutBtn.classList.remove("selected_btn");
  verandaBtn.classList.remove("selected_btn");
  mutfakBtn.classList.remove("selected_btn");
  banyoBtn.classList.remove("selected_btn");
  gunes_paneliBtn.classList.remove("selected_btn");
  sonucBtn.classList.remove("selected_btn");
};

const fiyatConverted = () => {
  const convertedFiyat =
    totalPrice.toString().slice(0, -3) + "." + totalPrice.toString().slice(-3);
  toplamFiyat.textContent = `${convertedFiyat}₺`;
};

const prefabrikEvleriGetir = () => {
  prefabrikEvler.forEach(({ name, id, price, size }) => {
    productsContainer.innerHTML += `
                           <div class="focus-item" id="productsDiv">
                               <h2 class="sizes__title">${name}</h2>
                               <img class="product__img " src="./Söz Çelik/3x7 paylaşım/foto 1.png" alt="${name}">
                               <div class="sizes__desc">
                                   <i class="fa-solid fa-ruler-combined"><span class="sizes__size"> ${size}</span></i>
                                   <p class="sizes__paragh">${price}₺</p>
                               </div>
                               <button id="${id}" onclick="verandaSayfasi()" class="button-6 proButs">Seç</button>
                           </div>`;
  });
};
const verandalariGetir = () => {
  verandalar.forEach(({ name, id, price, size, img }) => {
    verandaContainer.innerHTML += `
                          
                            <div class="focus-item" id="veranDiv">
                              <div class="veranda__ort">
                               <h2 class="sizes__title">${name}</h2>
                               </div>
                               <img class="product__img veranda" src="${img}" alt="${name}">
                               <div class="sizes__desc">
                                   <i class="fa-solid fa-ruler-combined"><span class="sizes__size"> ${size}</span></i>
                                   <p class="sizes__paragh">${price}₺</p>
                               </div>
                               <button id="${id}" onclick="mutfakSayfasi(), banyoSayfasi()" class="button-6 varButs">Seç</button>
                            </div>
                           `;
  });
};
const mutfakGetir = () => {
  const mutfakConvertFiyat =
    mutfakFiyat.toString().slice(0, -3) +
    "." +
    mutfakFiyat.toString().slice(-3);
  const buzConvertFiyat =
    buzFiyat.toString().slice(0, -3) + "." + buzFiyat.toString().slice(-3);
  mutfakContainer.innerHTML += `
                    <div class="focus-item" id="mutfakDiv">
                    <form>
                        <div class="form-group">
                            <h2>Mutfak İster Misiniz?</h2>
                            <img class="mutImg" src="./Söz Çelik/3x7 paylaşım/foto 4.png" alt="Mutfak Fotoğrafı">
                            <div class="mutfakForm">
                                <input type="radio" id="mutYes" name="mutfak" value="Evet">
                                <input type="radio" id="mutNo" name="mutfak" value="Hayir" checked>
                                <label for="mutYes" class="option option-1">
                                    <div class="dot"></div><span>Evet</span><br><span><strong>${mutfakConvertFiyat}₺</strong></span>
                                </label>
                                <label for="mutNo" class="option option-2">
                                    <div class="dot"></div><span>Hayır</span>
                                </label>
                            </div>  
                    </form>
                    <div id="buzdolabiBolme">
                    <h2>Buzdolabı bölmesi İster Misiniz</h2>
                    <img class="mutImg" src="./Söz Çelik/3x8 model 2/foto 4.png" alt="Mutfak Fotoğrafı">
                    <div class="mutfakForm">
                                <input type="radio" id="buzYes" name="buzdolabi" value="Evet">
                                <input type="radio" id="buzNo" name="buzdolabi" value="Hayir" checked>
                                <label for="buzYes" class="option option-1">
                                    <div class="dot"></div><span>Evet</span><br><span><strong>${buzConvertFiyat}₺</strong></span>
                                </label>
                                <label for="buzNo" class="option option-2">
                                    <div class="dot"></div><span>Hayır</span>
                                </label>
                            </div>
                    </div>
                </div>
                         `;
};

const banyoGetir = () => {
  const banyoConvertFiyat =
    banyoFiyat.toString().slice(0, -3) + "." + banyoFiyat.toString().slice(-3);
  const jakuziFiyatConvertFiyat =
    jakuziFiyat.toString().slice(0, -3) +
    "." +
    jakuziFiyat.toString().slice(-3);
  banyoContainer.innerHTML += `
                    <div class="focus-item" id="banyoDiv">
                    <form>
                        <div class="form-group">
                            <h2>Banyo İster Misiniz?</h2>
                            <img class="mutImg" src="./Söz Çelik/3x7 paylaşım/foto 4.png" alt="Banyo Fotoğrafı">
                            <div class="mutfakForm">
                                <input type="radio" id="banyoYes" name="banyo" value="Evet">
                                <input type="radio" id="banyoNo" name="banyo" value="Hayir" checked>
                                <label for="banyoYes" class="option option-1">
                                    <div class="dot"></div><span>Evet</span><br><span><strong>${banyoConvertFiyat}₺</strong></span>
                                </label>
                                <label for="banyoNo" class="option option-2">
                                    <div class="dot"></div><span>Hayır</span>
                                </label>
                            </div>  
                    </form>
                    <div id="jakuziBolme">
                    <h2>Jakuzi İster Misiniz</h2>
                    <img class="mutImg" src="./Söz Çelik/3x8 model 2/foto 4.png" alt="Jakuzi Fotoğrafı">
                    <div class="mutfakForm">
                                <input type="radio" id="jakuziYes" name="jakuzi" value="Evet">
                                <input type="radio" id="jakuziNo" name="jakuzi" value="Hayir" checked>
                                <label for="jakuziYes" class="option option-1">
                                    <div class="dot"></div><span>Evet</span><br><span><strong>${jakuziFiyatConvertFiyat}₺</strong></span>
                                </label>
                                <label for="jakuziNo" class="option option-2">
                                    <div class="dot"></div><span>Hayır</span>
                                </label>
                            </div>
                    </div>
                </div>
                         `;
};

const urunSayfasi = () => {
  window.location = "#products__container";
  const secBut = document.querySelectorAll(`.proButs`);
  secBut.forEach((button) => {
    button.addEventListener("click", () => {
      const allFocusIems = document.querySelectorAll("#productsDiv");
      allFocusIems.forEach((div) => div.classList.remove("selected"));
      const parentDiv = button.parentElement;
      parentDiv.classList.add("selected");
      const selectedProductId = parseInt(button.id);
      const selectedProduct = prefabrikEvler.find(
        (product) => product.id === selectedProductId
      );
      if (selectedProduct) {
        totalPrice -= evPrice;
        evPrice = parseInt(selectedProduct.price.replace(/\D/g, ""));
        totalPrice += evPrice;
        fiyatConverted();
      }
    });
  });
};

const verandaSayfasi = () => {
  window.location = "#veranda__container";
  verandaTitle.style.display = "block";
  verandaContainer.style.display = "grid";
  butonSifirla();
  verandaBtn.classList.add("selected_btn");
  const secBut2 = document.querySelectorAll(`.varButs`);
  secBut2.forEach((button) => {
    button.addEventListener("click", () => {
      const verandaFocusItems = document.querySelectorAll("#veranDiv");
      verandaFocusItems.forEach((div) => div.classList.remove("selected"));
      const varParentDiv = button.parentElement;
      varParentDiv.classList.add("selected");
      const selectedProductId = parseInt(button.id);
      const selectedProduct = verandalar.find(
        (product) => product.id === selectedProductId
      );
      if (selectedProduct) {
        totalPrice -= varPrice;
        varPrice = parseInt(selectedProduct.price.replace(/\D/g, ""));
        totalPrice += varPrice;
        fiyatConverted();
      }
    });
  });
};
const mutfakSayfasi = () => {
  window.location = "#mutfak__container";
  mutfakTitle.style.display = "block";
  mutfakContainer.style.display = "grid";
  butonSifirla();
  mutfakBtn.classList.add("selected_btn");
  const mutYesRadio = document.getElementById("mutYes");
  const mutNoRadio = document.getElementById("mutNo");
  const buzYesRadio = document.getElementById("buzYes");
  const buzNoRadio = document.getElementById("buzNo");
  mutYesRadio.addEventListener("change", () => {
    window.location = "#buzdolabiBolme";
    if (mutYesRadio.checked && !mutfakSecici) {
      totalPrice += mutfakFiyat; // Mutfak fiyatı eklenir
      mutfakSecici = true; // Mutfak artık seçili
    }
    fiyatConverted();
    document.getElementById("buzdolabiBolme").style.display = "block";
    buzYesRadio.addEventListener("change", () => {
      if (buzYesRadio.checked && !buzSecici) {
        totalPrice += buzFiyat;
        buzSecici = true;
      }
      window.location = "#banyoDiv";
      fiyatConverted();
    });
  });
  mutNoRadio.addEventListener("change", () => {
    if (mutNoRadio.checked && mutfakSecici) {
      totalPrice -= mutfakFiyat; // Mutfak fiyatı eklenir
      mutfakSecici = false; // Mutfak artık seçili
    }
    window.location = "#banyoDiv";
    document.getElementById("buzdolabiBolme").style.display = "none";
    buzNoRadio.checked = true;
    if (buzSecici) {
      totalPrice -= buzFiyat;
      buzSecici = false;
    }
    fiyatConverted();
    window.location = "#banyoDiv";
  });
  buzNoRadio.addEventListener("change", () => {
    if (buzNoRadio.checked && buzSecici) {
      totalPrice -= buzFiyat;
      buzSecici = false;
    }
    window.location = "#banyoDiv";
    fiyatConverted();
  });
};

const banyoSayfasi = () => {
  banyoTitle.style.display = "block";
  banyoContainer.style.display = "grid";
  butonSifirla();
  banyoBtn.classList.add("selected_btn");
  const banyoYesRadio = document.getElementById("banyoYes");
  const banyoNoRadio = document.getElementById("banyoNo");
  const jakuziYesRadio = document.getElementById("jakuziYes");
  const jakuziNoRadio = document.getElementById("jakuziNo");
  banyoYesRadio.addEventListener("change", () => {
    window.location = "#jakuziBolme";
    if (banyoYesRadio.checked && !banyoSecici) {
      totalPrice += banyoFiyat; // Mutfak fiyatı eklenir
      banyoSecici = true; // Mutfak artık seçili
    }
    fiyatConverted();
    document.getElementById("jakuziBolme").style.display = "block";
    jakuziYesRadio.addEventListener("change", () => {
      if (jakuziYesRadio.checked && !jakuziSecici) {
        totalPrice += jakuziFiyat;
        jakuziSecici = true;
      }
      fiyatConverted();
    });
  });
  banyoNoRadio.addEventListener("change", () => {
    if (banyoNoRadio.checked && banyoSecici) {
      totalPrice -= banyoFiyat; // Mutfak fiyatı eklenir
      banyoSecici = false; // Mutfak artık seçili
    }
    document.getElementById("jakuziBolme").style.display = "none";
    jakuziNoRadio.checked = true;
    if (jakuziSecici) {
      totalPrice -= jakuziFiyat;
      jakuziSecici = false;
    }
    fiyatConverted();
  });
  jakuziNoRadio.addEventListener("change", () => {
    if (jakuziNoRadio.checked && jakuziSecici) {
      totalPrice -= jakuziFiyat;
      jakuziSecici = false;
    }
    fiyatConverted();
  });
};

boyutBtn.addEventListener("click", () => {
  window.location = "#products__container";
  butonSifirla();
  urunSayfasi();
  boyutBtn.classList.add("selected_btn");
});

verandaBtn.addEventListener("click", () => {
  butonSifirla();
  verandaBtn.classList.add("selected_btn");
  verandaSayfasi();
});
mutfakBtn.addEventListener("click", () => {
  butonSifirla();
  mutfakBtn.classList.add("selected_btn");
  mutfakSayfasi();
});

banyoBtn.addEventListener("click", () => {
  console.log("Helal");
  butonSifirla();
  banyoBtn.classList.add("selected_btn");
  banyoSayfasi();
});

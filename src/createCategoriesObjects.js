import { db } from './firebaseConfig'; // Firebase ayarlarını içeren dosya
import { collection, getDocs } from 'firebase/firestore';

let categoriesData = {}; // Kategorileri saklayacak

// Kategorileri al
async function getCategories() {
  const categoriesRef = collection(db, 'categories');
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    
  // Burada doc.data() fonksiyonu çağrılıyor
  }));
}

async function getCategoriesTitles() {
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoriesTitles = categoriesSnapshot.docs.map(doc => doc.data().title);
    return categoriesTitles;  // Title'ları döndürüyoruz
  } catch (error) {
    console.error("Kategorilerden veriler alınırken hata oluştu:", error);
    return [];
  }
}

// Örnek kullanım

// Belirli bir kategori içindeki belgeleri al
async function getDocumentsInCategory(categoryName) {
  const categoryRef = collection(db, categoryName);
  const snapshot = await getDocs(categoryRef);
  return snapshot.docs.map(doc => {
    const data = doc.data(); // Burada da doc.data() fonksiyonunu çağırıyoruz
    return {
      id: doc.id,
      ...data,
       // Data burada doğru bir şekilde alınıyor olmalı
    };
  });
}

// Kategorileri ve belgelerini oluştur
async function createCategoryObjects() {
  try {
    const categories = await getCategories();

    for (const category of categories) {
      const categoryName = category.propertyName; // propertyName al
      const documents = await getDocumentsInCategory(categoryName); // Dokümanları al

      // Dinamik obje oluştur
      categoriesData[categoryName] = documents.map(doc => ({
        id: doc.id,
        ...doc,
        
         // Doküman verilerini ekle
      }));
    }

    console.log(categoriesData); // Tüm kategorileri burada görebilirsin
  } catch (error) {
    console.error("Hata oluştu: ", error);
  }
  return categoriesData;
}


// Fonksiyonu çağır
createCategoryObjects();

export const fetchCategoriesData = async () => {
    return await createCategoryObjects();
  };// Diğer dosyalarda kullanılmak üzere dışa aktar

import { db } from './firebaseConfig'; // Firebase ayarlarını içeren dosya
import { collection, getDocs } from 'firebase/firestore';

let categoriesData = {}; // Kategorileri saklayacak

// Kategorileri al
async function getCategories() {
  const categoriesRef = collection(db, 'categories');
  const snapshot = await getDocs(categoriesRef);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    select: doc.data().select, // Select özelliğini ekledik
    ...doc.data(),
  }));
}

async function getCategoriesTitles(categoryName) {
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoriesTitles = categoriesSnapshot.docs.map(doc => doc.data().title);

    return categoriesTitles;  // Title'ları döndürüyoruz
  } catch (error) {
    console.error("Kategorilerden veriler alınırken hata oluştu:", error);
    return [];
  }
}

// Belirli bir kategori içindeki belgeleri al
async function getDocumentsInCategory(categoryName) {
  const categoryRef = collection(db, categoryName);
  const snapshot = await getDocs(categoryRef);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data, // Data ve select özelliği de alınıyor
    };
  });
}

// Kategorileri ve belgelerini oluştur
async function createCategoryObjects() {
  try {
    const categories = await getCategories();
    const categoriesTitles = await getCategoriesTitles();

    for (const category of categories) {
      const categoryName = category.propertyName; // propertyName al
      const documents = await getDocumentsInCategory(categoryName); // Dokümanları al

      categoriesData[categoryName] = {
        title: categoriesTitles.find(title => title === category.title), // Başlığı ekle
        select: category.select, // Select özelliğini ekledik
        documents: documents.map(doc => ({
          id: doc.id,
          ...doc,
        })),
      };      
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
}; // Diğer dosyalarda kullanılmak üzere dışa aktar

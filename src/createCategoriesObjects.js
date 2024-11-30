import { db } from "./firebaseConfig";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

let categoriesData = {};

async function getCategories() {
  const cq = query(collection(db, "categories"), orderBy("order"));
  const snapshot = await getDocs(cq);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    select: doc.data().select,
    parentCategory: doc.data().parentCategory,
    priceFormat: doc.data().priceFormat,
    catTag: doc.data().tags,
    accessibility: doc.data().accessibility !== undefined ? doc.data().accessibility : false,// Yeni eklenen alan
    ...doc.data(),
  }));
}

async function getCategoriesTitles(categoryName) {
  try {
    const categoriesSnapshot = await getDocs(collection(db, "categories"));
    const categoriesTitles = categoriesSnapshot.docs.map(
      (doc) => doc.data().title
    );
    return categoriesTitles;
  } catch (error) {
    console.error("Kategorilerden veriler alınırken hata oluştu:", error);
    return [];
  }
}

async function getDocumentsInCategory(categoryName) {
  const categoryRef = collection(db, categoryName);
  const snapshot = await getDocs(categoryRef);
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      width: data.width, // Geçerli bir sayı değilse 0 atayın
      height: data.height, 
      images: data.images || [],
      accessibility: data.accessibility,
      ...data,
    };
  });
}

async function createCategoryObjects() {
  try {
    const categories = await getCategories();
    const categoriesTitles = await getCategoriesTitles();

    for (const category of categories) {
      const categoryName = category.propertyName;
      const documents = await getDocumentsInCategory(categoryName);
      if(category.accessibility){
        categoriesData[categoryName] = {
          title: categoriesTitles.find((title) => title === category.title),
          select: category.select,
          parentCategory: category.parentCategory,
          priceFormat: category.priceFormat,
          catTag: category.tags,
          documents: documents.map((doc) => ({
            id: doc.id,
            ...doc,
            alanPrice: doc.alanPrice || 0,
            // Eğer priceFormat 'tekil' veya 'metrekare' ise ve width ve height varsa, alanı hesapla
            area: (category.priceFormat === 'tekil' || category.priceFormat === 'metrekare') && doc.width && doc.height
              ? doc.width * doc.height
              : null,
            // Eğer priceFormat 'cevre' ise ve width ve height varsa, çevreyi hesapla
            perimeter: category.priceFormat === 'cevre' && doc.width && doc.height
              ? 2 * (doc.width + doc.height)
              : null,
          })),
        };
      }
      
    }

    console.log(categoriesData);
  } catch (error) {
    console.error("Hata oluştu: ", error);
  }
  return categoriesData;
}

export const fetchCategoriesData = async () => {
  return await createCategoryObjects();

};

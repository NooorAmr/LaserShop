// ============================================================
// admin.js — Admin panel: auth + imgbb URL + Firestore CRUD
// ============================================================
import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { addProduct, fetchProducts, updateProduct, deleteProduct } from "./products.js";

let loginSection, dashboardSection, productsList;
let editingId  = null;
let allProducts = [];

export function initAdmin() {
  loginSection     = document.getElementById("loginSection");
  dashboardSection = document.getElementById("dashboardSection");
  productsList     = document.getElementById("productsList");

  onAuthStateChanged(auth, user => {
    if (user) { showDashboard(); loadProducts(); }
    else       { showLogin(); }
  });

  document.getElementById("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    const email    = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const errEl    = document.getElementById("loginError");
    errEl.textContent = "";
    try {
      setLoginLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      errEl.textContent = getAuthErrorMsg(err.code);
      setLoginLoading(false);
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
  });

  document.getElementById("productForm").addEventListener("submit", async e => {
    e.preventDefault();
    await handleSaveProduct();
  });

  document.getElementById("cancelEditBtn").addEventListener("click", resetForm);

  // Live image preview when user pastes imgbb link
  document.getElementById("pImageUrl").addEventListener("input", function () {
    const url = this.value.trim();
    if (url.startsWith("http")) {
      document.getElementById("imagePreview").src = url;
      document.getElementById("imagePreviewWrap").style.display = "block";
    } else {
      document.getElementById("imagePreviewWrap").style.display = "none";
    }
  });
}

function showLogin() {
  loginSection.style.display = "flex";
  dashboardSection.style.display = "none";
}
function showDashboard() {
  loginSection.style.display = "none";
  dashboardSection.style.display = "block";
}
function setLoginLoading(on) {
  const btn = document.getElementById("loginBtn");
  btn.disabled = on;
  btn.textContent = on ? "جاري الدخول..." : "دخول";
}
function setSaveLoading(on) {
  const btn = document.getElementById("saveBtn");
  btn.disabled = on;
  btn.textContent = on ? "جاري الحفظ..." : (editingId ? "💾 حفظ التعديلات" : "✅ إضافة المنتج");
}

async function loadProducts() {
  productsList.innerHTML = `<div class="admin-loading">جاري التحميل...</div>`;
  try {
    allProducts = await fetchProducts();
    renderAdminProducts();
    updateStats();
  } catch (e) {
    productsList.innerHTML = `<div class="admin-error">خطأ: ${e.message}</div>`;
  }
}

function renderAdminProducts() {
  if (!allProducts.length) {
    productsList.innerHTML = `<div class="admin-empty">لا توجد منتجات بعد. أضف أول منتج! 🛍</div>`;
    return;
  }
  productsList.innerHTML = allProducts.map(p => `
    <div class="admin-product-card" id="card-${p.id}">
      <div class="admin-product-img">
        ${p.imageUrl
          ? `<img src="${p.imageUrl}" alt="${p.nameAr}" onerror="this.parentElement.innerHTML='<div class=\\'admin-no-img\\'>خطأ في الصورة</div>'"/>`
          : `<div class="admin-no-img">بدون صورة</div>`}
      </div>
      <div class="admin-product-info">
        <div class="admin-product-name">${p.nameAr}</div>
        <div class="admin-product-name-en">${p.nameEn || ""}</div>
        <div class="admin-product-badge">${getBadgeLabel(p.badge)}</div>
      </div>
      <div class="admin-product-actions">
        <button class="admin-btn-edit" onclick="window.adminEdit('${p.id}')">
          <i class="bi bi-pencil-fill"></i> تعديل
        </button>
        <button class="admin-btn-delete" onclick="window.adminDelete('${p.id}')">
          <i class="bi bi-trash3-fill"></i> حذف
        </button>
      </div>
    </div>`).join("");
}

function getBadgeLabel(badge) {
  return { bestseller:"🔥 الأكثر مبيعًا", new:"✨ جديد", exclusive:"💜 تصميم حصري" }[badge] || "—";
}

function updateStats() {
  const t = document.getElementById("statTotal");
  const b = document.getElementById("statBestSeller");
  const f = document.getElementById("statFeatured");
  if (t) t.textContent = allProducts.length;
  if (b) b.textContent = allProducts.filter(p => p.isBestSeller).length;
  if (f) f.textContent = allProducts.filter(p => p.isFeatured).length;
}

async function handleSaveProduct() {
  const nameAr       = document.getElementById("pNameAr").value.trim();
  const nameEn       = document.getElementById("pNameEn").value.trim();
  const descAr       = document.getElementById("pDescAr").value.trim();
  const descEn       = document.getElementById("pDescEn").value.trim();
  const badge        = document.getElementById("pBadge").value;
  const isBestSeller = badge === "bestseller";
  const isFeatured   = document.getElementById("pFeatured").checked;
  const imageUrl     = document.getElementById("pImageUrl").value.trim();
  const statusEl     = document.getElementById("uploadStatus");

  if (!nameAr) { alert("⚠️ الاسم بالعربي مطلوب"); return; }

  if (!imageUrl) {
    statusEl.textContent = "⚠️ لا توجد صورة — سيظهر المنتج بدون صورة";
    statusEl.style.color = "#E2A855";
  } else {
    statusEl.textContent = "";
  }

  setSaveLoading(true);
  try {
    const productData = { nameAr, nameEn, descAr, descEn, badge, isBestSeller, isFeatured, imageUrl };
    if (editingId) {
      await updateProduct(editingId, productData);
      showToast("✅ تم تحديث المنتج بنجاح");
    } else {
      await addProduct(productData);
      showToast("✅ تم إضافة المنتج بنجاح");
    }
    resetForm();
    await loadProducts();
  } catch (err) {
    console.error(err);
    alert("حدث خطأ: " + err.message);
  } finally {
    setSaveLoading(false);
  }
}

window.adminEdit = function(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById("pNameAr").value    = p.nameAr   || "";
  document.getElementById("pNameEn").value    = p.nameEn   || "";
  document.getElementById("pDescAr").value    = p.descAr   || "";
  document.getElementById("pDescEn").value    = p.descEn   || "";
  document.getElementById("pBadge").value     = p.badge    || "";
  document.getElementById("pFeatured").checked = p.isFeatured || false;
  document.getElementById("pImageUrl").value  = p.imageUrl || "";
  if (p.imageUrl) {
    document.getElementById("imagePreview").src = p.imageUrl;
    document.getElementById("imagePreviewWrap").style.display = "block";
  }
  document.getElementById("formTitle").textContent      = "✏️ تعديل المنتج";
  document.getElementById("saveBtn").textContent        = "💾 حفظ التعديلات";
  document.getElementById("cancelEditBtn").style.display = "inline-flex";
  document.getElementById("productFormSection").scrollIntoView({ behavior: "smooth" });
};

window.adminDelete = async function(id) {
  if (!confirm("هل أنت متأكد من حذف هذا المنتج؟\nلا يمكن التراجع عن هذا الإجراء.")) return;
  try {
    await deleteProduct(id);
    showToast("🗑️ تم حذف المنتج بنجاح");
    await loadProducts();
  } catch (err) {
    alert("خطأ في الحذف: " + err.message);
  }
};

function resetForm() {
  editingId = null;
  document.getElementById("productForm").reset();
  document.getElementById("pImageUrl").value              = "";
  document.getElementById("imagePreviewWrap").style.display = "none";
  document.getElementById("imagePreview").src             = "";
  document.getElementById("formTitle").textContent        = "➕ إضافة منتج جديد";
  document.getElementById("saveBtn").textContent          = "✅ إضافة المنتج";
  document.getElementById("cancelEditBtn").style.display  = "none";
  document.getElementById("uploadStatus").textContent     = "";
}

function showToast(msg) {
  let t = document.getElementById("adminToast");
  if (!t) { t = document.createElement("div"); t.id = "adminToast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function getAuthErrorMsg(code) {
  return {
    "auth/invalid-email":      "البريد الإلكتروني غير صحيح",
    "auth/user-not-found":     "المستخدم غير موجود",
    "auth/wrong-password":     "كلمة المرور غير صحيحة",
    "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة",
    "auth/too-many-requests":  "تم تجاوز عدد المحاولات. حاول لاحقًا"
  }[code] || `خطأ: ${code}`;
}

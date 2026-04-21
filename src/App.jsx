import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [view, setView] = useState('home');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [name, setName] = useState('');
  const [photos, setPhotos] = useState([]); // Sekarang ini akan menyimpan File asli
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Link Vercel backend lu
  const API_URL = '/api/products'; 

  // ==========================================
  // KONFIGURASI CLOUDINARY (ISI DENGAN DATAMU)
  // ==========================================
  const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/du9rhqhep/image/upload';
  const CLOUDINARY_UPLOAD_PRESET = 'katalog_preset'; 

  useEffect(() => {
    fetchProducts();
  }, [view]);

  const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // FUNGSI 1: Hanya menyimpan file gambar asli saat dipilih (Tanpa kompresi)
  const handleImageChange = (e) => {
    // Mengambil file asli yang diupload user
    const files = Array.from(e.target.files);
    // Menambahkan file baru ke state photos tanpa merubah kualitasnya
    setPhotos(prev => [...prev, ...files]);
  };

  // FUNGSI 2: Upload ke Cloudinary lalu simpan ke Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || photos.length === 0) {
      alert('Nama dan minimal 1 foto wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Siapkan tempat untuk menyimpan link URL dari Cloudinary
      const uploadedImageUrls = [];

      // 2. Upload setiap foto satu per satu ke Cloudinary
      for (const file of photos) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const cloudinaryResponse = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData,
        });

        const cloudinaryData = await cloudinaryResponse.json();
        
        // Ambil link aman (secure_url) yang diberikan Cloudinary
        uploadedImageUrls.push(cloudinaryData.secure_url);
      }

      // 3. Setelah semua foto jadi URL, kirim datanya ke Vercel Backend / MongoDB
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: name, 
          photos: uploadedImageUrls // Kirim array URL, bukan Base64 lagi
        })
      });
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error proses data:', error);
      alert('Gagal mengirim data. Pastikan koneksi lancar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputAgain = () => {
    setName('');
    setPhotos([]);
    setShowSuccessModal(false);
  };

  const handleBackToHome = () => {
    setName('');
    setPhotos([]);
    setShowSuccessModal(false);
    setView('home');
  };

  const openDetail = (product) => {
    setSelectedProduct(product);
    setView('detail');
  };

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const Lightbox = () => {
    if (!lightboxImg) return null;
    return (
      <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
        <button className="close-btn">&times;</button>
        <img src={lightboxImg} alt="Enlarged" className="lightbox-image" />
      </div>
    );
  };

  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content fade-in">
          <div className="success-icon">✓</div>
          <h3>Berhasil!</h3>
          <p>Gambar resolusi tinggi telah di-upload ke Cloudinary dan data tersimpan.</p>
          <div className="modal-actions">
            <button className="btn-secondary" onClick={handleBackToHome}>Kembali ke Beranda</button>
            <button className="btn-primary" onClick={handleInputAgain}>Mau Input Lagi</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Lightbox />
      <SuccessModal />

      {view === 'home' && (
        <div className="view-container fade-in">
          <header className="header">
            <h1>Katalog Produk</h1>
            <button className="btn-primary" onClick={() => setView('add')}>
              + Tambah
            </button>
          </header>

          <div className="search-container fade-in">
            <input 
              type="text" 
              className="search-input"
              placeholder="🔍 Cari nama produk..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid-container">
            {filteredProducts.length === 0 ? (
              <p className="empty-state">
                {searchTerm ? 'Produk tidak ditemukan.' : 'Belum ada produk. Tambahkan sekarang.'}
              </p>
            ) : (
              filteredProducts.map((item) => (
                <div key={item._id} className="card compact-card" onClick={() => openDetail(item)}>
                  <div className="card-image-wrapper compact-image">
                    <img 
                      src={item.photos[0] || 'https://via.placeholder.com/300'} 
                      alt={item.name} 
                      className="card-image"
                    />
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">{item.name}</h3>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {view === 'add' && (
        <div className="view-container fade-in form-container">
          <header className="header-simple">
            <button className="btn-back" onClick={() => setView('home')}>&larr; Kembali</button>
            <h2>Tambah Produk Baru</h2>
          </header>

          <form onSubmit={handleSubmit} className="minimal-form">
            <div className="form-group">
              <label>Nama Produk</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Masukkan nama produk..."
                autoFocus
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label>Foto Produk Asli (Resolusi Tinggi)</label>
              <div className="file-upload-wrapper">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* PREVIEW GAMBAR ASLI MENGGUNAKAN OBJECT URL */}
            {photos.length > 0 && (
              <div className="preview-grid">
                {photos.map((file, index) => (
                  <img 
                    key={index} 
                    src={URL.createObjectURL(file)} 
                    alt="Preview" 
                    className="preview-thumb" 
                  />
                ))}
              </div>
            )}

            <button type="submit" className="btn-primary btn-block" disabled={isLoading}>
              {isLoading ? 'Mengunggah ke Cloudinary...' : 'Submit Produk'}
            </button>
          </form>
        </div>
      )}

      {view === 'detail' && selectedProduct && (
        <div className="view-container fade-in">
          <header className="header-simple">
            <button className="btn-back" onClick={() => setView('home')}>&larr; Kembali</button>
          </header>
          
          <div className="detail-content">
            <h1 className="detail-title">{selectedProduct.name}</h1>
            <p className="detail-subtitle">Klik gambar untuk memperbesar</p>

            <div className="detail-grid">
              {selectedProduct.photos.map((imgSrc, index) => (
                <div 
                  key={index} 
                  className="detail-image-wrapper"
                  onClick={() => setLightboxImg(imgSrc)}
                >
                  <img src={imgSrc} alt={`${selectedProduct.name} ${index}`} className="detail-image" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
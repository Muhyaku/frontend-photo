import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
  const [view, setView] = useState('home');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lightboxImg, setLightboxImg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // State untuk form & Pop-up
  const [name, setName] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const API_URL = 'https://photo-repo-dusky.vercel.app/api/products'; // Pastikan pakai link Vercel backend lu kalau udah live

  useEffect(() => {
    fetchProducts();
  }, [view]); // Auto-refresh saat balik ke home

const fetchProducts = async () => {
    try {
      const res = await fetch(API_URL);
      
      // Cek kalau API-nya ngasih respon error (misal 404 atau 500)
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // Sabuk Pengaman: Pastikan data yang ditarik BENAR-BENAR sebuah array
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        console.error('Data dari API bukan array bro:', data);
        setProducts([]); // Jadikan array kosong biar aman
      }
      
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]); // Kalau gagal fetch, pastikan products tetap array kosong
    }
  };
  
  // FUNGSI KOMPRESI GAMBAR SUPER CEPAT
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resolusi maksimal, pas buat HP dan Web
          const scaleSize = MAX_WIDTH / img.width;
          
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Kompres jadi format JPEG dengan kualitas 70% (ukuran file turun drastis, kualitas aman)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
      };
    });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    // Proses kompresi semua gambar yang dipilih
    const compressedImages = await Promise.all(
      files.map(file => compressImage(file))
    );
    
    setPhotos(prev => [...prev, ...compressedImages]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || photos.length === 0) {
      alert('Nama dan minimal 1 foto wajib diisi.');
      return;
    }

    setIsLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, photos })
      });
      
      // Tampilkan pop-up setelah sukses
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Gagal mengirim data. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi Action Pop-up
  const handleInputAgain = () => {
    setName('');
    setPhotos([]);
    setShowSuccessModal(false);
    // Tetap di view 'add'
  };

  const handleBackToHome = () => {
    setName('');
    setPhotos([]);
    setShowSuccessModal(false);
    setView('home'); // Pindah ke home, trigger useEffect untuk fetch ulang
  };

  const openDetail = (product) => {
    setSelectedProduct(product);
    setView('detail');
  };

// Pastikan 'products' itu beneran array sebelum di-filter
  const filteredProducts = Array.isArray(products) 
    ? products.filter(product => {
        const productName = product?.name || '';
        const search = searchTerm || '';
        return productName.toLowerCase().includes(search.toLowerCase());
      })
    : [];
    
  const Lightbox = () => {
    if (!lightboxImg) return null;
    return (
      <div className="lightbox-overlay" onClick={() => setLightboxImg(null)}>
        <button className="close-btn">&times;</button>
        <img src={lightboxImg} alt="Enlarged" className="lightbox-image" />
      </div>
    );
  };

  // Komponen Pop-up Modal
  const SuccessModal = () => {
    if (!showSuccessModal) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content fade-in">
          <div className="success-icon">✓</div>
          <h3>Berhasil!</h3>
          <p>Data produk telah tersimpan dengan cepat ke database.</p>
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

      {/* VIEW: HOME */}
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
                      src={item?.photos?.[0] || 'https://via.placeholder.com/300'}
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

      {/* VIEW: ADD PRODUCT */}
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
              <label>Foto Produk (Bisa lebih dari 1)</label>
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

            {photos.length > 0 && (
              <div className="preview-grid">
                {photos.map((src, index) => (
                  <img key={index} src={src} alt="Preview" className="preview-thumb" />
                ))}
              </div>
            )}

            <button type="submit" className="btn-primary btn-block" disabled={isLoading}>
              {isLoading ? 'Mengirim Data Cepat...' : 'Submit Produk'}
            </button>
          </form>
        </div>
      )}

      {/* VIEW: PRODUCT DETAIL */}
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
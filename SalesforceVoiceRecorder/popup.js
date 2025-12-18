document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusText = document.getElementById('status');

  // BAŞLAT BUTONU
  startBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "BASLAT"}, function(response) {
        
        if (chrome.runtime.lastError) {
            statusText.innerText = "Hata: Sayfayı yenileyip (F5) tekrar deneyin.";
            statusText.style.color = "orange";
            return;
        }

        // BUTONLARI DEĞİŞTİR
        startBtn.style.display = 'none';
        stopBtn.style.display = 'flex'; // Flex yaptık ki ortalansın
        
        // YENİ HTML İLE DURUM GÜNCELLEME (Yanıp sönen nokta)
        statusText.innerHTML = '<span class="recording-dot"></span> Kayıt Aktif! Konuşun...';
        statusText.style.color = "#c23934";
      });
    });
  });

  // DURDUR BUTONU
  stopBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "DURDUR"}, function(response) {
        
        // ESKİ HALİNE DÖN
        startBtn.style.display = 'flex';
        stopBtn.style.display = 'none';
        statusText.innerText = "✅ Dosya İndiriliyor...";
        statusText.style.color = "green";

        setTimeout(() => {
            statusText.innerText = "Hazır";
            statusText.style.color = "#706e6b";
        }, 3000);
      });
    });
  });
});
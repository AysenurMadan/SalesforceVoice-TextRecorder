// Global Değişkenler
let recognition = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let ignoreStop = false;
let activeInput = null; // O an yazdığımız kutucuğu tutacak değişken

// 1. MESAJ DİNLEYİCİSİ
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "BASLAT") {
        baslat();
        sendResponse({status: "Baslatildi"});
    } else if (request.action === "DURDUR") {
        bitir(); // Manuel durdurma
        sendResponse({status: "Durduruldu"});
    }
});

// 2. BAŞLATMA FONKSİYONU
async function baslat() {
    if (isRecording) return;
    
    // Aktif elementi yakala
    activeInput = document.activeElement;

    if (activeInput.tagName === 'BODY') {
        alert("Lütfen önce yazı yazılacak kutucuğa tıklayın!");
        return;
    }

    try {
        // --- BLUR LISTENER (YENİ ÖZELLİK) ---
        // Kutucuktan çıkıldığı an (başka yere tıklanınca) kaydı bitir.
        activeInput.addEventListener('blur', otomatikBitir);

        // --- SES KAYDI ---
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
        mediaRecorder.start();

        // --- KONUŞMA TANIMA ---
        setupRecognition(); 
        
        isRecording = true;
        ignoreStop = false; 
        recognition.start();
        
        console.log("Kayıt başladı. Kutudan çıkarsanız otomatik duracak.");

    } catch (error) {
        alert("Başlatma hatası: " + error.message);
        // Hata olursa listener'ı temizle
        if(activeInput) activeInput.removeEventListener('blur', otomatikBitir);
    }
}

// Otomatik durdurma tetikleyicisi
function otomatikBitir() {
    console.log("Odak kaybedildi, kayıt otomatik durduruluyor...");
    bitir();
}

// Speech API Ayarları
function setupRecognition() {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'tr-TR';

    recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const temizMetin = transcript.trim();
        
        if (temizMetin.length > 0) {
            // Yazma işlemi
            document.execCommand('insertText', false, temizMetin + " ");
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') return;
    };

    recognition.onend = () => {
        // Eğer kullanıcı durdurmadıysa ve hata yüzünden kapandıysa tekrar başlat
        if (isRecording && !ignoreStop) {
            try { recognition.start(); } catch (e) {}
        }
    };
}

// 3. BİTİRME FONKSİYONU
function bitir() {
    if (!isRecording) return;
    
    // Temizlik: Artık kutudan çıkmayı dinlemeyi bırak
    if (activeInput) {
        activeInput.removeEventListener('blur', otomatikBitir);
        activeInput = null;
    }

    ignoreStop = true; 
    isRecording = false;

    // Speech API Durdur
    if (recognition) {
        recognition.stop();
    }

    // Ses Kaydını İndir
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            const tarih = new Date().toISOString().slice(0,19).replace(/:/g,"-");
            a.download = `Kitoko_Voice_${tarih}.webm`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        };
    }
}
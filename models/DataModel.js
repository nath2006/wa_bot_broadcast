const GoogleSheetService = require('../services/GoogleSheetService');
const download = require('download');
const path = require('path');
const fs = require('fs');
const fileType = require('file-type'); // Untuk mendeteksi tipe file

exports.fetchContacts = async () => {
    try {
        return await GoogleSheetService.getContacts();
    } catch (error) {
        console.error('Gagal mengambil kontak:', error.message);
        throw error;
    }
};

exports.fetchMessageAndMedia = async () => {
    try {
        const { message, mediaUrl } = await GoogleSheetService.getMessageAndMedia();

        // Unduh media jika URL tersedia
        let mediaPath = null;
        if (mediaUrl) {
            const downloadsDir = path.resolve(__dirname, '../downloads');
            if (!fs.existsSync(downloadsDir)) {
                fs.mkdirSync(downloadsDir); // Buat folder jika belum ada
            }

            // Tentukan nama file berdasarkan URL media (cari nama file di URL)
            const mediaFileName = path.basename(mediaUrl); // Mengambil nama file dari URL
            const mediaFilePath = path.join(downloadsDir, mediaFileName);

            // Periksa apakah file sudah ada di folder unduhan
            if (fs.existsSync(mediaFilePath)) {
                console.log(`Media sudah ada: ${mediaFilePath}`);

                // Cek apakah URL media sesuai dengan file yang ada
                const existingFileName = path.basename(mediaFilePath);
                if (existingFileName === mediaFileName) {
                    // Nama file sama, tidak perlu unduh ulang
                    mediaPath = mediaFilePath;
                } else {
                    console.log(`Nama file tidak cocok. Mengunduh ulang media.`);
                    // Jika nama file berbeda, hapus file lama dan unduh ulang
                    fs.unlinkSync(mediaFilePath); // Hapus file lama
                    mediaPath = await downloadMedia(mediaUrl, downloadsDir);
                }
            } else {
                console.log(`Media belum ada. Mengunduh media...`);
                mediaPath = await downloadMedia(mediaUrl, downloadsDir);
            }
        }

        return { message, mediaPath };
    } catch (error) {
        console.error('Gagal mengambil pesan dan media:', error.message);
        throw error;
    }
};

// Fungsi untuk mengunduh media dan memberi nama yang sesuai dengan ekstensi yang benar
const downloadMedia = async (mediaUrl, downloadsDir) => {
    const tempFileName = `media-${Date.now()}`; // Nama sementara untuk file
    const tempFilePath = path.join(downloadsDir, tempFileName);

    try {
        // Unduh file tanpa ekstensi terlebih dahulu
        await download(mediaUrl, downloadsDir, { filename: tempFileName });

        // Deteksi tipe file setelah unduhan selesai
        const buffer = fs.readFileSync(tempFilePath);
        const detectedType = await fileType.fromBuffer(buffer);

        if (detectedType && detectedType.ext) {
            // Tentukan nama file final dengan ekstensi yang benar
            const finalFileName = `${tempFileName}.${detectedType.ext}`;
            const finalFilePath = path.join(downloadsDir, finalFileName);

            // Ganti nama file dengan ekstensi yang benar
            fs.renameSync(tempFilePath, finalFilePath);
            return finalFilePath;
        } else {
            console.warn('Tidak dapat mendeteksi tipe file. Menggunakan file tanpa ekstensi.');
            return tempFilePath; // Jika tipe file tidak terdeteksi
        }
    } catch (downloadError) {
        console.error('Gagal mengunduh media:', downloadError.message);
        throw downloadError;
    }
};
